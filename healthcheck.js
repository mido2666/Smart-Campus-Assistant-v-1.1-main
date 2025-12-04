#!/usr/bin/env node

/**
 * Health Check Script
 * Comprehensive health check for the application
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

// Configuration
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  timeout: 5000,
  retries: 3,
  retryDelay: 1000
};

// Health check results
let healthStatus = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  checks: {
    server: { status: 'unknown', message: '', responseTime: 0 },
    database: { status: 'unknown', message: '', responseTime: 0 },
    redis: { status: 'unknown', message: '', responseTime: 0 },
    memory: { status: 'unknown', message: '', usage: 0 },
    disk: { status: 'unknown', message: '', usage: 0 }
  }
};

// Check server health
function checkServer() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const options = {
      hostname: config.host,
      port: config.port,
      path: '/health',
      method: 'GET',
      timeout: config.timeout
    };

    const req = http.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      healthStatus.checks.server = {
        status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
        message: `HTTP ${res.statusCode}`,
        responseTime
      };
      resolve();
    });

    req.on('error', (err) => {
      healthStatus.checks.server = {
        status: 'unhealthy',
        message: err.message,
        responseTime: Date.now() - startTime
      };
      resolve();
    });

    req.on('timeout', () => {
      healthStatus.checks.server = {
        status: 'unhealthy',
        message: 'Request timeout',
        responseTime: config.timeout
      };
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Check database health
function checkDatabase() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Use Prisma client to check database connection
    try {
      const { PrismaClient } = require('./src/generated/prisma');
      const prisma = new PrismaClient();
      
      prisma.$queryRaw`SELECT 1`
        .then(() => {
          const responseTime = Date.now() - startTime;
          healthStatus.checks.database = {
            status: 'healthy',
            message: 'Database connection successful',
            responseTime
          };
          prisma.$disconnect();
          resolve();
        })
        .catch((error) => {
          const responseTime = Date.now() - startTime;
          healthStatus.checks.database = {
            status: 'unhealthy',
            message: `Database error: ${error.message}`,
            responseTime
          };
          prisma.$disconnect();
          resolve();
        });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      healthStatus.checks.database = {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`,
        responseTime
      };
      resolve();
    }
  });
}

// Check Redis health
function checkRedis() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Use Redis client to check connection
    try {
      const redis = require('redis');
      const client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      client.connect()
        .then(() => {
          return client.ping();
        })
        .then((result) => {
          const responseTime = Date.now() - startTime;
          healthStatus.checks.redis = {
            status: result === 'PONG' ? 'healthy' : 'unhealthy',
            message: result === 'PONG' ? 'Redis connection successful' : 'Redis ping failed',
            responseTime
          };
          client.quit();
          resolve();
        })
        .catch((error) => {
          const responseTime = Date.now() - startTime;
          healthStatus.checks.redis = {
            status: 'unhealthy',
            message: `Redis error: ${error.message}`,
            responseTime
          };
          client.quit();
          resolve();
        });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      healthStatus.checks.redis = {
        status: 'unhealthy',
        message: `Redis connection failed: ${error.message}`,
        responseTime
      };
      resolve();
    }
  });
}

// Check memory usage
function checkMemory() {
  return new Promise((resolve) => {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    healthStatus.checks.memory = {
      status: memUsagePercent > 90 ? 'unhealthy' : memUsagePercent > 80 ? 'warning' : 'healthy',
      message: `Memory usage: ${memUsagePercent.toFixed(2)}%`,
      usage: memUsagePercent
    };
    resolve();
  });
}

// Check disk usage
function checkDisk() {
  return new Promise((resolve) => {
    exec('df -h /', (error, stdout, stderr) => {
      if (error) {
        healthStatus.checks.disk = {
          status: 'unknown',
          message: 'Unable to check disk usage',
          usage: 0
        };
        resolve();
        return;
      }

      const lines = stdout.trim().split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      const usagePercent = parseInt(parts[4].replace('%', ''));

      healthStatus.checks.disk = {
        status: usagePercent > 90 ? 'unhealthy' : usagePercent > 80 ? 'warning' : 'healthy',
        message: `Disk usage: ${usagePercent}%`,
        usage: usagePercent
      };
      resolve();
    });
  });
}

// Run all health checks
async function runHealthChecks() {
  try {
    await Promise.all([
      checkServer(),
      checkDatabase(),
      checkRedis(),
      checkMemory(),
      checkDisk()
    ]);

    // Determine overall health status
    const checks = Object.values(healthStatus.checks);
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
    const warningChecks = checks.filter(check => check.status === 'warning');

    if (unhealthyChecks.length > 0) {
      healthStatus.status = 'unhealthy';
    } else if (warningChecks.length > 0) {
      healthStatus.status = 'warning';
    } else {
      healthStatus.status = 'healthy';
    }

    // Output health status
    console.log(JSON.stringify(healthStatus, null, 2));

    // Exit with appropriate code
    process.exit(healthStatus.status === 'healthy' ? 0 : 1);

  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

// Run health checks
runHealthChecks();
