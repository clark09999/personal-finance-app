import { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import csrf from 'csurf';
import { storage } from '../storage';
import { authService } from '../services/auth';
import { env } from '../config/env';
import { APIError } from './error';

interface JWTPayload {
  userId: string;
  type: 'access' | 'refresh';
  version: number;
}

// Rate limiting middleware
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many login attempts, please try again later' }
});

// CSRF protection
export const csrfProtection = csrf({ cookie: true });

// JWT configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'temp-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'temp-refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Token generation
export const generateTokens = async (userId: string) => {
  const tokenVersion = await authService.getTokenVersion(userId);
  
  const accessSignOptions: jwt.SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as unknown as jwt.SignOptions['expiresIn'] };
  const accessToken = jwt.sign(
    { userId, type: 'access', version: tokenVersion } as JWTPayload,
    env.JWT_ACCESS_SECRET as unknown as jwt.Secret,
    accessSignOptions
  );

  const refreshSignOptions: jwt.SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as unknown as jwt.SignOptions['expiresIn'] };
  const refreshToken = jwt.sign(
    { userId, type: 'refresh', version: tokenVersion } as JWTPayload,
    env.JWT_REFRESH_SECRET as unknown as jwt.Secret,
    refreshSignOptions
  );

  return { accessToken, refreshToken };
};

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[auth] authenticateToken invoked for ${req.method} ${req.path}`);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Check if token is blacklisted
    const isBlacklisted = await authService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      const e = new APIError(401, 'Token has been revoked');
      next(e);
      throw e;
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    const user = await storage.getUser(payload.userId);
    
    if (!user) {
      throw new APIError(401, 'User not found');
    }

    // Verify token version
    const currentVersion = await authService.getTokenVersion(user.id);
    if (payload.version !== currentVersion) {
      const e = new APIError(401, 'Token version mismatch');
      next(e);
      throw e;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      const e = new APIError(401, 'Token expired');
      next(e);
      throw e;
    }
    if (err instanceof APIError) {
      next(err);
      throw err;
    }
    const e = new APIError(403, 'Invalid token');
    next(e);
    throw e;
  }
};

// Refresh token endpoint handler
export const handleTokenRefresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload;
    
    if (payload.type !== 'refresh') {
      return res.status(403).json({ error: 'Invalid token type' });
    }

    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);
    res.json(tokens);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
};

// Types augmentation for Express
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
