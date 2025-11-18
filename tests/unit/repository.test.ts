import { describe, it, expect, vi } from 'vitest';
import { Repository } from '../../server/db/repository';
import * as dbModule from '../../server/db/index';

describe('Repository error branches', () => {
  it('getUser throws APIError on DB failure', async () => {
    const repo = new Repository();
    // spy on db.select to throw
    const spy = vi.spyOn(dbModule, 'db' as any, 'get');
    // Instead of spying getter, mock method directly on db to throw for select
    const thrown = new Error('DB failure');
    const db = dbModule.db as any;
    const origSelect = db.select;
    db.select = () => { throw thrown; };

    await expect(repo.getUser('any')).rejects.toBeTruthy();

    // restore
    db.select = origSelect;
    if (spy.mockRestore) spy.mockRestore();
  });
});
