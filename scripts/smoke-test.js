#!/usr/bin/env node

/**
 * Smoke Test Script
 * Basic end-to-end functionality verification
 */

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Configuration
const config = {
  frontendPort: process.env.PORT || 3000,
  backendPort: process.env.BACKEND_PORT || 3001,
  frontendUrl: `http://localhost:${process.env.PORT || 3000}`,
  backendUrl: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 2000 // 2 seconds
};

let frontendProcess = null;
let backendProcess = null;

// Cleanup function
function cleanup() {
  logSection('Cleanup');
  
  if (frontendProcess) {
    logInfo('Stopping frontend server...');
    frontendProcess.kill('SIGTERM');
  }
  
  if (backendProcess) {
    logInfo('Stopping backend server...');
    backendProcess.kill('SIGTERM');
  }
  
  // Force exit after cleanup
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Test if a URL is accessible
async function testUrl(url, description) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, { method: 'GET' }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        logSuccess(`${description}: ${res.statusCode}`);
        resolve(true);
      } else {
        logError(`${description}: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', (err) => {
      logError(`${description}: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      logError(`${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Wait for a service to be ready
async function waitForService(url, description, maxAttempts = 10) {
  logInfo(`Waiting for ${description}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isReady = await testUrl(url, `${description} (attempt ${attempt}/${maxAttempts})`);
    if (isReady) {
      return true;
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return false;
}

// Start backend server
async function startBackend() {
  logSection('Starting Backend Server');
  
  return new Promise((resolve, reject) => {
    logInfo('Starting backend server...');
    
    backendProcess = spawn('npm', ['run', 'server:dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    
    backendProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Server running') || output.includes('listening')) {
        logSuccess('Backend server started');
        resolve(true);
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('EADDRINUSE')) {
        logWarning('Backend port already in use, assuming server is running');
        resolve(true);
      } else if (error.includes('Error') || error.includes('error')) {
        logError(`Backend error: ${error}`);
      }
    });
    
    backendProcess.on('error', (err) => {
      logError(`Failed to start backend: ${err.message}`);
      reject(err);
    });
    
    // Timeout after 15 seconds
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        logWarning('Backend startup timeout, assuming it started');
        resolve(true);
      }
    }, 15000);
  });
}

// Start frontend server
async function startFrontend() {
  logSection('Starting Frontend Server');
  
  return new Promise((resolve, reject) => {
    logInfo('Starting frontend server...');
    
    frontendProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    
    frontendProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Local:') || output.includes('ready')) {
        logSuccess('Frontend server started');
        resolve(true);
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('EADDRINUSE')) {
        logWarning('Frontend port already in use, assuming server is running');
        resolve(true);
      } else if (error.includes('Error') || error.includes('error')) {
        logError(`Frontend error: ${error}`);
      }
    });
    
    frontendProcess.on('error', (err) => {
      logError(`Failed to start frontend: ${err.message}`);
      reject(err);
    });
    
    // Timeout after 20 seconds
    setTimeout(() => {
      if (frontendProcess && !frontendProcess.killed) {
        logWarning('Frontend startup timeout, assuming it started');
        resolve(true);
      }
    }, 20000);
  });
}

// Run smoke tests
async function runSmokeTests() {
  logSection('Running Smoke Tests');
  
  const tests = [
    {
      name: 'Backend Health Check',
      url: `${config.backendUrl}/health`,
      critical: true
    },
    {
      name: 'Frontend Homepage',
      url: config.frontendUrl,
      critical: true
    },
    {
      name: 'Frontend Login Page',
      url: `${config.frontendUrl}/login`,
      critical: false
    },
    {
      name: 'Frontend Schedule Page',
      url: `${config.frontendUrl}/schedule`,
      critical: false
    },
    {
      name: 'Frontend Chatbot Page',
      url: `${config.frontendUrl}/chatbot`,
      critical: false
    }
  ];
  
  let passed = 0;
  let failed = 0;
  let criticalFailed = 0;
  
  for (const test of tests) {
    const success = await testUrl(test.url, test.name);
    if (success) {
      passed++;
    } else {
      failed++;
      if (test.critical) {
        criticalFailed++;
      }
    }
  }
  
  return { passed, failed, criticalFailed };
}

// Main smoke test function
async function main() {
  log(`${colors.bold}${colors.blue}🚀 Smart Campus Assistant - Smoke Test${colors.reset}\n`);
  
  try {
    // Start services
    await startBackend();
    await startFrontend();
    
    // Wait for services to be ready
    const backendReady = await waitForService(`${config.backendUrl}/health`, 'Backend API');
    const frontendReady = await waitForService(config.frontendUrl, 'Frontend App');
    
    if (!backendReady) {
      logError('Backend service not ready after timeout');
      process.exit(1);
    }
    
    if (!frontendReady) {
      logError('Frontend service not ready after timeout');
      process.exit(1);
    }
    
    // Run smoke tests
    const results = await runSmokeTests();
    
    // Display results
    logSection('Test Results');
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
      logError(`Failed: ${results.failed}`);
    }
    
    if (results.criticalFailed > 0) {
      logError(`Critical failures: ${results.criticalFailed}`);
      logError('Smoke test FAILED - Critical services not working');
      process.exit(1);
    } else if (results.failed > 0) {
      logWarning('Smoke test PASSED with warnings - Some non-critical tests failed');
      process.exit(0);
    } else {
      logSuccess('Smoke test PASSED - All tests successful');
      process.exit(0);
    }
    
  } catch (error) {
    logError(`Smoke test failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(`Unhandled rejection: ${reason}`);
  cleanup();
  process.exit(1);
});

// Run the smoke test
main().catch((error) => {
  logError(`Smoke test failed: ${error.message}`);
  cleanup();
  process.exit(1);
});
