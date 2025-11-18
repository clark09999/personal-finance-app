import { describe, it, expect, vi } from 'vitest';
import { Repository } from '../../server/db/repository';
import { cache } from '../../server/services/cache';

describe('Repository cache branches', () => {
  it('returns cached transactions when cache has data', async () => {
    const repo = new Repository();
    const userId = 'demo-user-1';
    const fake = [{ id: 't1', userId, amount: '10', description: 'x', categoryId: '', date: new Date(), type: 'expense' }];
    const spy = vi.spyOn(cache, 'get').mockResolvedValue(fake as any);

    const res = await repo.getTransactions(userId);
    expect(res).toEqual(fake);

    spy.mockRestore();
  });

  it('throws on createTransaction DB failure', async () => {
    const repo = new Repository();
    const origInsert = (repo as any).db?.insert;
    // simulate db insert throwing by accessing db module and overriding insert
    const db = (await import('../../server/db/index')).db as any;
    const origDbInsert = db.insert;
    db.insert = () => { throw new Error('insert failed'); };

    await expect(repo.createTransaction({ userId: 'u', amount: 10, description: 'd', categoryId: '', date: new Date(), type: 'expense' } as any)).rejects.toBeTruthy();

    db.insert = origDbInsert;
    if (origInsert) (repo as any).db.insert = origInsert;
  });
});
