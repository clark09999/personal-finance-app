import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { server } from './setup';

describe('Goals API', () => {
  it('create -> fetch -> update -> delete goal', async () => {
  const payload = { name: 'Emergency Fund', targetAmount: "1000.00", deadline: new Date().toISOString() };

    const createRes = await request(server).post('/api/goals').send(payload).expect(201);
    expect(createRes.body).toHaveProperty('id');

    const id = createRes.body.id;
    const getRes = await request(server).get(`/api/goals/${id}`).expect(200);
  expect(getRes.body).toMatchObject({ name: payload.name, targetAmount: payload.targetAmount });

  const patchRes = await request(server).patch(`/api/goals/${id}`).send({ targetAmount: "1200.00" }).expect(200);
  expect(patchRes.body.targetAmount).toBe("1200.00");

    await request(server).delete(`/api/goals/${id}`).expect(204);
    await request(server).get(`/api/goals/${id}`).expect(404);
  });
});
