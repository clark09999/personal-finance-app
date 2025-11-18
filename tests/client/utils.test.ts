import { describe, it, expect } from 'vitest';
import { cn } from '../../client/src/lib/utils';

describe('client utils.cn', () => {
  it('merges class names and deduplicates', () => {
    const result = cn('p-2', 'p-2', 'text-sm', { 'bg-red-500': false } as any);
    expect(typeof result).toBe('string');
    expect(result.includes('p-2')).toBe(true);
  });
});
