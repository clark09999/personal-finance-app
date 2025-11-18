import { Transaction, InsertTransaction, Budget, InsertBudget, Goal, InsertGoal } from '@shared/schema';
import { storage } from '../storage';
import { cache, withCache } from './cache';
import { APIError } from '../middleware/error';
import { logger } from '../utils/logger';

export class FinanceService {
  // Transaction methods with caching
  @withCache('transactions', 300) // Cache for 5 minutes
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return storage.getTransactions(userId);
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    try {
      const transaction = await storage.createTransaction(data);
      await cache.del(`transactions:["${data.userId}"]`);
      return transaction;
    } catch (err) {
      logger.error('Create transaction error:', err);
      throw new APIError(500, 'Failed to create transaction');
    }
  }

  async updateTransaction(id: string, data: Partial<InsertTransaction>): Promise<Transaction> {
    const updated = await storage.updateTransaction(id, data);
    if (!updated) {
      throw new APIError(404, 'Transaction not found');
    }
    await cache.del(`transactions:["${updated.userId}"]`);
    return updated;
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    const success = await storage.deleteTransaction(id);
    if (!success) {
      throw new APIError(404, 'Transaction not found');
    }
    await cache.del(`transactions:["${userId}"]`);
  }

  // Budget methods with caching
  @withCache('budgets', 600) // Cache for 10 minutes
  async getUserBudgets(userId: string): Promise<Budget[]> {
    return storage.getBudgets(userId);
  }

  async createBudget(data: InsertBudget): Promise<Budget> {
    try {
      const budget = await storage.createBudget(data);
      await cache.del(`budgets:["${data.userId}"]`);
      return budget;
    } catch (err) {
      logger.error('Create budget error:', err);
      throw new APIError(500, 'Failed to create budget');
    }
  }

  async updateBudget(id: string, data: Partial<InsertBudget>): Promise<Budget> {
    const updated = await storage.updateBudget(id, data);
    if (!updated) {
      throw new APIError(404, 'Budget not found');
    }
    await cache.del(`budgets:["${updated.userId}"]`);
    return updated;
  }

  async deleteBudget(id: string, userId: string): Promise<void> {
    const success = await storage.deleteBudget(id);
    if (!success) {
      throw new APIError(404, 'Budget not found');
    }
    await cache.del(`budgets:["${userId}"]`);
  }

  // Goal methods with caching
  @withCache('goals', 600) // Cache for 10 minutes
  async getUserGoals(userId: string): Promise<Goal[]> {
    return storage.getGoals(userId);
  }

  async createGoal(data: InsertGoal): Promise<Goal> {
    try {
      const goal = await storage.createGoal(data);
      await cache.del(`goals:["${data.userId}"]`);
      return goal;
    } catch (err) {
      logger.error('Create goal error:', err);
      throw new APIError(500, 'Failed to create goal');
    }
  }

  async updateGoal(id: string, data: Partial<InsertGoal>): Promise<Goal> {
    const updated = await storage.updateGoal(id, data);
    if (!updated) {
      throw new APIError(404, 'Goal not found');
    }
    await cache.del(`goals:["${updated.userId}"]`);
    return updated;
  }

  async deleteGoal(id: string, userId: string): Promise<void> {
    const success = await storage.deleteGoal(id);
    if (!success) {
      throw new APIError(404, 'Goal not found');
    }
    await cache.del(`goals:["${userId}"]`);
  }

  // Summary methods with caching
  @withCache('spending-summary', 300)
  async getSpendingSummary(userId: string) {
    return storage.getSpendingSummary(userId);
  }

  @withCache('trends', 300)
  async getTrends(userId: string, interval: 'daily' | 'weekly' | 'monthly', limit: number) {
    return storage.getTrends(userId, interval, limit);
  }
}

export const financeService = new FinanceService();
