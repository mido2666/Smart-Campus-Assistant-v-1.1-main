/**
 * Upstash Redis Configuration
 * Alternative to Redis Labs with better GitHub integration
 */

import { Redis } from '@upstash/redis';
import logger from '../src/utils/logger.js';

export interface UpstashConfig {
    url: string;
    token: string;
}

/**
 * Get Upstash configuration from environment
 */
export function getUpstashConfig(): UpstashConfig {
    return {
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
    };
}

/**
 * Create Upstash Redis client
 */
export function createUpstashClient() {
    const config = getUpstashConfig();

    if (!config.url || !config.token) {
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
    }

    const client = new Redis({
        url: config.url,
        token: config.token
    });

    logger.info('✅ Upstash Redis client initialized');

    return client;
}

/**
 * Upstash Redis utility service
 */
export class UpstashService {
    private client: Redis;

    constructor() {
        this.client = createUpstashClient();
    }

    /**
     * Set a key-value pair with optional expiration
     */
    async set(key: string, value: any, expirationSeconds?: number): Promise<void> {
        if (expirationSeconds) {
            await this.client.setex(key, expirationSeconds, JSON.stringify(value));
        } else {
            await this.client.set(key, JSON.stringify(value));
        }
    }

    /**
     * Get a value by key
     */
    async get<T>(key: string): Promise<T | null> {
        const result = await this.client.get(key);
        return result ? (result as T) : null;
    }

    /**
     * Delete a key
     */
    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }

    /**
     * Set expiration on a key
     */
    async expire(key: string, seconds: number): Promise<void> {
        await this.client.expire(key, seconds);
    }

    /**
     * Get all keys matching a pattern
     */
    async keys(pattern: string): Promise<string[]> {
        return await this.client.keys(pattern);
    }

    /**
     * Cache a function result
     */
    async cache<T>(
        key: string,
        fn: () => Promise<T>,
        expirationSeconds: number = 300
    ): Promise<T> {
        // Try to get from cache
        const cached = await this.get<T>(key);
        if (cached) {
            return cached;
        }

        // Execute function and cache result
        const result = await fn();
        await this.set(key, result, expirationSeconds);
        return result;
    }

    /**
     * Increment a counter
     */
    async increment(key: string): Promise<number> {
        return await this.client.incr(key);
    }

    /**
     * Decrement a counter
     */
    async decrement(key: string): Promise<number> {
        return await this.client.decr(key);
    }
}

// Export singleton instance
export const upstashService = new UpstashService();

export default upstashService;
