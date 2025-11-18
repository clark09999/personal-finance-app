import { app as server } from '../server';

async function run() {
  const supertest = (await import('supertest')) as any;
  const request = supertest.default ?? supertest;

  const payload = {
    amount: "100.00",
    type: 'expense',
    categoryId: 'test-category',
    description: 'Debug groceries',
    date: new Date().toISOString()
  };

  const res = await request(server)
    .post('/api/transactions')
    .send(payload)
    .set('Accept', 'application/json');

  console.log('STATUS', res.status);
  console.log('BODY', JSON.stringify(res.body, null, 2));
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
