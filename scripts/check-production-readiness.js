#!/usr/bin/env node

/**
 * Production Readiness Check
 * Validates environment variables, API connectivity, and basic system health
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Required environment variables
const REQUIRED_ENV_VARS = [
  'VITE_API_BASE_URL',
  'JWT_SECRET',
  'DATABASE_URL',
  'NODE_ENV'
];

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'CORS_ORIGIN',
  'PORT',
  'FRONTEND_URL',
  'OPENAI_API_KEY'
];

async function checkEnvironmentVariables() {
  logSection('Environment Variables');
  
  let allRequired = true;
  let allRecommended = true;
  
  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logError(`${varName} is missing (REQUIRED)`);
      allRequired = false;
    }
  }
  
  // Check recommended variables
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logWarning(`${varName} is not set (recommended)`);
      allRecommended = false;
    }
  }
  
  return { allRequired, allRecommended };
}

async function checkApiConnectivity() {
  logSection('API Connectivity');
  
  const apiUrl = process.env.VITE_API_BASE_URL;
  if (!apiUrl) {
    logError('VITE_API_BASE_URL not set, cannot test API connectivity');
    return false;
  }
  
  try {
    const url = new URL(apiUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    return new Promise((resolve) => {
      const req = client.request(`${apiUrl}/health`, { method: 'GET' }, (res) => {
        if (res.statusCode === 200) {
          logSuccess(`API health check passed (${res.statusCode})`);
          resolve(true);
        } else {
          logError(`API health check failed (${res.statusCode})`);
          resolve(false);
        }
      });
      
      req.on('error', (err) => {
        logError(`API connection failed: ${err.message}`);
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        logError('API connection timeout (5s)');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    logError(`Invalid API URL: ${error.message}`);
    return false;
  }
}

async function checkCorsConfiguration() {
  logSection('CORS Configuration');
  
  const corsOrigin = process.env.CORS_ORIGIN;
  const frontendUrl = process.env.FRONTEND_URL;
  const apiUrl = process.env.VITE_API_BASE_URL;
  
  if (!corsOrigin && !frontendUrl) {
    logWarning('CORS_ORIGIN and FRONTEND_URL not set - CORS may not work properly');
    return false;
  }
  
  if (corsOrigin && frontendUrl) {
    if (corsOrigin === frontendUrl) {
      logSuccess('CORS origin matches frontend URL');
      return true;
    } else {
      logWarning(`CORS origin (${corsOrigin}) doesn't match frontend URL (${frontendUrl})`);
      return false;
    }
  }
  
  if (corsOrigin) {
    logSuccess(`CORS origin set: ${corsOrigin}`);
    return true;
  }
  
  if (frontendUrl) {
    logSuccess(`Frontend URL set: ${frontendUrl}`);
    return true;
  }
  
  return false;
}

async function checkDatabaseConnection() {
  logSection('Database Connection');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logError('DATABASE_URL not set, cannot test database connection');
    return false;
  }
  
  // For SQLite, just check if the file exists
  if (databaseUrl.startsWith('file:') || databaseUrl.startsWith('sqlite:')) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const dbPath = databaseUrl.replace(/^(file:|sqlite:)/, '');
      if (fs.existsSync(dbPath)) {
        logSuccess('SQLite database file exists');
        return true;
      } else {
        logError('SQLite database file not found');
        return false;
      }
    } catch (error) {
      logError(`Database file check failed: ${error.message}`);
      return false;
    }
  }
  
  // For other databases, we'd need specific connection logic
  logWarning('Database connection test not implemented for this database type');
  return true;
}

async function checkSecurityConfiguration() {
  logSection('Security Configuration');
  
  const jwtSecret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  
  let securityScore = 0;
  
  if (jwtSecret && jwtSecret.length >= 32) {
    logSuccess('JWT secret is set and has sufficient length');
    securityScore++;
  } else {
    logError('JWT secret is missing or too short (minimum 32 characters)');
  }
  
  if (nodeEnv === 'production') {
    logSuccess('NODE_ENV is set to production');
    securityScore++;
  } else {
    logWarning(`NODE_ENV is set to '${nodeEnv}' (should be 'production' in production)`);
  }
  
  if (process.env.CORS_ORIGIN && !process.env.CORS_ORIGIN.includes('*')) {
    logSuccess('CORS origin is specific (not wildcard)');
    securityScore++;
  } else {
    logWarning('CORS origin is wildcard or not set - consider restricting for production');
  }
  
  return securityScore >= 2;
}

async function main() {
  log(`${colors.bold}${colors.blue}🚀 Production Readiness Check${colors.reset}\n`);
  
  const results = {
    env: await checkEnvironmentVariables(),
    api: await checkApiConnectivity(),
    cors: await checkCorsConfiguration(),
    database: await checkDatabaseConnection(),
    security: await checkSecurityConfiguration()
  };
  
  logSection('Summary');
  
  const criticalChecks = [
    results.env.allRequired,
    results.api,
    results.database
  ];
  
  const allCriticalPassed = criticalChecks.every(check => check === true);
  const allChecksPassed = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : result.allRequired
  );
  
  if (allCriticalPassed) {
    logSuccess('All critical checks passed! System is ready for production.');
    log(`\n${colors.green}Deployment Status: ${colors.bold}READY${colors.reset}`);
  } else {
    logError('Critical checks failed. System is NOT ready for production.');
    log(`\n${colors.red}Deployment Status: ${colors.bold}NOT READY${colors.reset}`);
  }
  
  if (!results.env.allRecommended) {
    logWarning('Some recommended environment variables are missing. Consider setting them for optimal performance.');
  }
  
  if (!results.security) {
    logWarning('Security configuration could be improved. Review security settings before production deployment.');
  }
  
  // Exit with appropriate code
  process.exit(allCriticalPassed ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the check
main().catch((error) => {
  logError(`Check failed: ${error.message}`);
  process.exit(1);
});
