#!/usr/bin/env node

/**
 * Environment File Checker
 * Checks if .env file exists and validates required environment variables
 */

const fs = require('fs');
const path = require('path');

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

// Required environment variables
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT'
];

// Recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'BCRYPT_SALT_ROUNDS',
  'ALLOWED_ORIGINS',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN'
];

// Optional environment variables
const OPTIONAL_ENV_VARS = [
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'OPENAI_BASE_URL',
  'SESSION_SECRET',
  'COOKIE_SECRET',
  'LOG_LEVEL',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS'
];

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  log(`\n${colors.bold}${colors.blue}=== Environment File Check ===${colors.reset}\n`);
  
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    logSuccess('.env file exists');
    
    // Load environment variables
    require('dotenv').config();
    
    logInfo('Checking environment variables...\n');
    
    let allRequired = true;
    let allRecommended = true;
    let missingRequired = [];
    let missingRecommended = [];
    
    // Check required variables
    log(`${colors.bold}Required Variables:${colors.reset}`);
    for (const varName of REQUIRED_ENV_VARS) {
      if (process.env[varName]) {
        // Hide sensitive values
        if (varName === 'JWT_SECRET' || varName === 'DATABASE_URL') {
          const value = process.env[varName];
          const masked = value.length > 20 
            ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
            : '***';
          logSuccess(`${varName} is set (${masked})`);
        } else {
          logSuccess(`${varName} is set (${process.env[varName]})`);
        }
      } else {
        logError(`${varName} is missing (REQUIRED)`);
        missingRequired.push(varName);
        allRequired = false;
      }
    }
    
    // Check recommended variables
    log(`\n${colors.bold}Recommended Variables:${colors.reset}`);
    for (const varName of RECOMMENDED_ENV_VARS) {
      if (process.env[varName]) {
        logSuccess(`${varName} is set (${process.env[varName]})`);
      } else {
        logWarning(`${varName} is not set (recommended)`);
        missingRecommended.push(varName);
        allRecommended = false;
      }
    }
    
    // Check optional variables
    log(`\n${colors.bold}Optional Variables:${colors.reset}`);
    let optionalCount = 0;
    for (const varName of OPTIONAL_ENV_VARS) {
      if (process.env[varName]) {
        optionalCount++;
        if (varName.includes('SECRET') || varName.includes('KEY')) {
          logSuccess(`${varName} is set (***)`);
        } else {
          logSuccess(`${varName} is set (${process.env[varName]})`);
        }
      }
    }
    if (optionalCount === 0) {
      logInfo('No optional variables are set');
    }
    
    // Summary
    log(`\n${colors.bold}${colors.blue}=== Summary ===${colors.reset}\n`);
    
    if (allRequired) {
      logSuccess('All required environment variables are set!');
    } else {
      logError(`Missing required variables: ${missingRequired.join(', ')}`);
      logWarning('Please set these variables in your .env file');
    }
    
    if (!allRecommended) {
      logWarning(`Missing recommended variables: ${missingRecommended.join(', ')}`);
      logInfo('Consider setting these for optimal configuration');
    }
    
    // Validate JWT_SECRET length if set
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      logWarning('JWT_SECRET should be at least 32 characters long for security');
    }
    
    // Validate PORT if set
    if (process.env.PORT) {
      const port = parseInt(process.env.PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        logError('PORT must be a number between 1 and 65535');
        allRequired = false;
      }
    }
    
    // Validate NODE_ENV if set
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
      logWarning('NODE_ENV should be: development, production, or test');
    }
    
    log('');
    process.exit(allRequired ? 0 : 1);
    
  } else {
    logError('.env file not found');
    logWarning('The .env file is required for the application to run');
    logInfo('You can create it by running: npm run env:create');
    logInfo('Or manually create a .env file in the project root');
    
    // Check if .env.example exists
    if (fs.existsSync(envExamplePath)) {
      logInfo('\nFound .env.example file. You can copy it as a template:');
      log(`  cp .env.example .env`);
      log('  or on Windows:');
      log(`  copy .env.example .env`);
    }
    
    log('');
    process.exit(1);
  }
}

// Run the check
try {
  checkEnvFile();
} catch (error) {
  logError(`Error checking environment: ${error.message}`);
  process.exit(1);
}

