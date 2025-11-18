import { createHash } from 'crypto';
import { authenticator } from 'otplib';
import { cache } from './cache';
import { storage } from '../storage';
import { APIError } from '../middleware/error';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface TokenMetadata {
  version: number;
  issuedAt: number;
  userId: string;
}

export class AuthService {
  private static readonly TOKEN_VERSION_PREFIX = 'token:version:';
  private static readonly TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';
  private static readonly MFA_SECRET_PREFIX = 'mfa:secret:';
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours

  // Token versioning for revocation
  async getTokenVersion(userId: string): Promise<number> {
    const version = await cache.get<number>(`${AuthService.TOKEN_VERSION_PREFIX}${userId}`);
    return version || 0;
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    const currentVersion = await this.getTokenVersion(userId);
    const newVersion = currentVersion + 1;
    await cache.set(`${AuthService.TOKEN_VERSION_PREFIX}${userId}`, newVersion);
    return newVersion;
  }

  // Token blacklisting
  async blacklistToken(token: string, userId: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await cache.set(
      `${AuthService.TOKEN_BLACKLIST_PREFIX}${tokenHash}`,
      userId,
      AuthService.TOKEN_EXPIRY
    );
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    return await cache.get(`${AuthService.TOKEN_BLACKLIST_PREFIX}${tokenHash}`) !== null;
  }

  // MFA management
  async setupMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = authenticator.generateSecret();
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new APIError(404, 'User not found');
    }

    const otpauth = authenticator.keyuri(
      user.username,
      'FinanceFlow',
      secret
    );

    await cache.set(`${AuthService.MFA_SECRET_PREFIX}${userId}`, secret);
    
    return {
      secret,
      qrCode: otpauth
    };
  }

  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const secret = await cache.get<string>(`${AuthService.MFA_SECRET_PREFIX}${userId}`);
    
    if (!secret) {
      throw new APIError(400, 'MFA not set up for user');
    }

    try {
      return authenticator.verify({
        token,
        secret
      });
    } catch (error) {
      logger.error('MFA verification error:', error);
      return false;
    }
  }

  async enableMFA(userId: string, token: string): Promise<void> {
    const isValid = await this.verifyMFA(userId, token);
    
    if (!isValid) {
      throw new APIError(400, 'Invalid MFA token');
    }

    // Move secret from cache to permanent storage
    const secret = await cache.get<string>(`${AuthService.MFA_SECRET_PREFIX}${userId}`);
    if (!secret) {
      throw new APIError(400, 'MFA setup expired');
    }

    // Update user's MFA status in storage
    await storage.updateUser(userId, { mfaEnabled: true, mfaSecret: secret });
    await cache.del(`${AuthService.MFA_SECRET_PREFIX}${userId}`);
  }

  async validateSensitiveOperation(userId: string, mfaToken?: string): Promise<void> {
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new APIError(404, 'User not found');
    }

    if (user.mfaEnabled) {
      if (!mfaToken) {
        throw new APIError(401, 'MFA token required');
      }

      const isValid = authenticator.verify({
        token: mfaToken,
        secret: user.mfaSecret!
      });

      if (!isValid) {
        throw new APIError(401, 'Invalid MFA token');
      }
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

export const authService = new AuthService();
