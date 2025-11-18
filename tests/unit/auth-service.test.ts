import { describe, it, expect } from 'vitest';
import { authService } from '../../server/services/auth';

describe('AuthService unit', () => {
  it('getTokenVersion returns number (default 0)', async () => {
    const v = await authService.getTokenVersion('nonexistent-user');
    expect(typeof v).toBe('number');
    expect(v).toBeGreaterThanOrEqual(0);
  });

  it('isTokenBlacklisted returns boolean (safe when cache not connected)', async () => {
    const res = await authService.isTokenBlacklisted('some-token');
    expect(typeof res).toBe('boolean');
  });
});
