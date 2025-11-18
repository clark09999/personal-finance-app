import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { AsyncLocalStorage } from 'async_hooks';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Create a tracer for our application
const tracer = trace.getTracer('finance-flow');

// Store for request context
const asyncLocalStorage = new AsyncLocalStorage();

interface TracingOptions {
  operation: string;
  module: string;
  userId?: string;
}

interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  module: string;
  userId?: string;
}

class ObservabilityService {
  private metrics: PerformanceMetrics[] = [];
  private static readonly METRICS_FLUSH_INTERVAL = 60000; // 1 minute

  constructor() {
    // Periodically flush metrics
    setInterval(() => this.flushMetrics(), ObservabilityService.METRICS_FLUSH_INTERVAL);
  }

  // Tracing wrapper for async functions
  async trace<T>(
    options: TracingOptions,
    operation: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(options.operation);
    
    span.setAttributes({
      module: options.module,
      userId: options.userId || 'anonymous',
      environment: env.NODE_ENV
    });

    const startTime = Date.now();
    let success = true;

    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      return result;
    } catch (error) {
      success = false;
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      span.end();

      this.recordMetric({
        operation: options.operation,
        duration,
        success,
        timestamp: new Date(),
        module: options.module,
        userId: options.userId
      });
    }
  }

  // Record performance metrics
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
  }

  // Flush metrics to logging/monitoring system
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToFlush = [...this.metrics];
    this.metrics = [];

    try {
      // Calculate aggregates
      const aggregates = this.calculateAggregates(metricsToFlush);
      
      // Log aggregates
      logger.info('Performance metrics', { aggregates });

      // In production, send to monitoring service
      if (env.NODE_ENV === 'production') {
        await this.sendToMonitoringService(aggregates);
      }
    } catch (error) {
      logger.error('Error flushing metrics:', error);
    }
  }

  private calculateAggregates(metrics: PerformanceMetrics[]) {
    const aggregates = new Map<string, {
      count: number;
      totalDuration: number;
      successCount: number;
      failureCount: number;
      avgDuration: number;
      successRate: number;
    }>();

    for (const metric of metrics) {
      const key = `${metric.module}:${metric.operation}`;
      const current = aggregates.get(key) || {
        count: 0,
        totalDuration: 0,
        successCount: 0,
        failureCount: 0,
        avgDuration: 0,
        successRate: 0
      };

      current.count++;
      current.totalDuration += metric.duration;
      if (metric.success) {
        current.successCount++;
      } else {
        current.failureCount++;
      }

      current.avgDuration = current.totalDuration / current.count;
      current.successRate = (current.successCount / current.count) * 100;

      aggregates.set(key, current);
    }

    return Object.fromEntries(aggregates);
  }

  private async sendToMonitoringService(aggregates: any): Promise<void> {
    // Implementation for sending to monitoring service (e.g., DataDog, New Relic)
    // This would be implemented based on the chosen monitoring service
  }

  // Get request context
  getRequestContext<T>(): T | undefined {
    return asyncLocalStorage.getStore() as T | undefined;
  }

  // Set request context
  setRequestContext<T>(context: T, operation: () => Promise<any>): Promise<any> {
    return asyncLocalStorage.run(context, operation);
  }
}

export const observability = new ObservabilityService();
