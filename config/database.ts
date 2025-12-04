import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a singleton instance of Prisma Client
// Only log queries if DEBUG_PRISMA=true, otherwise only errors
const shouldLogQueries = process.env.DEBUG_PRISMA === 'true' ||
  (process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_QUERIES === 'true');
const prisma = globalThis.__prisma || new PrismaClient({
  log: shouldLogQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
});

// In development, store the client on the global object to prevent
// multiple instances during hot reloads
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Export the Prisma client instance
export default prisma;

// Export types for use throughout the application
export type { User, UserRole } from '@prisma/client';
