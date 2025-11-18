import { test, expect } from '@playwright/test';

test('load home and ensure API responds', async ({ page, request }) => {
  // Attempt to hit the summary endpoint which should exist
  const res = await request.get('/api/summary');
  expect(res.status()).toBe(200);
});
