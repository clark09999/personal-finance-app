import type { Express, Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken } from './middleware/auth';
import { authService } from './services/auth';
import { env } from './config/env';
import { insightsService } from './ai/insightsService';
import { 
  insertTransactionSchema, 
  insertBudgetSchema, 
  insertGoalSchema, 
  insertCategorySchema 
} from "@shared/schema";

export async function registerRoutes(app: Express, options?: { requireAuth?: boolean }): Promise<Server> {
  const requireAuth = options?.requireAuth ?? false;
  console.log(`[routes] registerRoutes called, requireAuth=${requireAuth}`);
  // When used as Express middleware we wrap the async authenticateToken so
  // any rejected promise is caught and does not surface as an unhandled
  // rejection. Unit tests call authenticateToken directly and still receive
  // a rejected promise as expected.
  const protect = requireAuth
    ? ((req: Request, res: Response, next: NextFunction) => {
        // Call middleware and swallow rejections here because the middleware
        // itself calls next(err) to pass the error into Express. This prevents
        // Node's unhandledRejection warning in the test runner when the
        // middleware throws after calling next().
        Promise.resolve(authenticateToken(req as any, res as any, next as any)).catch(() => {});
      })
    : (_req: Request, _res: Response, next: NextFunction) => next();
  // Lightweight health endpoint used by the frontend client and CI to verify
  // the server process is up. It deliberately performs no external checks so
  // it is safe to call early in startup.
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      res.json({ status: 'healthy' });
    } catch (err) {
      res.status(500).json({ status: 'unhealthy' });
    }
  });
  // Transaction endpoints
  app.get("/api/transactions", protect, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? 'demo-user-1';
      const transactions = await storage.getTransactions(userId);
      // Map internal storage shape to API shape expected by tests/schema
      const out = await Promise.all(transactions.map(async (t: any) => {
        const category = await storage.getCategory(t.categoryId);
        return {
          id: t.id,
          // Keep amount as stored (string) to match client expectations in tests
          amount: t.amount,
          type: t.type,
          category: category?.name ?? t.categoryId,
          categoryId: t.categoryId,
          date: new Date(t.date).toISOString(),
          description: t.description,
        };
      }));
      console.log('[routes] sample formatted transaction', out[0]);
      res.json(out);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", protect, async (req: Request, res: Response) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      const category = await storage.getCategory(transaction.categoryId);
      res.json({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: category?.name ?? transaction.categoryId,
        categoryId: transaction.categoryId,
        date: new Date(transaction.date).toISOString(),
        description: transaction.description,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", protect, async (req: Request, res: Response) => {
    try {
      // Coerce date string to Date so Zod/drizzle-zod validation succeeds
      const bodyWithDate = {
        ...req.body,
        // If client provided a date string, coerce it. Otherwise default to now
        date: req.body && req.body.date ? new Date((req.body as any).date) : new Date(),
        userId: (req as any).user?.id ?? (req.body as any)?.userId ?? 'demo-user-1',
      } as any;

      // Enforce MFA for large transactions. Threshold can be configured via
      // env.LARGE_TXN_MFA_THRESHOLD (string/number). Default to 5000.
      const threshold = Number((env as any).LARGE_TXN_MFA_THRESHOLD ?? 5000);
      const amountNumeric = Number(req.body?.amount ?? bodyWithDate.amount ?? 0);
      if (!isNaN(amountNumeric) && amountNumeric >= threshold) {
        // Require presence of an MFA token header for large transactions.
        const mfaToken = req.headers['x-mfa-token'] as string | undefined;
        if (!mfaToken) {
          return res.status(401).json({ error: 'MFA token required' });
        }

        // Validate the provided MFA token; this will throw if invalid.
        await authService.validateSensitiveOperation(req.user!.id, mfaToken);
      }

        const validatedData = insertTransactionSchema.parse(bodyWithDate);
        // Keep the original input amount (if provided as string) to match client
        // expectations in tests.
        const inputAmount = req.body?.amount ?? String(validatedData.amount ?? '0');
        const transaction = await storage.createTransaction(validatedData);
        const category = await storage.getCategory(transaction.categoryId as any);
        res.status(201).json({
          id: transaction.id,
          amount: inputAmount,
          type: transaction.type,
          category: category?.name ?? transaction.categoryId,
          categoryId: transaction.categoryId,
          userId: transaction.userId,
          date: new Date(transaction.date).toISOString(),
          description: transaction.description,
        });
    } catch (error: any) {
      const details = error?.errors ?? error?.message ?? String(error);
      // Log the validation error details to aid debugging in test runs
      console.error('[routes] Validation error creating transaction:', details);
      res.status(400).json({ error: "Validation Error", details });
    }
  });

  app.patch("/api/transactions/:id", protect, async (req: Request, res: Response) => {
    try {
      const transaction = await storage.updateTransaction(req.params.id, req.body);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", protect, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTransaction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Budget endpoints
  app.get("/api/budgets", protect, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? 'demo-user-1';
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budgets" });
    }
  });

  app.get("/api/budgets/:id", protect, async (req: Request, res: Response) => {
    try {
      const budget = await storage.getBudget(req.params.id);
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget" });
    }
  });

  app.post("/api/budgets", protect, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBudgetSchema.parse({
        ...req.body,
        userId: (req as any).user?.id ?? req.body?.userId ?? 'demo-user-1',
      });
      const budget = await storage.createBudget(validatedData);
      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({ error: "Invalid budget data", details: error });
    }
  });

  app.patch("/api/budgets/:id", protect, async (req: Request, res: Response) => {
    try {
      const budget = await storage.updateBudget(req.params.id, req.body);
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      res.status(400).json({ error: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", protect, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteBudget(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Budget not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete budget" });
    }
  });

  // Goal endpoints
  app.get("/api/goals", protect, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? 'demo-user-1';
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  app.get("/api/goals/:id", protect, async (req: Request, res: Response) => {
    try {
      const goal = await storage.getGoal(req.params.id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  app.post("/api/goals", protect, async (req: Request, res: Response) => {
    try {
      // Coerce deadline string to Date if provided
      const bodyWithDeadline = {
        ...req.body,
        ...(req.body && req.body.deadline ? { deadline: new Date(req.body.deadline) } : {}),
        userId: (req as any).user?.id ?? req.body?.userId ?? 'demo-user-1',
      };

      const validatedData = insertGoalSchema.parse(bodyWithDeadline);
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      const details = (error as any)?.errors ?? (error as any)?.message ?? String(error);
      res.status(400).json({ error: "Invalid goal data", details });
    }
  });

  app.patch("/api/goals/:id", protect, async (req: Request, res: Response) => {
    try {
      const goal = await storage.updateGoal(req.params.id, req.body);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(400).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", protect, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteGoal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Category endpoints
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data", details: error });
    }
  });

  // Summary endpoints
  app.get("/api/summary", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? "demo-user-1";
      const summary = await storage.getSpendingSummary(userId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spending summary" });
    }
  });

  app.get("/api/summary/spending", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? "demo-user-1";
      const summary = await storage.getSpendingSummary(userId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spending summary" });
    }
  });

  /**
   * Trends endpoint - supports daily, weekly, and monthly aggregation
   * Query params:
   *   - interval: 'daily' | 'weekly' | 'monthly' (default: 'monthly')
   *   - limit: number of periods to return (default varies by interval)
   */
  app.get("/api/summary/trends", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? "demo-user-1";
      const interval = (req.query.interval as 'daily' | 'weekly' | 'monthly') || 'monthly';
      
      // Validate interval
      if (!['daily', 'weekly', 'monthly'].includes(interval)) {
        return res.status(400).json({ error: "Invalid interval. Must be 'daily', 'weekly', or 'monthly'" });
      }

      // Set default limits based on interval
      const defaultLimits = {
        daily: 30,
        weekly: 12,
        monthly: 12,
      };

      const limit = req.query.limit 
        ? parseInt(req.query.limit as string) 
        : defaultLimits[interval];

      const trends = await storage.getTrends(userId, interval, limit);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trends data" });
    }
  });

  // ============================================
  // AI Insights Endpoints
  // ============================================

  /**
   * POST /api/ai/insights
   * Request insights generation for a date range
   * Requires authentication
   */
  app.post('/api/ai/insights', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const { startDate, endDate } = req.body || {};

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields', message: 'startDate and endDate are required' });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({ error: 'Invalid date format', message: 'Dates must be in YYYY-MM-DD format' });
      }

      console.log(`[AI Routes] Request insights for user ${userId}, ${startDate} to ${endDate}`);

      const result = await insightsService.requestInsights(userId, startDate, endDate);

      if (result === 'cached') {
        return res.json({ status: 'cached', message: 'Recent insights available. Use GET /api/ai/insights to retrieve.' });
      }

      res.json({ status: 'processing', jobId: result, message: 'Insights generation started. Check back in a few moments.', estimatedTime: '10-30 seconds' });
    } catch (error) {
      console.error('[AI Routes] Error requesting insights:', error);
      next(error);
    }
  });

  /**
   * GET /api/ai/insights
   * Retrieve latest generated insights for authenticated user
   * Requires authentication
   */
  app.get('/api/ai/insights', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      console.log(`[AI Routes] Fetch insights for user ${userId}`);

      const insight = await insightsService.getInsights(userId);
      if (!insight) {
        return res.status(404).json({ error: 'No insights found', message: 'Generate insights first using POST /api/ai/insights' });
      }

      res.json({
        insights: insight.insights,
        suggestions: JSON.parse(insight.suggestions || '[]'),
        flags: JSON.parse(insight.flags || '[]'),
        generatedAt: insight.generatedAt,
        period: { start: insight.periodStart, end: insight.periodEnd },
      });
    } catch (error) {
      console.error('[AI Routes] Error fetching insights:', error);
      next(error);
    }
  });

  // Export endpoint - generates CSV or JSON export of transactions
  app.get("/api/export", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id ?? "demo-user-1";
      const format = (req.query.format as string) || 'json';
      const transactions = await storage.getTransactions(userId);

      if (format === 'csv') {
        // Generate CSV
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const rows = transactions.map(t => [
          new Date(t.date).toLocaleDateString(),
          t.description,
          t.categoryId,
          t.type,
          t.amount.toString(),
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csv);
      } else {
        // Return JSON
        res.json(transactions);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);

  // --- Auth routes ---
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) return res.status(400).json({ error: 'Missing credentials', message: 'Email and password required' });

      // Treat email as username in storage layer
      const user = await storage.getUserByUsername(email);
      if (!user) return res.status(401).json({ error: 'Invalid credentials', message: 'Invalid email or password' });

      const hashed = (user as any).password;
      const valid = await bcrypt.compare(password, hashed);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials', message: 'Invalid email or password' });

      // Generate tokens using helpers
  const payload = { userId: user.id, tokenVersion: (user as any).tokenVersion ?? 0, email: user.username };
  const accessToken = jwt.sign(payload as any, env.JWT_ACCESS_SECRET as jwt.Secret, { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId: user.id, tokenVersion: (user as any).tokenVersion ?? 0, type: 'refresh' } as any, env.JWT_REFRESH_SECRET as jwt.Secret, { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions);

  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.username, name: (user as any).name ?? user.username } });
    } catch (err: any) {
      console.error('[routes] login error', err);
      res.status(500).json({ error: 'Server error', message: String(err) });
    }
  });

  // Refresh
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    try {
      // Delegate to existing handler which expects req/res
      await (await import('./middleware/auth')).handleTokenRefresh(req, res as any);
    } catch (err: any) {
      console.error('[routes] refresh error', err);
      res.status(401).json({ error: 'Invalid refresh token', message: String(err) });
    }
  });

  // Logout - protected
  app.post('/api/auth/logout', protect, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: 'Not authenticated', message: 'User missing' });
      // Invalidate tokens by incrementing token version in cache
      await authService.incrementTokenVersion(user.id);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[routes] logout error', err);
      res.status(500).json({ error: 'Server error', message: String(err) });
    }
  });

  // Optional register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body ?? {};
      if (!email || !password) return res.status(400).json({ error: 'Missing fields', message: 'email and password required' });
      // Hash password
      const hash = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({ username: email, password: hash, name } as any);
  const payload = { userId: newUser.id, tokenVersion: 0, email: newUser.username };
  const accessToken = jwt.sign(payload as any, env.JWT_ACCESS_SECRET as jwt.Secret, { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId: newUser.id, tokenVersion: 0, type: 'refresh' } as any, env.JWT_REFRESH_SECRET as jwt.Secret, { expiresIn: env.JWT_REFRESH_EXPIRY } as jwt.SignOptions);
  res.status(201).json({ accessToken, refreshToken, user: { id: newUser.id, email: newUser.username, name: (newUser as any).name ?? newUser.username } });
    } catch (err: any) {
      console.error('[routes] register error', err);
      res.status(500).json({ error: 'Server error', message: String(err) });
    }
  });
  return httpServer;
}
