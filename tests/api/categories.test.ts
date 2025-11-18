import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { server } from './setup';

describe('Categories API', () => {
  it('fetch and create categories', async () => {
    const listRes = await request(server).get('/api/categories').expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    const createRes = await request(server).post('/api/categories').send({ name: 'Test Category' }).expect(201);
    expect(createRes.body).toHaveProperty('id');
  });
});
