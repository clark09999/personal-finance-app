import {
  type User,
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type Category,
  type InsertCategory,
  type Budget,
  type InsertBudget,
  type Goal,
  type InsertGoal,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Summary interfaces for API responses
export interface TrendDataPoint {
  date: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
}

export interface SpendingSummary {
  category: string;
  amount: number;
}

// Storage interface with all CRUD operations
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Budget methods
  getBudgets(userId: string): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: string): Promise<boolean>;

  // Goal methods
  getGoals(userId: string): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;

  // Summary and analysis methods
  getTrends(userId: string, interval: 'daily' | 'weekly' | 'monthly', limit?: number): Promise<TrendDataPoint[]>;
  getSpendingSummary(userId: string): Promise<SpendingSummary[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private categories: Map<string, Category>;
  private budgets: Map<string, Budget>;
  private goals: Map<string, Goal>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.categories = new Map();
    this.budgets = new Map();
    this.goals = new Map();

    // Initialize with demo data
    this.initializeDemoData();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Transaction methods
  async getTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      date: insertTransaction.date || new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const existing = this.transactions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...transaction };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      id,
      name: insertCategory.name,
      icon: insertCategory.icon || null,
      color: insertCategory.color || null,
    };
    this.categories.set(id, category);
    return category;
  }

  // Budget methods
  async getBudgets(userId: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(b => b.userId === userId);
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = { 
      id,
      userId: insertBudget.userId,
      categoryId: insertBudget.categoryId,
      amount: insertBudget.amount,
      period: insertBudget.period,
      month: insertBudget.month || null,
      year: insertBudget.year,
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const existing = this.budgets.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...budget };
    this.budgets.set(id, updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Goal methods
  async getGoals(userId: string): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(g => g.userId === userId);
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const goal: Goal = { 
      id,
      userId: insertGoal.userId,
      name: insertGoal.name,
      targetAmount: insertGoal.targetAmount,
      currentAmount: insertGoal.currentAmount || "0",
      deadline: insertGoal.deadline || null,
      createdAt: new Date()
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existing = this.goals.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...goal };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Summary and analysis methods
  async getTrends(userId: string, interval: 'daily' | 'weekly' | 'monthly', limit: number = 30): Promise<TrendDataPoint[]> {
    const transactions = await this.getTransactions(userId);
    const dataPoints = new Map<string, TrendDataPoint>();

    // Process each transaction
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key: string;

      // Determine the grouping key based on interval
      if (interval === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (interval === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }

      // Initialize or update the data point
      if (!dataPoints.has(key)) {
        dataPoints.set(key, {
          date: key,
          total_income: 0,
          total_expense: 0,
          net_balance: 0,
        });
      }

      const point = dataPoints.get(key)!;
      const amount = parseFloat(transaction.amount.toString());

      if (transaction.type === 'income') {
        point.total_income += amount;
      } else {
        point.total_expense += amount;
      }
      point.net_balance = point.total_income - point.total_expense;
    });

    // Fill in missing periods with zero values
    const result: TrendDataPoint[] = [];
    const now = new Date();
    const periods = interval === 'daily' ? limit : interval === 'weekly' ? 12 : 12;

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now);
      let key: string;

      if (interval === 'daily') {
        date.setDate(date.getDate() - i);
        key = date.toISOString().split('T')[0];
      } else if (interval === 'weekly') {
        date.setDate(date.getDate() - (i * 7));
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        date.setMonth(date.getMonth() - i);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }

      result.push(dataPoints.get(key) || {
        date: key,
        total_income: 0,
        total_expense: 0,
        net_balance: 0,
      });
    }

    return result;
  }

  async getSpendingSummary(userId: string): Promise<SpendingSummary[]> {
    const transactions = await this.getTransactions(userId);
    const summary = new Map<string, number>();

    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const amount = parseFloat(transaction.amount.toString());
        const current = summary.get(transaction.categoryId) || 0;
        summary.set(transaction.categoryId, current + amount);
      });

    const result: SpendingSummary[] = [];
    for (const [categoryId, amount] of Array.from(summary.entries())) {
      const category = await this.getCategory(categoryId);
      if (category) {
        result.push({
          category: category.name,
          amount,
        });
      }
    }

    return result;
  }

  // Initialize demo data for testing
  private initializeDemoData() {
    const demoUserId = "demo-user-1";
    
    // Create demo categories
    const categoryData = [
      { name: "Groceries", icon: "🛒", color: "#3b82f6" },
      { name: "Entertainment", icon: "🎬", color: "#10b981" },
      { name: "Transportation", icon: "🚗", color: "#8b5cf6" },
      { name: "Utilities", icon: "💡", color: "#f59e0b" },
      { name: "Shopping", icon: "🛍️", color: "#ef4444" },
      { name: "Dining", icon: "🍽️", color: "#06b6d4" },
      { name: "Healthcare", icon: "⚕️", color: "#ec4899" },
      { name: "Income", icon: "💰", color: "#22c55e" },
    ];

    categoryData.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { ...cat, id });
    });

    const categories = Array.from(this.categories.values());
    const getCategoryId = (name: string) => categories.find(c => c.name === name)?.id || '';

    // Create demo transactions for the past 90 days
    const transactions = [];
    const now = new Date();
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add 1-3 random transactions per day
      const numTransactions = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numTransactions; j++) {
        const isIncome = Math.random() < 0.1; // 10% chance of income
        const categoryName = isIncome ? 'Income' : 
          ['Groceries', 'Entertainment', 'Transportation', 'Utilities', 'Shopping', 'Dining', 'Healthcare'][
            Math.floor(Math.random() * 7)
          ];
        
        const amount = isIncome 
          ? (Math.random() * 2000 + 1000).toFixed(2)
          : (Math.random() * 200 + 10).toFixed(2);

        const id = randomUUID();
        this.transactions.set(id, {
          id,
          userId: demoUserId,
          amount,
          description: `Demo ${categoryName} transaction`,
          categoryId: getCategoryId(categoryName),
          date: date,
          type: isIncome ? 'income' : 'expense',
        });
      }
    }
  }
}

export const storage = new MemStorage();
