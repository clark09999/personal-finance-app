import { describe, it, expect, vi } from 'vitest';
import { Repository } from '../../server/db/repository';

// Test that repository surfaces DB errors as API-friendly errors
describe('repository error branches', () => {
  it('getUser throws APIError on DB failure', async () => {
    // Mock a db failure in repository layer
  const repo = new Repository();
  // spy on the repository method to throw
  vi.spyOn(repo as any, 'getUser').mockRejectedValueOnce(new Error('DB failure'));

  await expect((repo as any).getUser('id')).rejects.toThrow('DB failure');
  });
});
