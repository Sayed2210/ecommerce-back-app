import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
    prefix?: string;
}

export interface RedisStats {
    totalKeys: number;
    memoryUsed: string;
    uptime: string;
    connectedClients: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis;
    private subscriber: Redis;
    private isConnected = false;

    constructor(private readonly configService: ConfigService) {
        const config = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD'),
            db: this.configService.get('REDIS_DB', 0),
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (error) => {
                this.logger.warn(`Redis reconnection error: ${error.message}`);
                return true;
            },
        };

        this.client = new Redis(config);
        this.subscriber = new Redis(config);

        this.setupEventHandlers(this.client, 'Client');
        this.setupEventHandlers(this.subscriber, 'Subscriber');
    }

    private setupEventHandlers(redisInstance: Redis, name: string): void {
        redisInstance.on('connect', () => {
            this.isConnected = true;
            this.logger.log(`✅ Redis ${name} connected`);
        });

        redisInstance.on('ready', () => {
            this.logger.log(`🚀 Redis ${name} ready`);
        });

        redisInstance.on('error', (err) => {
            this.isConnected = false;
            this.logger.error(`❌ Redis ${name} error:`, err.message);
        });

        redisInstance.on('close', () => {
            this.isConnected = false;
            this.logger.warn(`⚠️  Redis ${name} connection closed`);
        });

        redisInstance.on('reconnecting', () => {
            this.logger.log(`🔄 Redis ${name} reconnecting...`);
        });
    }

    async onModuleInit(): Promise<void> {
        // Test connection
        try {
            await this.client.ping();
            this.logger.log('🎯 Redis service initialized');
        } catch (error) {
            this.logger.error('❌ Failed to connect to Redis on init:', error.message);
        }
    }

    async onModuleDestroy(): Promise<void> {
        this.logger.log('🛑 Shutting down Redis service...');

        try {
            await this.client.quit();
            await this.subscriber.quit();
            this.logger.log('✅ Redis connections closed');
        } catch (error) {
            this.logger.error('❌ Error closing Redis connections:', error.message);
        }
    }

    // ===== Basic Operations =====

    /**
     * Get value by key
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error(`❌ Failed to get key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Set value with optional TTL
     */
    async set<T>(key: string, value: T, ttlInSeconds?: number): Promise<boolean> {
        try {
            const serializedValue = JSON.stringify(value);

            if (ttlInSeconds) {
                await this.client.setex(key, ttlInSeconds, serializedValue);
            } else {
                await this.client.set(key, serializedValue);
            }

            return true;
        } catch (error) {
            this.logger.error(`❌ Failed to set key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Delete key
     */
    async delete(key: string): Promise<boolean> {
        try {
            const result = await this.client.del(key);
            return result > 0;
        } catch (error) {
            this.logger.error(`❌ Failed to delete key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Delete multiple keys
     */
    async deleteMultiple(keys: string[]): Promise<number> {
        try {
            return await this.client.del(...keys);
        } catch (error) {
            this.logger.error(`❌ Failed to delete keys:`, error.message);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(`❌ Failed to check key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Set expiration time on key
     */
    async expire(key: string, seconds: number): Promise<boolean> {
        try {
            const result = await this.client.expire(key, seconds);
            return result === 1;
        } catch (error) {
            this.logger.error(`❌ Failed to set expiration for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Get remaining TTL for key
     */
    async ttl(key: string): Promise<number> {
        try {
            return await this.client.ttl(key);
        } catch (error) {
            this.logger.error(`❌ Failed to get TTL for key ${key}:`, error.message);
            return -2;
        }
    }

    // ===== Advanced Operations =====

    /**
     * Increment value (for counters)
     */
    async increment(key: string, amount = 1): Promise<number | null> {
        try {
            return await this.client.incrby(key, amount);
        } catch (error) {
            this.logger.error(`❌ Failed to increment key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Decrement value
     */
    async decrement(key: string, amount = 1): Promise<number | null> {
        try {
            return await this.client.decrby(key, amount);
        } catch (error) {
            this.logger.error(`❌ Failed to decrement key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Set hash field
     */
    async hset(key: string, field: string, value: any): Promise<boolean> {
        try {
            const serializedValue = JSON.stringify(value);
            const result = await this.client.hset(key, field, serializedValue);
            return result > 0;
        } catch (error) {
            this.logger.error(`❌ Failed to hash set ${key}.${field}:`, error.message);
            return false;
        }
    }

    /**
     * Get hash field
     */
    async hget<T>(key: string, field: string): Promise<T | null> {
        try {
            const value = await this.client.hget(key, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error(`❌ Failed to hash get ${key}.${field}:`, error.message);
            return null;
        }
    }

    /**
     * Get all hash fields
     */
    async hgetall<T>(key: string): Promise<Record<string, T> | null> {
        try {
            const values = await this.client.hgetall(key);
            if (!values || Object.keys(values).length === 0) return null;

            const result: Record<string, T> = {};
            for (const [field, value] of Object.entries(values)) {
                result[field] = JSON.parse(value);
            }
            return result;
        } catch (error) {
            this.logger.error(`❌ Failed to hash get all ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Delete hash field
     */
    async hdel(key: string, field: string): Promise<boolean> {
        try {
            const result = await this.client.hdel(key, field);
            return result === 1;
        } catch (error) {
            this.logger.error(`❌ Failed to hash delete ${key}.${field}:`, error.message);
            return false;
        }
    }

    // ===== Caching Patterns =====

    /**
     * Cache with TTL pattern
     */
    async cache<T>(key: string, fetchFn: () => Promise<T>, ttl = 300): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            this.logger.debug(`📦 Cache hit: ${key}`);
            return cached;
        }

        this.logger.debug(`💾 Cache miss: ${key}`);
        const freshData = await fetchFn();
        await this.set(key, freshData, ttl);
        return freshData;
    }

    /**
     * Distributed lock pattern
     */
    async acquireLock(lockKey: string, ttl = 30): Promise<string | null> {
        const lockValue = Date.now().toString();
        const acquired = await this.set(`lock:${lockKey}`, lockValue, ttl);
        return acquired ? lockValue : null;
    }

    async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
        const currentValue = await this.get(`lock:${lockKey}`);
        if (currentValue === lockValue) {
            await this.delete(`lock:${lockKey}`);
            return true;
        }
        return false;
    }

    // ===== Pub/Sub =====

    /**
     * Publish message to channel
     */
    async publish(channel: string, message: any): Promise<number> {
        try {
            const serializedMessage = JSON.stringify(message);
            return await this.client.publish(channel, serializedMessage);
        } catch (error) {
            this.logger.error(`❌ Failed to publish to ${channel}:`, error.message);
            return 0;
        }
    }

    /**
     * Subscribe to channel
     */
    subscribe(channel: string, callback: (message: any) => void): void {
        this.subscriber.subscribe(channel, (err) => {
            if (err) {
                this.logger.error(`❌ Failed to subscribe to ${channel}:`, err.message);
            } else {
                this.logger.log(`📡 Subscribed to channel: ${channel}`);
            }
        });

        this.subscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(parsedMessage);
                } catch (error) {
                    this.logger.error(`❌ Failed to parse message from ${channel}:`, error.message);
                }
            }
        });
    }

    /**
     * Unsubscribe from channel
     */
    async unsubscribe(channel: string): Promise<void> {
        await this.subscriber.unsubscribe(channel);
        this.logger.log(`📴 Unsubscribed from channel: ${channel}`);
    }

    // ===== Monitoring & Health =====

    /**
     * Get Redis stats
     */
    async getStats(): Promise<RedisStats | null> {
        try {
            const info = await this.client.info();
            const lines = info.split('\r\n');
            const stats: Partial<RedisStats> = {};

            for (const line of lines) {
                if (line.startsWith('db0:')) {
                    const keys = line.split(',')[0].split('=')[1];
                    stats.totalKeys = parseInt(keys);
                }
                if (line.startsWith('used_memory_human:')) {
                    stats.memoryUsed = line.split(':')[1];
                }
                if (line.startsWith('uptime_in_days:')) {
                    const days = parseInt(line.split(':')[1]);
                    stats.uptime = `${days} days`;
                }
                if (line.startsWith('connected_clients:')) {
                    stats.connectedClients = parseInt(line.split(':')[1]);
                }
            }

            return stats as RedisStats;
        } catch (error) {
            this.logger.error('❌ Failed to get Redis stats:', error.message);
            return null;
        }
    }

    /**
     * Check Redis health
     */
    async isHealthy(): Promise<boolean> {
        try {
            await this.client.ping();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Flush all data (use with caution!)
     */
    async flushAll(): Promise<void> {
        if (process.env.NODE_ENV !== 'production') {
            await this.client.flushall();
            this.logger.warn('🚨 Redis database flushed');
        } else {
            this.logger.error('🚫 Cannot flush Redis in production');
        }
    }

    /**
     * Scan keys matching pattern
     */
    async scan(pattern: string, count = 100): Promise<string[]> {
        try {
            const stream = this.client.scanStream({
                match: pattern,
                count,
            });

            const keys: string[] = [];
            return new Promise((resolve, reject) => {
                stream.on('data', (resultKeys) => {
                    keys.push(...resultKeys);
                });
                stream.on('end', () => resolve(keys));
                stream.on('error', reject);
            });
        } catch (error) {
            this.logger.error(`❌ Failed to scan keys with pattern ${pattern}:`, error.message);
            return [];
        }
    }

    /**
     * Delete keys matching pattern
     */
    async deletePattern(pattern: string): Promise<number> {
        const keys = await this.scan(pattern);
        if (keys.length === 0) return 0;

        return await this.deleteMultiple(keys);
    }
}