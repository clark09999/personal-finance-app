import { createAIAdapter, type InsightRequest, type InsightResponse } from './modelAdapter';
import { storage } from '../storage';
import { log } from '../index';

const REDIS_URL = process.env.REDIS_URL || '';

// Simple in-memory queue fallback when Redis/bull is not available
type InsightJob = { userId: string; startDate: string; endDate: string };

const inMemoryQueue: InsightJob[] = [];
let processing = false;

async function processJob(job: InsightJob) {
  try {
    log(`Processing AI insights job for user ${job.userId}`,'ai');

    // Fetch aggregated data from storage (storage provides anonymized summary)
    const summary = await storage.getSpendingSummary(job.userId);
    const transactionCount = (await storage.getTransactions(job.userId)).length;

    const request: InsightRequest = {
      summary: {
        totalIncome: '0',
        totalExpenses: String(summary.reduce((s:any, c:any) => s + (c.amount || 0), 0)),
        netBalance: '0',
        categoryBreakdown: summary.map((c:any) => ({ category: c.category, total: String(c.amount), count: c.transaction_count ?? 0 })),
        transactionCount,
        dateRange: { start: job.startDate, end: job.endDate },
      }
    };

    const adapter = createAIAdapter();
    const response: InsightResponse = await adapter.generateInsights(request);

    // Store insight using storage layer
    await storage.saveInsight({
      userId: job.userId,
      insights: response.insights,
      suggestions: JSON.stringify(response.suggestions || []),
      flags: JSON.stringify(response.flags || []),
      periodStart: job.startDate,
      periodEnd: job.endDate,
      generatedAt: response.generatedAt,
    });

    log(`AI insights stored for user ${job.userId}`,'ai');
  } catch (err) {
    console.error('AI insights job failed', err);
  }
}

async function runQueueLoop() {
  if (processing) return;
  processing = true;
  while (inMemoryQueue.length > 0) {
    const job = inMemoryQueue.shift()!;
    await processJob(job);
  }
  processing = false;
}

export const insightsService = {
  async requestInsights(userId: string, startDate: string, endDate: string) {
    // Check for recent insight (24h) to avoid regenerating
    const recent = await storage.getLatestInsight(userId);
    if (recent) {
      const age = Date.now() - new Date(recent.generatedAt).getTime();
      if (age < 24 * 60 * 60 * 1000) return 'recent';
    }

    inMemoryQueue.push({ userId, startDate, endDate });
    // Start processing in background
    setImmediate(runQueueLoop);
    return String(Date.now());
  },

  async getInsights(userId: string) {
    return storage.getLatestInsight(userId);
  },
};
