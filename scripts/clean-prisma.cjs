#!/usr/bin/env node

/**
 * Clean Prisma Generated Files
 * Removes temporary files and generated Prisma client to fix permission issues
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

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

function cleanPrismaFiles() {
  log(`\n${colors.bold}${colors.blue}=== Cleaning Prisma Generated Files ===${colors.reset}\n`);
  
  const generatedPath = path.join(process.cwd(), 'src', 'generated', 'prisma');
  let cleanedCount = 0;
  
  if (!fs.existsSync(generatedPath)) {
    logInfo('No Prisma generated files found. Nothing to clean.');
    return true;
  }
  
  logInfo('Scanning for temporary files...');
  
  // Find and delete all .tmp files
  try {
    const files = fs.readdirSync(generatedPath);
    const tmpFiles = files.filter(file => file.includes('.tmp'));
    
    if (tmpFiles.length > 0) {
      logInfo(`Found ${tmpFiles.length} temporary file(s)...`);
      for (const file of tmpFiles) {
        const filePath = path.join(generatedPath, file);
        if (deleteFile(filePath)) {
          logSuccess(`Deleted: ${file}`);
          cleanedCount++;
        } else {
          logWarning(`Could not delete: ${file} (may be locked)`);
        }
      }
    }
  } catch (error) {
    logWarning(`Error scanning directory: ${error.message}`);
  }
  
  // Try to delete the main DLL file if it exists (will be regenerated)
  const dllFile = path.join(generatedPath, 'query_engine-windows.dll.node');
  if (fs.existsSync(dllFile)) {
    logInfo('Attempting to delete query engine DLL...');
    if (deleteFile(dllFile)) {
      logSuccess('Deleted query engine DLL');
      cleanedCount++;
    } else {
      logWarning('Could not delete query engine DLL (may be in use)');
      logInfo('Trying alternative approach...');
      
      // Try to rename it first (sometimes works when delete doesn't)
      try {
        const backupPath = dllFile + '.backup';
        if (fs.existsSync(backupPath)) {
          deleteFile(backupPath);
        }
        fs.renameSync(dllFile, backupPath);
        logSuccess('Renamed query engine DLL (will be cleaned on next run)');
      } catch (renameError) {
        logWarning('Could not rename DLL file');
      }
    }
  }
  
  if (cleanedCount > 0) {
    logSuccess(`\nCleaned ${cleanedCount} file(s)`);
  } else {
    logInfo('\nNo files needed cleaning');
  }
  
  return true;
}

function fullClean() {
  log(`\n${colors.bold}${colors.blue}=== Full Prisma Clean ===${colors.reset}\n`);
  
  const generatedPath = path.join(process.cwd(), 'src', 'generated', 'prisma');
  
  logWarning('This will delete the entire generated Prisma client directory!');
  logInfo('The client will be regenerated when you run: npm run db:generate\n');
  
  if (deleteDirectory(generatedPath)) {
    logSuccess('Deleted Prisma generated directory');
    return true;
  } else {
    logError('Could not delete Prisma generated directory');
    logWarning('It may be locked by another process.');
    logInfo('Please close any running Node.js processes, VS Code, or IDEs and try again.');
    return false;
  }
}

// Main execution
const args = process.argv.slice(2);
const fullCleanFlag = args.includes('--full') || args.includes('-f');

try {
  if (fullCleanFlag) {
    fullClean();
  } else {
    cleanPrismaFiles();
  }
  
  log('\n' + colors.bold + 'Next steps:' + colors.reset);
  log('  1. Make sure no Node.js processes are running');
  log('  2. Close VS Code or any IDEs if they have the project open');
  log('  3. Run: npm run db:generate');
  log('');
  
  process.exit(0);
} catch (error) {
  logError(`Error: ${error.message}`);
  process.exit(1);
}

