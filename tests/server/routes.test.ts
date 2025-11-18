import express from 'express';
import request from 'supertest';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('routes integration (mocked storage)', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/transactions returns transactions list', async () => {
    vi.spyOn(storage, 'getTransactions').mockResolvedValueOnce([
      { id: 't1', userId: 'demo-user-1', amount: '10.00', description: 'a', categoryId: 'c1', date: new Date(), type: 'expense' },
    ] as any);

  const res = await request(app as any).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('GET /api/transactions/:id returns 404 when not found', async () => {
    vi.spyOn(storage, 'getTransaction').mockResolvedValueOnce(undefined);

  const res = await request(app as any).get('/api/transactions/not-there');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/transactions validates and creates transaction', async () => {
    const payload = { amount: '5.00', description: 'ok', categoryId: 'c1', type: 'expense' };
    vi.spyOn(storage, 'createTransaction').mockImplementationOnce(async (t: any) => ({ ...t, id: 'new' }));

  const res = await request(app as any).post('/api/transactions').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'new');
  });

  it('GET /api/summary/trends returns 400 for invalid interval', async () => {
  const res = await request(app as any).get('/api/summary/trends?interval=yearly');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
