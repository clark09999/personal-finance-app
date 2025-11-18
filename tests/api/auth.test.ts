import { describe, it, expect } from 'vitest';
import { handleTokenRefresh } from '../../server/middleware/auth';

function createReq(body: any) {
  return { body } as any;
}

function createRes() {
  const res: any = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (payload: any) => { res._json = payload; return res; };
  return res;
}

describe('Auth middleware - refresh token handler', () => {
  it('returns 400 when no token provided', async () => {
    const req = createReq({});
    const res = createRes();
    await handleTokenRefresh(req, res as any);
    expect(res._status).toBe(400);
  });
});
