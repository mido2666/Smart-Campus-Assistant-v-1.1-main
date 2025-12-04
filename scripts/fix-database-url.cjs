#!/usr/bin/env node

/**
 * Fix Database URL
 * Updates DATABASE_URL in .env file to use the correct port (5433 for Docker)
 */

const fs = require('fs');
const path = require('path');
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

function checkDockerDatabase() {
  try {
    const output = execSync('docker ps --filter "name=smartcampus-db" --format "{{.Names}}"', { encoding: 'utf-8' }).trim();
    return output === 'smartcampus-db';
  } catch (error) {
    return false;
  }
}

function getDockerPort() {
  try {
    const output = execSync('docker ps --filter "name=smartcampus-db" --format "{{.Ports}}"', { encoding: 'utf-8' }).trim();
    // Extract port from output like "0.0.0.0:5433->5432/tcp"
    const match = output.match(/(\d+):5432/);
    if (match) {
      return parseInt(match[1]);
    }
  } catch (error) {
    // Ignore
  }
  return 5433; // Default Docker port mapping
}

function fixDatabaseUrl() {
  log(`\n${colors.bold}${colors.blue}=== Fix Database URL ===${colors.reset}\n`);
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('.env file not found!');
    logInfo('Please run: npm run env:create');
    process.exit(1);
  }
  
  // Check if Docker database is running
  const dockerRunning = checkDockerDatabase();
  let targetPort = 5432; // Default PostgreSQL port
  let dbUrl = '';
  
  if (dockerRunning) {
    targetPort = getDockerPort();
    logSuccess(`Docker database is running on port ${targetPort}`);
    dbUrl = `postgresql://postgres:postgres@localhost:${targetPort}/smart_campus?schema=public`;
  } else {
    logWarning('Docker database is not running');
    logInfo('Checking if local PostgreSQL is running...');
    
    // Try to connect to default PostgreSQL port
    try {
      // Simple check - if docker is not running, assume local PostgreSQL on 5432
      dbUrl = `postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public`;
      logInfo('Using local PostgreSQL configuration (port 5432)');
      logWarning('If this fails, start Docker database with: npm run db:start');
    } catch (error) {
      logError('Could not determine database configuration');
      process.exit(1);
    }
  }
  
  // Read .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  let updated = false;
  
  // Update DATABASE_URL
  const dbUrlRegex = /^DATABASE_URL=.*$/m;
  if (dbUrlRegex.test(envContent)) {
    const oldUrl = envContent.match(dbUrlRegex)[0];
    envContent = envContent.replace(dbUrlRegex, `DATABASE_URL="${dbUrl}"`);
    logSuccess(`Updated DATABASE_URL`);
    logInfo(`Old: ${oldUrl}`);
    logInfo(`New: DATABASE_URL="${dbUrl}"`);
    updated = true;
  } else {
    // Add DATABASE_URL if it doesn't exist
    envContent = `DATABASE_URL="${dbUrl}"\n\n` + envContent;
    logSuccess(`Added DATABASE_URL`);
    updated = true;
  }
  
  if (updated) {
    // Write back to .env file
    fs.writeFileSync(envPath, envContent, 'utf8');
    logSuccess('\n.env file updated successfully!');
    
    if (!dockerRunning) {
      log('\n' + colors.bold + 'Next steps:' + colors.reset);
      log('  1. Start Docker database: npm run db:start');
      log('  2. Wait a few seconds for database to be ready');
      log('  3. Run: npm run db:migrate');
    } else {
      log('\n' + colors.bold + 'Next steps:' + colors.reset);
      log('  1. Run: npm run db:migrate');
    }
  } else {
    logInfo('No changes needed');
  }
  
  log('');
  process.exit(0);
}

// Run the fix
try {
  fixDatabaseUrl();
} catch (error) {
  logError(`Error: ${error.message}`);
  process.exit(1);
}

