import { describe, it, expect } from 'vitest';
import request from 'supertest';
import Ajv from 'ajv';
import { server } from './setup';
import { transactionSchema } from './schemas';

const ajv = new Ajv({
  formats: {
    'date-time': true,
    'uuid': true
  }
});

describe('Transactions API', () => {
  describe('GET /api/transactions', () => {
    it('should return a list of transactions', async () => {
      const response = await request(server)
        .get('/api/transactions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Validate each transaction against the schema
      response.body.forEach((transaction: any) => {
        const valid = ajv.validate(transactionSchema, transaction);
        if (!valid) {
          console.error('Validation errors:', ajv.errors);
        }
        expect(valid).toBe(true);
      });
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const newTransaction = {
        // drizzle stores decimal amounts as strings; provide a string to match schema
        amount: "100.00",
        type: 'expense',
        // tests must use categoryId (schema expects categoryId)
        categoryId: 'test-category',
        description: 'Weekly groceries',
        date: new Date().toISOString()
      };

      const response = await request(server)
        .post('/api/transactions')
        .send(newTransaction)
        .expect('Content-Type', /json/)
        .expect(201);

      const valid = ajv.validate(transactionSchema, response.body);
      if (!valid) {
        console.error('Validation errors:', ajv.errors);
      }
      expect(valid).toBe(true);
  expect(response.body.amount).toBe(newTransaction.amount);
  expect(response.body.categoryId).toBe(newTransaction.categoryId);
    });

    it('should validate transaction data', async () => {
      const invalidTransaction = {
        // Missing required fields
        amount: 'not a number', // Invalid type
        type: 'invalid-type' // Invalid enum value
      };

      await request(server)
        .post('/api/transactions')
        .send(invalidTransaction)
        .expect(400);
    });
  });
});