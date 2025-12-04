import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// Redis is optional - set to null if not available
const redisClient = null;

// Basic health check
router.get('/', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'unknown', message: '', responseTime: 0 },
      redis: { status: 'unknown', message: '', responseTime: 0 },
      memory: { status: 'unknown', message: '', usage: 0 },
      disk: { status: 'unknown', message: '', usage: 0 }
    }
  };

  try {
    // Check database
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database = {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: Date.now() - dbStartTime
    };
  } catch (error) {
    healthStatus.checks.database = {
      status: 'unhealthy',
      message: `Database error: ${error.message}`,
      responseTime: 0
    };
  }

  if (redisClient) {
    try {
      // Check Redis
      const redisStartTime = Date.now();
      const result = await redisClient.ping();
      healthStatus.checks.redis = {
        status: result === 'PONG' ? 'healthy' : 'unhealthy',
        message: result === 'PONG' ? 'Redis connection successful' : 'Redis ping failed',
        responseTime: Date.now() - redisStartTime
      };
    } catch (error) {
      healthStatus.checks.redis = {
        status: 'unhealthy',
        message: `Redis error: ${error.message}`,
        responseTime: 0
      };
    }
  } else {
    healthStatus.checks.redis = {
      status: 'skipped',
      message: 'Redis not configured',
      responseTime: 0
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const os = await import('os');
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = (usedMem / totalMem) * 100;

  healthStatus.checks.memory = {
    status: memUsagePercent > 90 ? 'unhealthy' : memUsagePercent > 80 ? 'warning' : 'healthy',
    message: `Memory usage: ${memUsagePercent.toFixed(2)}%`,
    usage: memUsagePercent
  };

  // Check disk usage
  const { exec } = await import('child_process');
  exec('df -h /', (error, stdout, stderr) => {
    if (error) {
      healthStatus.checks.disk = {
        status: 'unknown',
        message: 'Unable to check disk usage',
        usage: 0
      };
    } else {
      const lines = stdout.trim().split('\n');
      const dataLine = lines[1];
      const parts = dataLine.split(/\s+/);
      const usagePercent = parseInt(parts[4].replace('%', ''));

      healthStatus.checks.disk = {
        status: usagePercent > 90 ? 'unhealthy' : usagePercent > 80 ? 'warning' : 'healthy',
        message: `Disk usage: ${usagePercent}%`,
        usage: usagePercent
      };
    }
  });

  // Determine overall health status
  const checks = Object.values(healthStatus.checks);
  const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
  const warningChecks = checks.filter(check => check.status === 'warning');

  if (unhealthyChecks.length > 0) {
    healthStatus.status = 'unhealthy';
    res.status(503).json(healthStatus);
  } else if (warningChecks.length > 0) {
    healthStatus.status = 'warning';
    res.status(200).json(healthStatus);
  } else {
    res.status(200).json(healthStatus);
  }
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    await prisma.$queryRaw`SELECT 1`;

    // Only check Redis if it's configured
    if (redisClient) {
      await redisClient.ping();
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint for Prometheus
router.get('/metrics', async (req, res) => {
  const memUsage = process.memoryUsage();
  const os = await import('os');
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = (usedMem / totalMem) * 100;

  const metrics = `
# HELP node_memory_usage_percent Memory usage percentage
# TYPE node_memory_usage_percent gauge
node_memory_usage_percent ${memUsagePercent}

# HELP node_memory_heap_used_bytes Heap memory used in bytes
# TYPE node_memory_heap_used_bytes gauge
node_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP node_memory_heap_total_bytes Total heap memory in bytes
# TYPE node_memory_heap_total_bytes gauge
node_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP node_memory_external_bytes External memory in bytes
# TYPE node_memory_external_bytes gauge
node_memory_external_bytes ${memUsage.external}

# HELP node_memory_rss_bytes Resident set size in bytes
# TYPE node_memory_rss_bytes gauge
node_memory_rss_bytes ${memUsage.rss}

# HELP node_process_uptime_seconds Process uptime in seconds
# TYPE node_process_uptime_seconds gauge
node_process_uptime_seconds ${process.uptime()}

# HELP node_process_cpu_usage_percent CPU usage percentage
# TYPE node_process_cpu_usage_percent gauge
node_process_cpu_usage_percent ${process.cpuUsage().user / 1000000}

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/health"} 1
`;

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

export default router;
