export interface InsightRequest {
  summary: {
    totalIncome: string;
    totalExpenses: string;
    netBalance: string;
    categoryBreakdown: Array<{
      category: string;
      total: string;
      count: number;
    }>;
    transactionCount: number;
    dateRange: { start: string; end: string };
  };
  previousPeriod?: {
    totalIncome: string;
    totalExpenses: string;
  };
}

export interface InsightResponse {
  insights: string;
  suggestions: string[];
  flags: string[];
  generatedAt: string;
}

export interface AIModelAdapter {
  generateInsights(request: InsightRequest): Promise<InsightResponse>;
}

export class MockAIAdapter implements AIModelAdapter {
  async generateInsights(request: InsightRequest): Promise<InsightResponse> {
    const { summary } = request;
    return {
      insights: `Your expenses for the period were $${summary.totalExpenses} with ${summary.transactionCount} transactions. Consider reviewing top categories.`,
      suggestions: [
        'Review Food expenses and try reducing by 10%',
        'Set a weekly grocery budget and track progress',
        'Consider automating savings with a small transfer each payday',
      ],
      flags: summary.categoryBreakdown.filter(c => parseFloat(c.total) > Number(summary.totalExpenses) * 0.3).map(c => `High spend in ${c.category}`),
      generatedAt: new Date().toISOString(),
    };
  }
}

export class OpenAIAdapter implements AIModelAdapter {
  private apiKey: string;
  constructor(apiKey: string) { this.apiKey = apiKey; }

  async generateInsights(_request: InsightRequest): Promise<InsightResponse> {
    // Placeholder implementation. Production should call OpenAI/Anthropic SDKs.
    // Keep mock-like behavior when no provider is configured.
    return {
      insights: 'AI provider not configured in this environment. Install and configure OPENAI_API_KEY to enable.',
      suggestions: [],
      flags: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

export function createAIAdapter(): AIModelAdapter {
  const provider = process.env.AI_MODEL_PROVIDER || 'mock';
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY not set');
    return new OpenAIAdapter(key);
  }
  return new MockAIAdapter();
}
