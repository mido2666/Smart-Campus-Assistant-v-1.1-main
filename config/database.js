import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Global variable to store the Prisma client instance
// In Node.js ESM, we use globalThis instead of global
const globalForPrisma = globalThis;

// Create a singleton instance of Prisma Client
// Only log queries if DEBUG_PRISMA=true, otherwise only errors
const shouldLogQueries = process.env.DEBUG_PRISMA === 'true' ||
  (process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_QUERIES === 'true');

// Optimize connection pool settings
const getOptimizedDatabaseUrl = () => {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Ensure we have a reasonable connection limit
  // Supabase transaction pooler supports up to 15-20 usually, but let's be safe with 10
  // If it's currently 1, force it to 10
  if (!url.includes('connection_limit')) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}connection_limit=10`;
  } else {
    // Force minimum connection limit of 10 if it's set to 1 or small
    url = url.replace(/connection_limit=\d+/, 'connection_limit=10');
  }

  // Ensure we have a reasonable pool timeout
  if (!url.includes('pool_timeout')) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}pool_timeout=30`;
  } else {
    url = url.replace(/pool_timeout=\d+/, 'pool_timeout=30');
  }

  // Ensure we have a reasonable connect timeout
  if (!url.includes('connect_timeout')) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}connect_timeout=30`;
  } else {
    url = url.replace(/connect_timeout=\d+/, 'connect_timeout=30');
  }

  // Add pgbouncer=true if not present (often needed for Supabase transaction mode)
  if (!url.includes('pgbouncer')) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}pgbouncer=true`;
  }

  return url;
};

const prisma = globalForPrisma.__prisma || new PrismaClient({
  log: shouldLogQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
  datasources: {
    db: {
      url: getOptimizedDatabaseUrl(),
    },
  },
});

// In development, store the client on the global object to prevent
// multiple instances during hot reloads
if (process.env.NODE_ENV === 'development') {
  globalForPrisma.__prisma = prisma;
}

// Export the Prisma client instance
export default prisma;

