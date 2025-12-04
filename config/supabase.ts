/**
 * Supabase Configuration
 * Connection and utilities for Supabase PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import logger from '../src/utils/logger.js';

export interface SupabaseConfig {
    databaseUrl: string;
    directUrl?: string;
    pooling: {
        min: number;
        max: number;
        idleTimeout: number;
    };
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig(): SupabaseConfig {
    return {
        databaseUrl: process.env.DATABASE_URL || '',
        directUrl: process.env.DIRECT_URL,
        pooling: {
            min: parseInt(process.env.DB_POOL_MIN || '2'),
            max: parseInt(process.env.DB_POOL_MAX || '10'),
            idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000')
        }
    };
}

/**
 * Create Prisma Client with Supabase configuration
 */
let prismaClient: PrismaClient | null = null;

export function createPrismaClient(): PrismaClient {
    if (prismaClient) {
        return prismaClient;
    }

    const config = getSupabaseConfig();

    // Validate database URL
    if (!config.databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    prismaClient = new PrismaClient({
        datasources: {
            db: {
                url: config.databaseUrl
            }
        },
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error']
    });

    // Handle connection events
    prismaClient.$connect()
        .then(() => {
            logger.info('✅ Connected to Supabase PostgreSQL database');
        })
        .catch((error) => {
            logger.error('❌ Failed to connect to Supabase database:', error);
            throw error;
        });

    return prismaClient;
}

/**
 * Disconnect from database
 */
export async function disconnectPrisma(): Promise<void> {
    if (prismaClient) {
        await prismaClient.$disconnect();
        logger.info('Disconnected from Supabase database');
        prismaClient = null;
    }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        const client = createPrismaClient();
        await client.$queryRaw`SELECT 1`;
        logger.info('✅ Database connection test successful');
        return true;
    } catch (error) {
        logger.error('❌ Database connection test failed:', error);
        return false;
    }
}

/**
 * Get database health status
 */
export async function getDatabaseHealth(): Promise<{
    connected: boolean;
    latency?: number;
    error?: string;
}> {
    try {
        const client = createPrismaClient();
        const startTime = Date.now();
        await client.$queryRaw`SELECT 1`;
        const latency = Date.now() - startTime;

        return {
            connected: true,
            latency
        };
    } catch (error) {
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Export singleton Prisma client
export const prisma = createPrismaClient();

export default prisma;
