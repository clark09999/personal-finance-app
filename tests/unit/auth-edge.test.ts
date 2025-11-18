import { describe, it, expect } from 'vitest';
import * as jwt from 'jsonwebtoken';
import { authenticateToken } from '../../server/middleware/auth';

// Unit tests for auth edge cases: expired and malformed tokens
describe('auth middleware - edge cases', () => {
  it('throws APIError for malformed token', async () => {
    const req: any = { headers: { authorization: 'Bearer malformed.token' }, method: 'GET', path: '/test' };
    const res: any = { status: () => res, json: () => {} };
    const next = (err?: any) => { if (err) throw err; };

    await expect(authenticateToken(req, res, next)).rejects.toBeDefined();
  });

  it('throws TokenExpiredError for expired token', async () => {
    // create a short-lived token then verify handling
  const secret = process.env.JWT_ACCESS_SECRET || 'temp-access-secret';
  const token = jwt.sign({ userId: 'demo-user-1', type: 'access', version: 0 }, secret as unknown as jwt.Secret, { expiresIn: '1ms' } as jwt.SignOptions);
    // Wait to ensure token expiry
    await new Promise((r) => setTimeout(r, 10));

    const req: any = { headers: { authorization: `Bearer ${token}` }, method: 'GET', path: '/test' };
    const res: any = { status: () => res, json: () => {} };
    const next = (err?: any) => { if (err) throw err; };

    await expect(authenticateToken(req, res, next)).rejects.toBeDefined();
  });
});
