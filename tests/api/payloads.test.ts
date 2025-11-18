import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { describe, it, expect, beforeEach } from 'vitest';

describe('API payload compliance', () => {
  let app: express.Express;
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app, { requireAuth: false });
  });

  it('POST /api/transactions preserves amount as string and includes categoryId', async () => {
    const payload = { amount: '100.00', description: 'Test transaction', categoryId: 'test-category', type: 'expense' };
    const res = await request(app).post('/api/transactions').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe('100.00');
    expect(res.body).toHaveProperty('categoryId', 'test-category');
  });
});
