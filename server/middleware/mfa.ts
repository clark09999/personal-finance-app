import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';
import { APIError } from './error';

export const requireMFA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new APIError(401, 'Authentication required');
    }

    const mfaToken = req.headers['x-mfa-token'] as string;
    await authService.validateSensitiveOperation(req.user.id, mfaToken);
    
    next();
  } catch (error) {
    next(error);
  }
};

// List of routes that require MFA
export const mfaProtectedRoutes = [
  { path: '/api/transactions', methods: ['POST', 'PATCH', 'DELETE'] },
  { path: '/api/budgets', methods: ['POST', 'PATCH', 'DELETE'] },
  { path: '/api/goals', methods: ['POST', 'PATCH', 'DELETE'] },
  { path: '/api/user/password', methods: ['PATCH'] },
  { path: '/api/user/email', methods: ['PATCH'] },
];
