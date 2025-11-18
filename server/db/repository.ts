import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './index';
import { 
  users,
  transactions,
  categories,
  budgets,
  goals,
  type User,
  type Transaction,
  type Category,
  type Budget,
  type Goal,
  type InsertUser,
  type InsertTransaction,
  type InsertBudget,
  type InsertGoal,
  type InsertCategory
} from '@shared/schema';
import { cache } from '../services/cache';
import { logger } from '../utils/logger';
import { APIError } from '../middleware/error';

export class Repository {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return user;
    } catch (error) {
      logger.error('Error fetching user by username:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async createUser(data: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(data).returning();
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      
      if (!user) {
        throw new APIError(404, 'User not found');
      }
      
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new APIError(500, 'Database error');
    }
  }

  // Transaction methods
  async getTransactions(userId: string): Promise<Transaction[]> {
    const cacheKey = `transactions:${userId}`;
    
    try {
      // Try cache first
      const cached = await cache.get<Transaction[]>(cacheKey);
      if (cached) return cached;

      // Query database
      const results = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date));

      // Cache results
      await cache.set(cacheKey, results, 300); // Cache for 5 minutes
      return results;
    } catch (error) {
      logger.error('Error fetching transactions:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    try {
      const [transaction] = await db
        .insert(transactions)
        .values(data)
        .returning();

      // Invalidate cache
      await cache.del(`transactions:${data.userId}`);
      return transaction;
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw new APIError(500, 'Database error');
    }
  }

  // Budget methods
  async getBudgets(userId: string): Promise<Budget[]> {
    const cacheKey = `budgets:${userId}`;
    
    try {
      const cached = await cache.get<Budget[]>(cacheKey);
      if (cached) return cached;

      const results = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, userId));

      await cache.set(cacheKey, results, 300);
      return results;
    } catch (error) {
      logger.error('Error fetching budgets:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async createBudget(data: InsertBudget): Promise<Budget> {
    try {
      const [budget] = await db
        .insert(budgets)
        .values(data)
        .returning();

      await cache.del(`budgets:${data.userId}`);
      return budget;
    } catch (error) {
      logger.error('Error creating budget:', error);
      throw new APIError(500, 'Database error');
    }
  }

  // Goal methods
  async getGoals(userId: string): Promise<Goal[]> {
    const cacheKey = `goals:${userId}`;
    
    try {
      const cached = await cache.get<Goal[]>(cacheKey);
      if (cached) return cached;

      const results = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId));

      await cache.set(cacheKey, results, 300);
      return results;
    } catch (error) {
      logger.error('Error fetching goals:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async createGoal(data: InsertGoal): Promise<Goal> {
    try {
      const [goal] = await db
        .insert(goals)
        .values(data)
        .returning();

      await cache.del(`goals:${data.userId}`);
      return goal;
    } catch (error) {
      logger.error('Error creating goal:', error);
      throw new APIError(500, 'Database error');
    }
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories';
    
    try {
      const cached = await cache.get<Category[]>(cacheKey);
      if (cached) return cached;

      const results = await db
        .select()
        .from(categories);

      await cache.set(cacheKey, results, 3600); // Cache for 1 hour
      return results;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    try {
      const [category] = await db
        .insert(categories)
        .values(data)
        .returning();

      await cache.del('categories');
      return category;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw new APIError(500, 'Database error');
    }
  }

  // Analytics methods
  async getSpendingSummary(userId: string) {
    const cacheKey = `spending-summary:${userId}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const results = await db.execute(sql`
        SELECT 
          c.name as category,
          SUM(CAST(t.amount AS DECIMAL)) as amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ${userId}
          AND t.type = 'expense'
        GROUP BY c.name
        ORDER BY amount DESC
      `);

      await cache.set(cacheKey, results, 300);
      return results;
    } catch (error) {
      logger.error('Error generating spending summary:', error);
      throw new APIError(500, 'Database error');
    }
  }

  async getTrends(userId: string, interval: 'daily' | 'weekly' | 'monthly', limit: number) {
    const cacheKey = `trends:${userId}:${interval}:${limit}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      // Interval-specific date trunc
      const dateTrunc = interval === 'daily' ? 'day' :
                       interval === 'weekly' ? 'week' : 'month';

      const results = await db.execute(sql`
        WITH dates AS (
          SELECT date_trunc(${dateTrunc}, date) as period
          FROM transactions
          WHERE user_id = ${userId}
          GROUP BY 1
          ORDER BY 1 DESC
          LIMIT ${limit}
        )
        SELECT 
          d.period as date,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN CAST(t.amount AS DECIMAL) ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN CAST(t.amount AS DECIMAL) ELSE 0 END), 0) as total_expense,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN CAST(t.amount AS DECIMAL) 
                           WHEN t.type = 'expense' THEN -CAST(t.amount AS DECIMAL)
                           ELSE 0 END), 0) as net_balance
        FROM dates d
        LEFT JOIN transactions t ON date_trunc(${dateTrunc}, t.date) = d.period
          AND t.user_id = ${userId}
        GROUP BY d.period
        ORDER BY d.period DESC
      `);

      await cache.set(cacheKey, results, 300);
      return results;
    } catch (error) {
      logger.error('Error generating trends:', error);
      throw new APIError(500, 'Database error');
    }
  }
}
