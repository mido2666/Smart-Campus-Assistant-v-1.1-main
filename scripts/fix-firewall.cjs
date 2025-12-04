#!/usr/bin/env node

/**
 * Windows Firewall Fix Script
 * Provides instructions and PowerShell commands to allow Node.js through firewall
 */

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

function fixFirewall() {
  log(`\n${colors.bold}${colors.blue}=== Windows Firewall Configuration ===${colors.reset}\n`);
  
  logWarning('This script will help you configure Windows Firewall for Vite dev server.');
  logInfo('You need Administrator privileges to modify firewall rules.\n');
  
  log(`${colors.bold}Option 1: Allow Node.js through Firewall (Recommended)${colors.reset}\n`);
  log('Run PowerShell as Administrator and execute:');
  log('');
  log(colors.yellow + 'New-NetFirewallRule -DisplayName "Node.js Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow' + colors.reset);
  log('');
  
  log(`${colors.bold}Option 2: Allow Node.js Application${colors.reset}\n`);
  log('Run PowerShell as Administrator and execute:');
  log('');
  log(colors.yellow + '$nodePath = (Get-Command node).Source; New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program $nodePath -Action Allow' + colors.reset);
  log('');
  
  log(`${colors.bold}Option 3: Manual Configuration${colors.reset}\n`);
  log('1. Open Windows Defender Firewall');
  log('2. Click "Advanced settings"');
  log('3. Click "Inbound Rules" → "New Rule"');
  log('4. Select "Port" → Next');
  log('5. Select "TCP" and enter port "5173" → Next');
  log('6. Select "Allow the connection" → Next');
  log('7. Check all profiles (Domain, Private, Public) → Next');
  log('8. Name it "Vite Dev Server" → Finish');
  log('');
  
  logInfo('After configuring firewall, restart Vite dev server:');
  log('  npm run dev');
  log('');
  
  // Try to detect if running as admin (this won't work perfectly, but we try)
  try {
    execSync('net session >nul 2>&1', { shell: true });
    logSuccess('Running with Administrator privileges!');
    logInfo('Attempting to create firewall rule...');
    log('');
    
    try {
      const ruleName = 'Node.js Vite Dev Server';
      // Check if rule exists
      try {
        execSync(`netsh advfirewall firewall show rule name="${ruleName}"`, { stdio: 'ignore' });
        logSuccess('Firewall rule already exists!');
      } catch (error) {
        // Rule doesn't exist, create it
        execSync(`netsh advfirewall firewall add rule name="${ruleName}" dir=in action=allow protocol=TCP localport=5173`, { stdio: 'inherit' });
        logSuccess('Firewall rule created successfully!');
      }
    } catch (error) {
      logWarning('Could not create firewall rule automatically.');
      logInfo('Please use one of the manual methods above.');
    }
  } catch (error) {
    logWarning('Not running as Administrator.');
    logInfo('Please run this script as Administrator or use manual methods.');
  }
  
  log('');
  process.exit(0);
}

// Run
try {
  fixFirewall();
} catch (error) {
  logError(`Error: ${error.message}`);
  process.exit(1);
}

