import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../server';
import { storage } from '../server/storage';
import { generateTokens } from '../server/middleware/auth';
import { authService } from '../server/services/auth';

const request = supertest(app);

describe('API Contract Tests', () => {
  let testUser: any;
  let accessToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await storage.createUser({
      username: `test-${Date.now()}`,
      password: 'test-password'
    });

    const tokens = await generateTokens(testUser.id);
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await storage.deleteUser(testUser.id);
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request.get('/api/transactions');
      expect(response.status).toBe(401);
    });

    it('should accept valid access tokens', async () => {
      const response = await request
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
    });

    it('should handle token revocation', async () => {
      // Revoke token
      await authService.incrementTokenVersion(testUser.id);

      const response = await request
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token version mismatch');
      // Generate a fresh token for subsequent tests so revocation doesn't
      // affect the rest of the suite.
      const newTokens = await generateTokens(testUser.id);
      accessToken = newTokens.accessToken;
    });
  });

  describe('Transactions API', () => {
    it('should validate transaction creation payload', async () => {
      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should create a valid transaction', async () => {
      const transaction = {
        amount: "100.00",
        description: "Test transaction",
        categoryId: "test-category",
        type: "expense"
      };

      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transaction);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        ...transaction,
        userId: testUser.id,
      });
    });

    it('should require MFA for large transactions', async () => {
      const transaction = {
        amount: "10000.00", // Large amount
        description: "Large transaction",
        categoryId: "test-category",
        type: "expense"
      };

      const response = await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transaction);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('MFA token required');
    });
  });

  describe('Cache Behavior', () => {
    it('should cache transaction list', async () => {
      // First request - should hit database
      const response1 = await request
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`);
      
      // Second request - should hit cache
      const response2 = await request
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response1.body).toEqual(response2.body);
      // Could add timing assertions here
    });

    it('should invalidate cache on updates', async () => {
      const transaction = {
        amount: "50.00",
        description: "Cache test transaction",
        categoryId: "test-category",
        type: "expense"
      };

      // Create transaction
      await request
        .post('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(transaction);

      // Get updated list
      const response = await request
        .get('/api/transactions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.body).toContainEqual(expect.objectContaining(transaction));
    });
  });
});
