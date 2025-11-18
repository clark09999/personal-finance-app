import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { server } from './setup';

describe('Budgets API', () => {
  it('should create, fetch, update and delete a budget', async () => {
  const payload = { categoryId: 'test-category', amount: "200.00", period: 'monthly', year: new Date().getFullYear() };

    const createRes = await request(server).post('/api/budgets').send(payload).expect(201);
    expect(createRes.body).toHaveProperty('id');

    const id = createRes.body.id;

    const getRes = await request(server).get(`/api/budgets/${id}`).expect(200);
  expect(getRes.body).toMatchObject({ categoryId: payload.categoryId, amount: payload.amount });

  const patchRes = await request(server).patch(`/api/budgets/${id}`).send({ amount: "250.00" }).expect(200);
  expect(patchRes.body.amount).toBe("250.00");

    await request(server).delete(`/api/budgets/${id}`).expect(204);
    await request(server).get(`/api/budgets/${id}`).expect(404);
  });

  it('should validate bad payloads', async () => {
  await request(server).post('/api/budgets').send({ categoryId: '' }).expect(400);
  });
});
