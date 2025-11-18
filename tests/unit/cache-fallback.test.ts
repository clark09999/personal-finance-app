import { describe, it, expect } from 'vitest';
import { memStore } from '../../server/services/cache';

describe('cache fallback', () => {
  it('in-memory memStore behaves like map', () => {
    memStore.clear();
    memStore.set('k1', 'v1');
    expect(memStore.get('k1')).toBe('v1');
    memStore.delete('k1');
    expect(memStore.get('k1')).toBeUndefined();
  });
});
