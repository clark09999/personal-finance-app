import { describe, it, expect, vi, beforeEach } from 'vitest';
console.log('[test-module] loaded tests/server/auth.test.ts');
import jwt from 'jsonwebtoken';
import { env } from '../../server/config/env';
import { authService } from '../../server/services/auth';
import { storage } from '../../server/storage';
import { generateTokens, authenticateToken, handleTokenRefresh } from '../../server/middleware/auth';

describe('auth middleware utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generateTokens returns access and refresh tokens', async () => {
    vi.spyOn(authService, 'getTokenVersion').mockResolvedValueOnce(2);
    const tokens = await generateTokens('demo-user-1');
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    // verify token payloads decode with env secrets
    const payload = jwt.verify(tokens.accessToken, env.JWT_ACCESS_SECRET) as any;
    expect(payload).toHaveProperty('userId', 'demo-user-1');
  });

  it('handleTokenRefresh returns 400 when missing token', async () => {
    const req: any = { body: {} };
    const json = vi.fn();
    const res: any = { status: vi.fn(() => ({ json })) };

    await handleTokenRefresh(req, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalled();
  });

  it('authenticateToken returns 401 when no token provided', async () => {
    const req: any = { headers: {} };
    const json = vi.fn();
    const res: any = { status: vi.fn(() => ({ json })) };
    const next = vi.fn();

    await authenticateToken(req as any, res as any, next as any);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
