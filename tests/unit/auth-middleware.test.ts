import { describe, it, expect, vi } from 'vitest';
import { authenticateToken, handleTokenRefresh } from '../../server/middleware/auth';
import jwt from 'jsonwebtoken';
import { env } from '../../server/config/env';

function makeReq(headers = {}, body = {}) {
  return { headers, body } as any;
}

function makeRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (payload: any) => { res._json = payload; return res; };
  return res;
}

describe('auth middleware - authenticateToken', () => {
  it('returns 401 when no token provided', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();
    await authenticateToken(req, res, next as any);
    expect(res._status).toBe(401);
    expect(res._json).toMatchObject({ error: 'Access token required' });
  });

  it('throws APIError for invalid token', async () => {
    const req = makeReq({ authorization: 'Bearer invalid.token.value' });
    const res = makeRes();
    const next = vi.fn();

    await expect(authenticateToken(req, res, next as any)).rejects.toBeTruthy();
  });

  it('handles expired token by throwing Token expired APIError', async () => {
    // Spy jwt.verify to throw TokenExpiredError
    const spy = vi.spyOn(jwt, 'verify').mockImplementation(() => { throw new jwt.TokenExpiredError('jwt expired', new Date()); });
    const req = makeReq({ authorization: 'Bearer some.token' });
    const res = makeRes();
    const next = vi.fn();

    await expect(authenticateToken(req, res, next as any)).rejects.toBeTruthy();
    spy.mockRestore();
  });
});

describe('auth middleware - handleTokenRefresh', () => {
  it('returns 400 when refreshToken missing', async () => {
    const req = { body: {} } as any;
    const res = makeRes();
    await handleTokenRefresh(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 403 for invalid refresh token', async () => {
    const req = { body: { refreshToken: 'bad.token' } } as any;
    const res = makeRes();
    await handleTokenRefresh(req, res);
    expect(res._status).toBe(403);
  });

  it('returns 401 for expired refresh token', async () => {
    // mock jwt.verify to throw TokenExpiredError
    const spy = vi.spyOn(jwt, 'verify').mockImplementation(() => { throw new jwt.TokenExpiredError('expired', new Date()); });
    const req = { body: { refreshToken: 'expired.token' } } as any;
    const res = makeRes();
    await handleTokenRefresh(req, res);
    expect(res._status).toBe(401);
    spy.mockRestore();
  });
});
