#!/usr/bin/env node

/**
 * Environment File Creator
 * Creates a .env file with default configuration values
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

function generateRandomSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function createEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  log(`\n${colors.bold}${colors.blue}=== Create Environment File ===${colors.reset}\n`);
  
  // Check if .env file already exists
  if (fs.existsSync(envPath)) {
    logWarning('.env file already exists!');
    logInfo('To avoid overwriting your existing configuration,');
    logInfo('please rename or backup your current .env file first.');
    log('');
    log('Would you like to:');
    log('  1. Create .env.backup and create a new .env file');
    log('  2. Cancel (keep existing .env file)');
    log('');
    logError('Operation cancelled. Existing .env file preserved.');
    process.exit(1);
  }
  
  // Default configuration based on the guide and environment.ts
  const defaultEnv = `# ============================================
# Smart Campus Assistant - Environment Configuration
# ============================================
# This file contains environment variables for the application.
# DO NOT commit this file to version control!
# ============================================

# Database Configuration
# For PostgreSQL (recommended):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public"

# For SQLite (development only):
# DATABASE_URL="file:./prisma/dev.db"

# ============================================
# JWT Authentication Configuration
# ============================================
# IMPORTANT: Change JWT_SECRET in production!
# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="${generateRandomSecret(64)}"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ============================================
# Server Configuration
# ============================================
PORT=3001
NODE_ENV="development"

# ============================================
# Security Configuration
# ============================================
BCRYPT_SALT_ROUNDS=12

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:4173"

# Optional: Session and Cookie Secrets (auto-generated if not set)
# SESSION_SECRET="${generateRandomSecret(32)}"
# COOKIE_SECRET="${generateRandomSecret(32)}"

# ============================================
# Rate Limiting Configuration
# ============================================
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL="info"
# LOG_FILE="logs/app.log"

# ============================================
# OpenAI / AI Assistant Configuration
# ============================================
# Optional: OpenAI API Key for AI features
# Get your API key from: https://platform.openai.com/api-keys
# Or use OpenRouter: https://openrouter.ai/
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_MODEL="deepseek/deepseek-chat"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
OPENAI_MAX_TOKENS="1000"

# ============================================
# Frontend Configuration
# ============================================
# Optional: Frontend URL (used for CORS and redirects)
# VITE_API_BASE_URL="http://localhost:3001"

# ============================================
# Debug Flags (development only)
# ============================================
# Set to 'true' to enable debug logging
DEBUG_PRISMA="false"
PRISMA_LOG_QUERIES="false"
DEBUG_ROUTES="false"

# ============================================
# Notes:
# ============================================
# 1. Change JWT_SECRET in production to a strong, random value
# 2. Update DATABASE_URL with your actual database credentials
# 3. Set NODE_ENV to "production" when deploying
# 4. Update ALLOWED_ORIGINS with your actual frontend URLs
# 5. Add your OPENAI_API_KEY if you want to use AI features
# ============================================
`;

  try {
    // Create the .env file
    fs.writeFileSync(envPath, defaultEnv, 'utf8');
    
    logSuccess('.env file created successfully!');
    log('');
    logInfo('Default configuration has been set:');
    log('  • DATABASE_URL: PostgreSQL (localhost:5432)');
    log('  • PORT: 3001');
    log('  • NODE_ENV: development');
    log('  • JWT_SECRET: Auto-generated (secure random)');
    log('  • BCRYPT_SALT_ROUNDS: 12');
    log('');
    logWarning('⚠️  IMPORTANT: Please review and update the following:');
    log('  1. DATABASE_URL - Update with your database credentials');
    log('  2. JWT_SECRET - Already generated, but keep it secure!');
    log('  3. ALLOWED_ORIGINS - Update with your frontend URLs');
    log('  4. OPENAI_API_KEY - Add your API key if using AI features');
    log('');
    logInfo('Next steps:');
    log('  1. Review the .env file and update as needed');
    log('  2. Run: npm run env:check (to verify configuration)');
    log('  3. Run: npm run db:generate (to generate Prisma client)');
    log('  4. Run: npm run db:push (to create database schema)');
    log('');
    logSuccess('Environment file is ready! 🎉');
    log('');
    
    process.exit(0);
  } catch (error) {
    logError(`Failed to create .env file: ${error.message}`);
    process.exit(1);
  }
}

// Run the creator
try {
  createEnvFile();
} catch (error) {
  logError(`Error creating environment file: ${error.message}`);
  process.exit(1);
}

