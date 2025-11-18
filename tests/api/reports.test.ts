import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { server } from './setup';

describe('Reports / Summary API', () => {
  it('returns spending summary and trends', async () => {
    const sumRes = await request(server).get('/api/summary').expect(200);
    expect(Array.isArray(sumRes.body)).toBe(true);

    const trendsRes = await request(server).get('/api/summary/trends?interval=monthly&limit=3').expect(200);
    expect(Array.isArray(trendsRes.body)).toBe(true);
  });

  it('rejects invalid interval', async () => {
    await request(server).get('/api/summary/trends?interval=invalid').expect(400);
  });
});
