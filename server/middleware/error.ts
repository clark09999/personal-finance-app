import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import type { TokenExpiredError } from 'jsonwebtoken';

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Global error handler middleware
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error('Error caught by global handler:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle different types of errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.data && { data: err.data })
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  // Check for JWT errors by name (no class-based instanceof checks for jsonwebtoken)
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'InvalidTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(statusCode).json({
    error: message
  });
}

// Async handler wrapper to catch promise rejections
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
