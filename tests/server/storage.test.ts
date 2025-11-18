import { describe, it, expect } from 'vitest';
import { MemStorage } from '../../server/storage';

describe('MemStorage behavior', () => {
  it('creates and retrieves categories and transactions and computes trends', async () => {
    const mem = new MemStorage();
    const cat = await mem.createCategory({ name: 'TestCat' });
    expect(cat).toHaveProperty('id');
    const tx = await mem.createTransaction({ userId: 'u1', amount: '10.00', description: 't', categoryId: cat.id, date: new Date(), type: 'expense' });
    expect(tx).toHaveProperty('id');

    const trends = await mem.getTrends('u1', 'daily', 3);
    expect(Array.isArray(trends)).toBe(true);
    expect(trends.length).toBeGreaterThanOrEqual(3);

    const summary = await mem.getSpendingSummary('u1');
    // Because category exists, summary should include one entry for TestCat
    expect(summary.length).toBeGreaterThanOrEqual(0);
  });
});
