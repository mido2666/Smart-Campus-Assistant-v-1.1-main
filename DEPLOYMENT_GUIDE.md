# Smart Campus Assistant - Deployment Guide

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready with Advanced Security  

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Security Configuration](#security-configuration)
4. [Local Development Setup](#local-development-setup)
5. [Production Deployment](#production-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment](#cloud-deployment)
8. [Database Setup](#database-setup)
9. [SSL/HTTPS Setup](#sslhttps-setup)
10. [Security Hardening](#security-hardening)
11. [Monitoring & Logging](#monitoring--logging)
12. [Troubleshooting](#troubleshooting)
13. [Maintenance](#maintenance)

---

## 🔧 Prerequisites

### System Requirements

#### Minimum Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Memory**: 2GB RAM minimum
- **Storage**: 5GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

#### Recommended Requirements
- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher
- **Memory**: 4GB RAM or higher
- **Storage**: 10GB free space
- **OS**: Latest stable version

#### Optional Requirements
- **Docker**: v20.0.0 or higher (for containerized deployment)
- **Docker Compose**: v2.0.0 or higher
- **PM2**: v5.0.0 or higher (for process management)
- **Nginx**: v1.18.0 or higher (for reverse proxy)

### Software Dependencies

#### Required Software
```bash
# Node.js and npm
node --version  # Should be v18+
npm --version   # Should be v8+

# Git (for version control)
git --version

# Database (SQLite is included, but PostgreSQL recommended for production)
sqlite3 --version
```

#### Optional Software
```bash
# Docker (for containerized deployment)
docker --version
docker-compose --version

# PM2 (for process management)
npm install -g pm2

# Nginx (for reverse proxy)
nginx -v
```

---

## 🌍 Environment Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/smart-campus-assistant.git
cd smart-campus-assistant

# Checkout the latest stable version
git checkout main
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Variables

Create environment files for different environments:

#### Development Environment (`.env`)
```env
# Database Configuration
DATABASE_URL="file:./prisma/dev.db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-for-development"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# CORS Configuration
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:4173"

# Security (Optional)
SESSION_SECRET="your-session-secret-key"
COOKIE_SECRET="your-cookie-secret-key"

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Logging (Optional)
LOG_LEVEL="debug"
LOG_FILE="logs/app.log"

# OpenAI Integration (Optional)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="deepseek/deepseek-chat"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
OPENAI_MAX_TOKENS="1000"
```

#### Production Environment (`.env.production`)
```env
# Database Configuration
DATABASE_URL="file:./prisma/prod.db"

# JWT Configuration (USE STRONG SECRETS IN PRODUCTION)
JWT_SECRET="your-very-strong-production-jwt-secret-key-min-64-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="production"

# CORS Configuration (Update with your domain)
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Security (Required for production)
SESSION_SECRET="your-very-strong-session-secret"
COOKIE_SECRET="your-very-strong-cookie-secret"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Logging
LOG_LEVEL="info"
LOG_FILE="/var/log/smart-campus/app.log"

# OpenAI Integration
OPENAI_API_KEY="your-production-openai-api-key"
OPENAI_MODEL="deepseek/deepseek-chat"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
OPENAI_MAX_TOKENS="1000"

# Security Features
SECURITY_ENABLED="true"
FRAUD_DETECTION_ENABLED="true"
LOCATION_VERIFICATION_ENABLED="true"
DEVICE_FINGERPRINTING_ENABLED="true"
PHOTO_VERIFICATION_ENABLED="true"

# Security Thresholds
FRAUD_RISK_THRESHOLD="0.7"
LOCATION_ACCURACY_THRESHOLD="10"
DEVICE_CHANGE_THRESHOLD="0.8"
PHOTO_QUALITY_THRESHOLD="0.6"

# Notification Settings
EMAIL_NOTIFICATIONS_ENABLED="true"
PUSH_NOTIFICATIONS_ENABLED="true"
REAL_TIME_NOTIFICATIONS_ENABLED="true"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Smart Campus Assistant <noreply@yourdomain.com>"

# Push Notification Configuration
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:admin@yourdomain.com"

# File Upload Configuration
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/webp"
UPLOAD_DIR="/app/uploads"

# Security Headers
HELMET_ENABLED="true"
CSP_ENABLED="true"
HSTS_ENABLED="true"
XSS_PROTECTION_ENABLED="true"

### 4. Environment Validation

```bash
# Validate environment configuration
npm run check:prod
```

---

## 🔒 Security Configuration

### 1. Security Features Setup

#### Enable Security Services
```bash
# Install security dependencies
npm install sharp canvas webgl2-utils crypto-js

# Install notification dependencies
npm install nodemailer web-push socket.io

# Install security middleware
npm install helmet express-rate-limit express-validator
```

#### Security Service Configuration
```typescript
// src/services/security/config.ts
export const securityConfig = {
  location: {
    enabled: process.env.LOCATION_VERIFICATION_ENABLED === 'true',
    accuracyThreshold: parseFloat(process.env.LOCATION_ACCURACY_THRESHOLD || '10'),
    maxDistance: 100, // meters
    timeWindow: 300000, // 5 minutes
  },
  device: {
    enabled: process.env.DEVICE_FINGERPRINTING_ENABLED === 'true',
    changeThreshold: parseFloat(process.env.DEVICE_CHANGE_THRESHOLD || '0.8'),
    maxDevices: 3,
    trackingEnabled: true,
  },
  fraud: {
    enabled: process.env.FRAUD_DETECTION_ENABLED === 'true',
    riskThreshold: parseFloat(process.env.FRAUD_RISK_THRESHOLD || '0.7'),
    mlModelPath: './models/fraud-detection.model',
    trainingDataPath: './data/training-data.json',
  },
  photo: {
    enabled: process.env.PHOTO_VERIFICATION_ENABLED === 'true',
    qualityThreshold: parseFloat(process.env.PHOTO_QUALITY_THRESHOLD || '0.6'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  },
  notifications: {
    email: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    push: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    realTime: process.env.REAL_TIME_NOTIFICATIONS_ENABLED === 'true',
  },
};
```

### 2. Security Middleware Setup

#### Rate Limiting Configuration
```typescript
// src/middleware/security.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// General rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many sensitive requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

### 3. Database Security

#### Database Encryption
```bash
# Enable database encryption (SQLite)
# For production, consider using PostgreSQL with encryption
export DATABASE_ENCRYPTION_KEY="your-32-character-encryption-key"

# Update Prisma schema for encryption
# Add encryption to sensitive fields
```

#### Database Access Control
```typescript
// src/middleware/database.ts
import { PrismaClient } from '@prisma/client';

export const createSecurePrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add query logging for security
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'info', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });
};
```

### 4. Authentication Security

#### JWT Security Configuration
```typescript
// src/middleware/auth.ts
export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  },
  session: {
    secret: process.env.SESSION_SECRET,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'strict',
    },
  },
};
```

### 5. File Upload Security

#### Secure File Upload Configuration
```typescript
// src/middleware/upload.ts
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';

export const uploadConfig = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, process.env.UPLOAD_DIR || './uploads');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
};
```

---

## 🚀 Local Development Setup

### 1. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed

# Open Prisma Studio (optional)
npm run db:studio
```

### 2. Start Development Servers

#### Option A: Start Both Servers Separately

```bash
# Terminal 1: Start Backend Server
npm run server:dev

# Terminal 2: Start Frontend Development Server
npm run dev
```

#### Option B: Use Docker Compose (Recommended)

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Verify Installation

```bash
# Run health check
curl http://localhost:3001/health

# Run smoke tests
npm run test:smoke

# Run all tests
npm test
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Database Studio**: http://localhost:5555 (Prisma Studio)

---

## 🏭 Production Deployment

### 1. Build the Application

```bash
# Install production dependencies
npm ci --only=production

# Build the frontend
npm run build

# Verify build
npm run typecheck
```

### 2. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed production data (optional)
npm run db:seed
```

### 3. Process Management with PM2

#### Install PM2
```bash
npm install -g pm2
```

#### Create PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'smart-campus-api',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    },
    {
      name: 'smart-campus-frontend',
      script: 'serve',
      args: '-s dist -l 3000',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

#### Start with PM2
```bash
# Start all processes
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart processes
pm2 restart all

# Stop processes
pm2 stop all
```

### 4. Nginx Configuration

#### Install Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Nginx Configuration (`/etc/nginx/sites-available/smart-campus`)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend (React App)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /uploads {
        alias /path/to/your/app/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

#### Enable the Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/smart-campus /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🐳 Docker Deployment

### 1. Docker Configuration

#### Dockerfile (`Dockerfile`)
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install serve for static files
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["npm", "run", "start:prod"]
```

#### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prisma/prod.db
      - JWT_SECRET=your-production-jwt-secret
      - PORT=3001
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 2. Build and Deploy

```bash
# Build the Docker image
docker build -t smart-campus-assistant .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Scale the application
docker-compose up -d --scale app=3

# Stop services
docker-compose down
```

---

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup
```bash
# Launch EC2 instance (Ubuntu 20.04 LTS)
# Instance type: t3.medium or larger
# Security groups: Allow ports 22, 80, 443, 3000, 3001

# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-username/smart-campus-assistant.git
cd smart-campus-assistant

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Google Cloud Platform (GCP)

#### 1. App Engine Deployment
```yaml
# app.yaml
runtime: nodejs20
service: smart-campus

env_variables:
  NODE_ENV: production
  DATABASE_URL: "file:./prisma/prod.db"
  JWT_SECRET: "your-production-jwt-secret"
  PORT: 8080

handlers:
  - url: /api/.*
    script: auto
  - url: /.*
    static_files: dist/index.html
    upload: dist/index.html
```

#### 2. Deploy to App Engine
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash

# Initialize project
gcloud init

# Deploy to App Engine
gcloud app deploy
```

### Azure Deployment

#### 1. Azure App Service
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Create resource group
az group create --name smart-campus-rg --location eastus

# Create App Service plan
az appservice plan create --name smart-campus-plan --resource-group smart-campus-rg --sku B1

# Create web app
az webapp create --resource-group smart-campus-rg --plan smart-campus-plan --name smart-campus-app --runtime "NODE|20-lts"
```

---

## 🗄️ Database Setup

### SQLite (Default)

#### Development Database
```bash
# Database is automatically created
# Location: ./prisma/dev.db
# No additional setup required
```

#### Production Database
```bash
# Create production database
cp prisma/dev.db prisma/prod.db

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

### PostgreSQL (Recommended for Production)

#### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
```

#### 2. Configure Database
```bash
# Create database user
sudo -u postgres createuser --interactive

# Create database
sudo -u postgres createdb smart_campus

# Update environment variables
DATABASE_URL="postgresql://username:password@localhost:5432/smart_campus"
```

#### 3. Update Prisma Schema
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 4. Run Migrations
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

---

## 🔒 SSL/HTTPS Setup

### Let's Encrypt (Free SSL)

#### 1. Install Certbot
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### 2. Obtain SSL Certificate
```bash
# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
sudo certbot renew --dry-run

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Self-Signed Certificate (Development)

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate
openssl req -new -x509 -key private.key -out certificate.crt -days 365

# Update Nginx configuration
ssl_certificate /path/to/certificate.crt;
ssl_certificate_key /path/to/private.key;
```

---

## 🛡️ Security Hardening

### 1. Server Security

#### Firewall Configuration
```bash
# Ubuntu/Debian - UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# CentOS/RHEL - firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

#### System Hardening
```bash
# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable cups
sudo systemctl disable avahi-daemon

# Set secure file permissions
sudo chmod 600 /etc/ssh/sshd_config
sudo chmod 644 /etc/ssh/ssh_host_*

# Configure fail2ban for intrusion prevention
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### Fail2ban Configuration
```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3
```

### 2. Application Security

#### Security Headers Configuration
```typescript
// src/middleware/security-headers.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});
```

#### Input Validation and Sanitization
```typescript
// src/middleware/validation.ts
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Common validation rules
export const commonValidations = {
  id: param('id').isUUID().withMessage('Invalid ID format'),
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  coordinates: body('coordinates').isObject().withMessage('Coordinates must be an object'),
  deviceInfo: body('deviceInfo').isObject().withMessage('Device info must be an object'),
};
```

### 3. Database Security

#### Database Access Control
```sql
-- Create restricted database user
CREATE USER 'smart_campus_app'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON smart_campus.* TO 'smart_campus_app'@'localhost';
FLUSH PRIVILEGES;

-- Revoke unnecessary privileges
REVOKE ALL PRIVILEGES ON *.* FROM 'smart_campus_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON smart_campus.* TO 'smart_campus_app'@'localhost';
```

#### Database Encryption
```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('smart-campus', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('smart-campus', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 4. Network Security

#### SSL/TLS Configuration
```nginx
# /etc/nginx/sites-available/smart-campus
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3001;
    }
}
```

### 5. Monitoring and Alerting

#### Security Monitoring Setup
```typescript
// src/middleware/security-monitoring.ts
import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger';

export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log security events
    if (req.path.includes('/api/attendance/scan')) {
      Logger.info('Attendance scan attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        duration,
      });
    }
    
    if (req.path.includes('/api/auth/')) {
      Logger.info('Authentication attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        duration,
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
```

#### Security Alerts Configuration
```typescript
// src/services/security-alerts.ts
export class SecurityAlertService {
  async sendFraudAlert(alertData: any) {
    // Send real-time fraud alert
    await this.sendRealTimeAlert('fraud_detected', alertData);
    
    // Send email notification
    await this.sendEmailAlert('fraud_alert', alertData);
    
    // Log security event
    Logger.warn('Fraud detected', alertData);
  }
  
  async sendSuspiciousActivityAlert(activityData: any) {
    // Send real-time alert
    await this.sendRealTimeAlert('suspicious_activity', activityData);
    
    // Log security event
    Logger.warn('Suspicious activity detected', activityData);
  }
}
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring

#### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# View specific process logs
pm2 logs smart-campus-api

# Restart processes
pm2 restart all
```

#### Health Checks
```bash
# API health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:3000

# Database health check
npm run db:studio
```

### 2. Log Management

#### Log Rotation
```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/smart-campus
```

```bash
# /etc/logrotate.d/smart-campus
/var/log/smart-campus/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Performance Monitoring

#### Install Monitoring Tools
```bash
# Install htop for system monitoring
sudo apt install htop

# Install iotop for I/O monitoring
sudo apt install iotop

# Install nethogs for network monitoring
sudo apt install nethogs
```

#### Application Performance
```bash
# Monitor Node.js performance
pm2 monit

# View detailed process information
pm2 show smart-campus-api

# Monitor memory usage
pm2 logs --lines 1000 | grep "memory"
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Or use PM2
pm2 delete smart-campus-api
pm2 start ecosystem.config.js
```

#### 2. Database Connection Issues
```bash
# Check database file permissions
ls -la prisma/

# Fix permissions
chmod 644 prisma/dev.db
chown www-data:www-data prisma/dev.db

# Regenerate Prisma client
npm run db:generate
```

#### 3. Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite
npm run build
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h
pm2 monit

# Restart processes
pm2 restart all

# Increase Node.js memory limit
pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"
```

### Debug Mode

#### Enable Debug Logging
```bash
# Set debug environment variable
export DEBUG=*
export LOG_LEVEL=debug

# Start application
npm run server:dev
```

#### View Detailed Logs
```bash
# PM2 logs with timestamps
pm2 logs --timestamp

# Follow logs in real-time
pm2 logs --follow

# View error logs only
pm2 logs --err
```

---

## 🔄 Maintenance

### Regular Maintenance Tasks

#### Daily Tasks
```bash
# Check application status
pm2 status

# Check disk space
df -h

# Check memory usage
free -h

# Check logs for errors
pm2 logs --err --lines 100
```

#### Weekly Tasks
```bash
# Update dependencies
npm audit
npm update

# Backup database
cp prisma/prod.db backups/prod-$(date +%Y%m%d).db

# Clean old logs
pm2 flush

# Check SSL certificate expiry
certbot certificates
```

#### Monthly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Review and rotate logs
sudo logrotate -f /etc/logrotate.d/smart-campus

# Performance analysis
npm run analyze:bundle

# Security audit
npm audit
```

### Backup Strategy

#### Database Backup
```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/smart-campus"
mkdir -p $BACKUP_DIR

# Backup SQLite database
cp prisma/prod.db $BACKUP_DIR/prod_$DATE.db

# Compress backup
gzip $BACKUP_DIR/prod_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "*.db.gz" -mtime +30 -delete

echo "Backup completed: prod_$DATE.db.gz"
EOF

chmod +x backup-db.sh

# Schedule daily backup
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

#### Application Backup
```bash
# Create application backup script
cat > backup-app.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/smart-campus"
APP_DIR="/path/to/smart-campus-assistant"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    .

echo "Application backup completed: app_$DATE.tar.gz"
EOF

chmod +x backup-app.sh
```

### Update Procedure

#### 1. Prepare for Update
```bash
# Create backup
./backup-db.sh
./backup-app.sh

# Check current version
git log --oneline -1
```

#### 2. Update Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm ci

# Run database migrations
npm run db:migrate

# Build application
npm run build

# Restart services
pm2 restart all
```

#### 3. Verify Update
```bash
# Check application status
pm2 status

# Test health endpoints
curl http://localhost:3001/health

# Run smoke tests
npm run test:smoke
```

---

## 📞 Support

### Getting Help

#### Documentation
- **User Manual**: See `USER_MANUAL.md`
- **Developer Guide**: See `DEVELOPER_GUIDE.md`
- **API Documentation**: Available at `/api-docs` endpoint

#### Troubleshooting Resources
- **Logs**: Check PM2 logs and application logs
- **Health Checks**: Use `/health` endpoint
- **Database**: Use Prisma Studio for database inspection

#### Contact Information
- **Technical Support**: Available for critical issues
- **Documentation Issues**: Report via GitHub issues
- **Feature Requests**: Submit via GitHub discussions

---

## 🎯 Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start frontend dev server
npm run server:dev       # Start backend dev server
npm run build            # Build for production
npm test                 # Run tests

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Production
pm2 start ecosystem.config.js  # Start with PM2
pm2 restart all                # Restart all processes
pm2 logs                       # View logs
pm2 monit                      # Monitor processes

# Docker
docker-compose up -d      # Start with Docker
docker-compose down       # Stop Docker services
docker-compose logs -f    # View Docker logs

# Maintenance
npm run check:prod        # Check production readiness
npm run test:smoke        # Run smoke tests
npm run analyze:bundle    # Analyze bundle size
```

### Important Files

- **Environment**: `.env`, `.env.production`
- **Database**: `prisma/schema.prisma`, `prisma/dev.db`
- **Configuration**: `ecosystem.config.js`, `docker-compose.yml`
- **Nginx**: `/etc/nginx/sites-available/smart-campus`
- **Logs**: `/var/log/smart-campus/`, `./logs/`

---

**Deployment Guide Version**: 2.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready with Advanced Security
