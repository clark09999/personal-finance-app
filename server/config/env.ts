import { config } from 'dotenv';
config();

export const env = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server configuration
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || '0.0.0.0',

  // S3 Backup configuration
  S3_BUCKET: process.env.S3_BUCKET || '',
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || '',
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || '',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT configuration
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'temp-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'temp-refresh-secret',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // Session configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
  
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
} as const;

// Type checking for environment variables
type Env = typeof env;

// Validate required environment variables in production
if (env.NODE_ENV === 'production') {
  const requiredEnvVars: (keyof Env)[] = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
  ];

  const missingEnvVars = requiredEnvVars.filter(key => !env[key]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingEnvVars.join(', ')}`
    );
  }
}
