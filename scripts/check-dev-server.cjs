#!/usr/bin/env node

/**
 * Check Development Server Status
 * Verifies if Vite dev server is running and accessible
 */

const http = require('http');
const { execSync } = require('child_process');

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

function checkPort(host, port) {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}`, (res) => {
      resolve({ success: true, statusCode: res.statusCode });
    });
    
    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

function getLocalIP() {
  try {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // Skip internal and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (error) {
    // Ignore
  }
  return null;
}

function checkProcessOnPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    return output.trim().length > 0;
  } catch (error) {
    return false;
  }
}

async function checkDevServer() {
  log(`\n${colors.bold}${colors.blue}=== Development Server Status Check ===${colors.reset}\n`);
  
  const port = 5173;
  const hosts = [
    { name: 'localhost', host: 'localhost' },
    { name: '127.0.0.1', host: '127.0.0.1' },
  ];
  
  // Get local IP
  const localIP = getLocalIP();
  if (localIP) {
    hosts.push({ name: `Network IP (${localIP})`, host: localIP });
  }
  
  // Check if port is in use
  logInfo('Checking if port 5173 is in use...');
  const portInUse = checkProcessOnPort(port);
  
  if (portInUse) {
    logSuccess(`Port ${port} is in use`);
  } else {
    logError(`Port ${port} is not in use`);
    logWarning('Vite dev server may not be running');
    logInfo('Start it with: npm run dev');
    log('');
    process.exit(1);
  }
  
  log('');
  logInfo('Testing server accessibility...\n');
  
  // Test each host
  let allAccessible = true;
  for (const { name, host } of hosts) {
    log(`Testing ${name} (${host}:${port})...`);
    const result = await checkPort(host, port);
    
    if (result.success) {
      logSuccess(`  ✓ Accessible (Status: ${result.statusCode})`);
      logInfo(`  → http://${host}:${port}`);
    } else {
      logError(`  ✗ Not accessible: ${result.error}`);
      allAccessible = false;
    }
    log('');
  }
  
  // Summary
  log(`${colors.bold}${colors.blue}=== Summary ===${colors.reset}\n`);
  
  if (allAccessible) {
    logSuccess('Server is accessible from all tested addresses!');
    log('');
    logInfo('Access URLs:');
    log(`  • Local: http://localhost:${port}`);
    log(`  • Network: http://${localIP || 'your-ip'}:${port}`);
  } else {
    logWarning('Some addresses are not accessible');
    log('');
    logInfo('Troubleshooting:');
    log('  1. Make sure Vite is running: npm run dev');
    log('  2. Check Windows Firewall settings');
    log('  3. Verify vite.config.ts has: host: "0.0.0.0"');
    log('  4. Try accessing from the same machine first: http://localhost:5173');
  }
  
  log('');
  process.exit(allAccessible ? 0 : 1);
}

// Run the check
try {
  checkDevServer();
} catch (error) {
  logError(`Error: ${error.message}`);
  process.exit(1);
}

