import { describe, it, expect, beforeEach } from 'vitest';
import { financeService } from '../../server/services/finance';
import { storage } from '../../server/storage';

describe('FinanceService unit tests', () => {
  beforeEach(() => {
    // reset storage in-memory demo data
    // storage is an in-memory MemStorage and already has demo data; no-op for now
  });

  it('getSpendingSummary returns array', async () => {
    const res = await financeService.getSpendingSummary('demo-user-1');
    expect(Array.isArray(res)).toBe(true);
  });

  it('getTrends returns array of data points', async () => {
    const res = await financeService.getTrends('demo-user-1', 'monthly', 3);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]).toHaveProperty('date');
  });
});
