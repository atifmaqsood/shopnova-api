import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: RedisClientType;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) { }

  async onModuleInit() {
    // Initialize Redis client
    this.redisClient = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      },
      password: this.configService.get('REDIS_PASSWORD') || undefined,
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('✅ Redis client connected successfully');
    });

    try {
      await this.redisClient.connect();
      this.logger.log('✅ Redis client initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis', error);
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    try {
      if (!this.redisClient?.isOpen) {
        this.logger.warn('Redis client not available');
        return undefined;
      }

      const value = await this.redisClient.get(key);

      if (value) {
        this.logger.verbose(`🎯 CACHE HIT: ${key}`);
        return JSON.parse(value);
      } else {
        this.logger.verbose(`❌ CACHE MISS: ${key}`);
        return undefined;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.redisClient?.isOpen) {
        this.logger.warn('Redis client not available');
        return;
      }

      const serialized = JSON.stringify(value);
      const configTTL = Number(this.configService.get('REDIS_TTL', 300));
      const ttlInSeconds = ttl !== undefined ? ttl : configTTL;

      await this.redisClient.setEx(key, ttlInSeconds, serialized);
      this.logger.log(`💾 CACHE SET: ${key} (TTL: ${ttlInSeconds}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key: ${key}`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (!this.redisClient?.isOpen) {
        this.logger.warn('Redis client not available');
        return;
      }

      await this.redisClient.del(key);
      this.logger.log(`🗑️  CACHE DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      if (!this.redisClient?.isOpen) {
        this.logger.warn('Redis client not available');
        return;
      }

      await this.redisClient.flushDb();
      this.logger.warn('🧹 CACHE RESET: All cache cleared');
    } catch (error) {
      this.logger.error('Cache reset error', error);
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      // Cache miss - fetch fresh data
      this.logger.verbose(`🔄 CACHE MISS - Fetching fresh data: ${key}`);
      const value = await factory();

      // Store in cache
      await this.set(key, value, ttl);

      return value;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key: ${key}`, error);
      // If cache fails, still return the data
      return factory();
    }
  }

  /**
   * Delete cache keys by pattern
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      if (!this.redisClient?.isOpen) {
        this.logger.warn('Redis client not available');
        return;
      }

      const keys = await this.redisClient.keys(`${pattern}*`);

      if (keys && keys.length > 0) {
        this.logger.log(`🗑️  CACHE DELETE PATTERN: ${pattern} (${keys.length} keys)`);
        for (const key of keys) {
          await this.redisClient.del(key);
        }
      } else {
        this.logger.verbose(`No keys found for pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache delByPattern error for pattern: ${pattern}`, error);
    }
  }
}
