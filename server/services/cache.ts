import { createClient } from 'redis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || '';

class CacheService {
  private client;
  private isConnected = false;

  constructor() {
    // Only create a Redis client if a URL is explicitly provided. When
    // REDIS_URL is empty we prefer a quiet in-memory fallback to avoid
    // noisy connection retries in local/dev environments where Redis may
    // not be running.
    if (REDIS_URL) {
      this.client = createClient({ url: REDIS_URL });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });
    } else {
      // Provide memStore when Redis not configured
      (this as any).memStore = new Map<string, string>();
      this.isConnected = false;
    }

    // Note: event handlers are attached only if client exists above.

    // Avoid automatic Redis connection during tests and local dev when
    // REDIS_URL is not configured. Only attempt a connection when a URL is
    // present and we're not running tests.
    if (REDIS_URL && process.env.NODE_ENV !== 'test') {
      this.connect();
    }
  }

  private async connect() {
    try {
      if (this.client) await this.client.connect();
    } catch (err) {
      logger.error('Redis Connection Error', err);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // If Redis isn't available but we have a memory store (tests), use it
    const mem = (this as any).memStore as Map<string, string> | undefined;
    if (!this.isConnected && mem) {
      const data = mem.get(key);
      return data ? JSON.parse(data) : null;
    }
    if (!this.isConnected) return null;
    
    try {
      const data = this.client ? await this.client.get(key) : null;
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error('Redis Get Error', { key, error: err });
      return null;
    }
  }

  async set(key: string, value: any, expirationInSeconds?: number): Promise<boolean> {
    const mem = (this as any).memStore as Map<string, string> | undefined;
    if (!this.isConnected && mem) {
      try {
        mem.set(key, JSON.stringify(value));
        return true;
      } catch (err) {
        logger.error('MemCache Set Error', { key, error: err });
        return false;
      }
    }

    if (!this.isConnected) return false;

    try {
      const stringValue = JSON.stringify(value);
      if (this.client) {
        if (expirationInSeconds) {
          await this.client.setEx(key, expirationInSeconds, stringValue);
        } else {
          await this.client.set(key, stringValue);
        }
      }
      return true;
    } catch (err) {
      logger.error('Redis Set Error', { key, error: err });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const mem = (this as any).memStore as Map<string, string> | undefined;
    if (!this.isConnected && mem) {
      try {
        mem.delete(key);
        return true;
      } catch (err) {
        logger.error('MemCache Delete Error', { key, error: err });
        return false;
      }
    }

    if (!this.isConnected) return false;

    try {
      if (this.client) await this.client.del(key);
      return true;
    } catch (err) {
      logger.error('Redis Delete Error', { key, error: err });
      return false;
    }
  }

  async flush(): Promise<boolean> {
    const mem = (this as any).memStore as Map<string, string> | undefined;
    if (!this.isConnected && mem) {
      try {
        mem.clear();
        return true;
      } catch (err) {
        logger.error('MemCache Flush Error', err);
        return false;
      }
    }

    if (!this.isConnected) return false;

    try {
      if (this.client) await this.client.flushAll();
      return true;
    } catch (err) {
      logger.error('Redis Flush Error', err);
      return false;
    }
  }

  // Caching decorators
  static withCache(keyPrefix: string, expirationInSeconds?: number) {
    return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
      // Descriptor may be undefined in some decorator emit modes; guard early.
      if (!descriptor || typeof descriptor.value !== 'function') {
        return descriptor as any;
      }

      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
        const cachedResult = await cache.get(cacheKey);

        if (cachedResult) {
          return cachedResult;
        }

        const result = await originalMethod.apply(this, args);
        await cache.set(cacheKey, result, expirationInSeconds);
        return result;
      };

      return descriptor;
    };
  }
}

export const cache = new CacheService();

// Convenience export for using the cache decorator without referencing the
// instance (decorators are applied at class definition time). Some modules
// import the decorator as `withCache` to avoid calling instance methods on
// the runtime object.
export const withCache = CacheService.withCache;

// Expose the in-memory memStore for tests. In test mode the CacheService
// constructor creates `memStore` on the instance; expose it here so unit tests
// can import and manipulate it directly. When not in test mode, this will be
// `undefined`.
export const memStore: Map<string, string> | undefined = (cache as any).memStore;
