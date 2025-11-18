import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { server } from '../api/setup';

describe('Integration flows', () => {
  it('Create transaction -> Fetch summary', async () => {
  const txn = { amount: "50.00", type: 'expense', categoryId: 'test-category', description: 'Integration test', date: new Date().toISOString() };
  const createRes = await request(server).post('/api/transactions').send(txn).expect(201);
    expect(createRes.body).toHaveProperty('id');

    const sumRes = await request(server).get('/api/summary').expect(200);
    expect(Array.isArray(sumRes.body)).toBe(true);
  });

  it('Create budget -> update -> delete', async () => {
  const payload = { categoryId: 'test-category', amount: "100.00", period: 'monthly', year: new Date().getFullYear() };
  const create = await request(server).post('/api/budgets').send(payload).expect(201);
    const id = create.body.id;

    await request(server).patch(`/api/budgets/${id}`).send({ amount: 150 }).expect(200);
    await request(server).delete(`/api/budgets/${id}`).expect(204);
  });
});
