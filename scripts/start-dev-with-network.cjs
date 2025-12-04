#!/usr/bin/env node

/**
 * Start Vite Dev Server with Network Access
 * Ensures proper network configuration and provides troubleshooting info
 */

const { spawn } = require('child_process');
const { execSync } = require('child_process');
const os = require('os');

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

function getLocalIP() {
  try {
    const { networkInterfaces } = os;
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

function checkPortInUse(port) {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, { encoding: 'utf-8' });
    return output.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function killProcessOnPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, { encoding: 'utf-8' });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          logSuccess(`Killed process ${pid} on port ${port}`);
        } catch (error) {
          // Ignore
        }
      }
    }
  } catch (error) {
    // Ignore
  }
}

function startDevServer() {
  log(`\n${colors.bold}${colors.blue}=== Starting Vite Dev Server with Network Access ===${colors.reset}\n`);
  
  const port = 5173;
  const localIP = getLocalIP();
  
  // Check if port is in use
  if (checkPortInUse(port)) {
    logWarning(`Port ${port} is already in use`);
    logInfo('Attempting to free the port...');
    killProcessOnPort(port);
    
    // Wait a bit
    setTimeout(() => {
      if (checkPortInUse(port)) {
        logError(`Port ${port} is still in use. Please close the process manually.`);
        logInfo('To find and kill the process:');
        log(`  netstat -ano | findstr ":${port}"`);
        log('  taskkill /PID <PID> /F');
        process.exit(1);
      } else {
        logSuccess('Port freed successfully');
        startVite();
      }
    }, 1000);
  } else {
    startVite();
  }
  
  function startVite() {
    logInfo('Starting Vite dev server...');
    log('');
    
    // Display network information
    log(`${colors.bold}Network Access Information:${colors.reset}`);
    log(`  • Local: http://localhost:${port}`);
    log(`  • Network: http://${localIP || 'your-ip'}:${port}`);
    log('');
    
    logWarning('Important Notes:');
    log('  1. Make sure Windows Firewall allows Node.js on port 5173');
    log('  2. Ensure you are on the same network as other devices');
    log('  3. If connection fails, check firewall settings');
    log('');
    
    // Start Vite
    const vite = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        // Ensure Vite uses 0.0.0.0
        VITE_HOST: '0.0.0.0',
      }
    });
    
    vite.on('error', (error) => {
      logError(`Failed to start Vite: ${error.message}`);
      process.exit(1);
    });
    
    vite.on('exit', (code) => {
      if (code !== 0) {
        logError(`Vite exited with code ${code}`);
      }
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      log('\n\nShutting down...');
      vite.kill();
      process.exit(0);
    });
  }
}

// Run
try {
  startDevServer();
} catch (error) {
  logError(`Error: ${error.message}`);
  process.exit(1);
}

