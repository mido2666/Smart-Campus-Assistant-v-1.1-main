/**
 * Redis Configuration
 * Setup and connection for Redis Labs
 */

import { createClient } from 'redis';
import logger from '../src/utils/logger.js';

export interface RedisConfig {
    url: string;
    password?: string;
    tls?: boolean;
}

/**
 * Get Redis configuration from environment
 */
export function getRedisConfig(): RedisConfig {
    return {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === 'true'
    };
}

/**
 * Create Redis client
 */
export function createRedisClient() {
    const config = getRedisConfig();

    const socketOptions: any = {
        rejectUnauthorized: false
    };

    if (config.tls) {
        socketOptions.tls = true;
    }

    const client = createClient({
        url: config.url,
        password: config.password,
        socket: socketOptions
    });

    client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
        logger.info('✅ Redis client connected');
    });

    client.on('ready', () => {
        logger.info('✅ Redis client ready');
    });

    client.on('reconnecting', () => {
        logger.warn('⚠️ Redis client reconnecting');
    });

    return client;
}

/**
 * Redis utility functions
 */
export class RedisService {
    private client: ReturnType<typeof createClient>;
    private connected: boolean = false;

    constructor() {
        this.client = createRedisClient();
    }

    async connect(): Promise<void> {
        if (!this.connected) {
            await this.client.connect();
            this.connected = true;
        }
    }

    async disconnect(): Promise<void> {
        if (this.connected) {
            await this.client.quit();
            this.connected = false;
        }
    }

    /**
     * Set a key-value pair with optional expiration
     */
    async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
        await this.connect();
        if (expirationSeconds) {
            await this.client.setEx(key, expirationSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    /**
     * Get a value by key
     */
    async get(key: string): Promise<string | null> {
        await this.connect();
        return (await this.client.get(key)) as string | null;
    }

    /**
     * Delete a key
     */
    async delete(key: string): Promise<void> {
        await this.connect();
        await this.client.del(key);
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        await this.connect();
        const result = await this.client.exists(key);
        return result === 1;
    }

    /**
     * Set expiration on a key
     */
    async expire(key: string, seconds: number): Promise<void> {
        await this.connect();
        await this.client.expire(key, seconds);
    }

    /**
     * Get all keys matching a pattern
     */
    async keys(pattern: string): Promise<string[]> {
        await this.connect();
        return (await this.client.keys(pattern)) as string[];
    }

    /**
     * Cache a function result
     */
    async cache<T>(
        key: string,
        fn: () => Promise<T>,
        expirationSeconds: number = 300
    ): Promise<T> {
        await this.connect();

        // Try to get from cache
        const cached = await this.get(key);
        if (cached) {
            try {
                return JSON.parse(cached) as T;
            } catch (error) {
                logger.warn(`Failed to parse cached value for key: ${key}`);
            }
        }

        // Execute function and cache result
        const result = await fn();
        await this.set(key, JSON.stringify(result), expirationSeconds);
        return result;
    }
}

// Export singleton instance
export const redisService = new RedisService();

export default redisService;
