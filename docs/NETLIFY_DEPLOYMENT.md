# Deployment Guide: Netlify + Fly.io + Supabase + Redis Labs

This guide will walk you through deploying the Smart Campus Assistant using the **C - الأقوى** architecture:
- **Frontend**: Netlify
- **Backend**: Fly.io
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis Labs

---

## 📋 Prerequisites

- Node.js 20+ installed
- Git installed
- Accounts on: Netlify, Fly.io, Supabase, Redis Labs (all have free tiers)

---

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** and sign up
3. Create a new project:
   - **Name**: `smart-campus-assistant`
   - **Database Password**: (generate a strong password and save it)
   - **Region**: Choose closest to your users
4. Wait for database to initialize (~2 minutes)

### 1.2 Get Connection Strings

1. Go to **Project Settings** → **Database**
2. Find **Connection String** section
3. Copy **Connection Pooling** string (for app):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
4. Copy **Direct Connection** string (for migrations):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 1.3 Run Database Migration

```bash
# Set environment variables temporarily
$env:DATABASE_URL="your-pooling-connection-string"
$env:DIRECT_URL="your-direct-connection-string"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Verify in Supabase dashboard
npx prisma studio
```

---

## 🔴 Step 2: Setup Redis Labs

### 2.1 Create Redis Instance

1. Go to [redis.com/try-free](https://redis.com/try-free/)
2. Sign up and create a new subscription (**Free**  tier)
3. Create a new database:
   - **Name**: `smart-campus-cache`
   - **Region**: Same as Supabase
   - **Memory**: 30MB (free tier)

### 2.2 Get Redis Connection

1. Go to your database
2. Copy **Public endpoint** (e.g., `redis-12345.c123.us-east-1-3.ec2.cloud.redislabs.com:12345`)
3. Copy **Default user password**
4. Format connection string:
   ```
   redis://default:[PASSWORD]@[HOST]:[PORT]
   ```

### 2.3 Test Connection

```bash
# Install redis-cli or use online tool
redis-cli -h your-host -p your-port -a your-password ping
# Should return: PONG
```

---

## 🚀 Step 3: Deploy Backend to Fly.io

### 3.1 Install Fly CLI

```powershell
# Install Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Restart terminal, then login
fly auth login
```

### 3.2 Configure Fly App

```bash
# In project root, launch Fly app
fly launch

# When prompted:
# - App name: smart-campus-assistant (or your choice)
# - Region: Choose closest to your users
# - Database: No (we're using Supabase)
# - Deploy now: No (we'll set secrets first)
```

### 3.3 Set Environment Secrets

```bash
# Set all required secrets
fly secrets set DATABASE_URL="your-supabase-pooling-url"
fly secrets set DIRECT_URL="your-supabase-direct-url"
fly secrets set REDIS_URL="your-redis-url"
fly secrets set REDIS_PASSWORD="your-redis-password"
fly secrets set REDIS_TLS="true"
fly secrets set JWT_SECRET="$(openssl rand -base64 64)"
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"
fly secrets set COOKIE_SECRET="$(openssl rand -base64 32)"
fly secrets set OPENAI_API_KEY="your-openai-key"
fly secrets set ALLOWED_ORIGINS="https://your-site.netlify.app"

# For Windows (generate secrets manually)
fly secrets set JWT_SECRET="your-generated-secret-at-least-64-chars"
fly secrets set SESSION_SECRET="your-generated-secret-at-least-32-chars"
fly secrets set COOKIE_SECRET="your-generated-secret-at-least-32-chars"
```

### 3.4 Deploy to Fly

```bash
# Deploy application
fly deploy

# Check deployment status
fly status

# View logs
fly logs

# Get your backend URL
fly info
# Your backend will be at: https://smart-campus-assistant.fly.dev
```

### 3.5 Test Backend

```bash
# Test health endpoint
curl https://your-app.fly.dev/health

# Should return: {"ok":true,"timestamp":"..."}
```

---

## 🌐 Step 4: Deploy Frontend to Netlify

### 4.1 Prepare Frontend Build

Update `.env.example` with your backend URL:
```bash
VITE_API_BASE_URL=https://your-app.fly.dev
VITE_WS_URL=wss://your-app.fly.dev
VITE_NODE_ENV=production
```

### 4.2 Deploy via Netlify CLI (Option 1)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Set environment variables
netlify env:set VITE_API_BASE_URL "https://your-app.fly.dev"
netlify env:set VITE_WS_URL "wss://your-app.fly.dev"
netlify env:set VITE_NODE_ENV "production"
netlify env:set VITE_ENABLE_ANALYTICS "true"
netlify env:set VITE_ENABLE_NOTIFICATIONS "true"
netlify env:set VITE_ENABLE_CHATBOT "true"

# Deploy
netlify deploy --prod
```

### 4.3 Deploy via Netlify Dashboard (Option 2 - Recommended)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `20`
5. Add environment variables:
   - `VITE_API_BASE_URL` = `https://your-app.fly.dev`
   - `VITE_WS_URL` = `wss://your-app.fly.dev`
   - `VITE_NODE_ENV` = `production`
   - `VITE_ENABLE_ANALYTICS` = `true`
   - `VITE_ENABLE_NOTIFICATIONS` = `true`
   - `VITE_ENABLE_CHATBOT` = `true`
6. Click **"Deploy"**

### 4.4 Update CORS on Backend

After deployment, update CORS on Fly.io:

```bash
# Get your Netlify URL (e.g., https://smart-campus-xyz.netlify.app)
# Update backend CORS
fly secrets set ALLOWED_ORIGINS="https://your-site.netlify.app,http://localhost:5173"

# Restart app
fly apps restart smart-campus-assistant
```

---

## ✅ Step 5: Verification

### 5.1 Test Database

1. Open Supabase dashboard
2. Go to **Table Editor**
3. Verify all tables exist

### 5.2 Test Backend

```bash
# Health check
curl https://your-app.fly.dev/health

# API endpoints
curl https://your-app.fly.dev/api/auth/ping
```

### 5.3 Test Frontend

1. Open your Netlify URL
2. Check console for errors
3. Test login functionality
4. Verify API calls work

### 5.4 Test Full Flow

1. Register new user
2. Login
3. Create a course (professor)
4. Enroll in course (student)
5. Test chatbot
6. Test notifications

---

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# If fails, check:
# 1. DATABASE_URL is correct
# 2. Supabase database is active
# 3. IP is not blocked
```

### Redis Connection Issues

```bash
# Check Redis is accessible
# In Fly.io logs, should see "Redis client connected"

# If not:
# 1. Verify REDIS_URL format
# 2. Check REDIS_TLS setting
# 3. Verify password is correct
```

### CORS Errors

```bash
# Update ALLOWED_ORIGINS on Fly.io
fly secrets set ALLOWED_ORIGINS="https://your-netlify.app,http://localhost:5173"

# Restart app
fly apps restart your-app-name
```

### Build Errors on Netlify

```bash
# Check Node version (should be 20)
# Add to netlify.toml:
[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"
```

---

## 📊 Monitoring

### Fly.io Logs

```bash
# View real-time logs
fly logs

# View specific app logs
fly logs -a smart-campus-assistant
```

### Netlify Logs

1. Go to Netlify dashboard
2. Click on your site
3. Go to **Deploys** → Click on deployment → **Deploy log**

### Supabase Monitoring

1. Supabase dashboard → **Database** → **Logs**
2. Monitor query performance

---

## 💰 Cost Estimation (Free Tier)

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| **Netlify** | 100GB/month bandwidth | $0 |
| **Fly.io** | 3 VMs (256MB each) | $0 |
| **Supabase** | 500MB database, 2GB transfer | $0 |
| **Redis Labs** | 30MB memory | $0 |
| **Total** | | **$0/month** |

---

## 🔄 Future Upgrades

When you need to scale:

1. **Fly.io**: Upgrade to larger VMs or add more regions
2. **Supabase**: Upgrade for more storage/connections
3. **Redis Labs**: Upgrade for more memory
4. **Netlify**: Bandwidth automatically scales (pay as you go)

---

## 📝 Environment Variables Reference

### Backend (Fly.io)
```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
REDIS_URL=redis://...
REDIS_PASSWORD=...
REDIS_TLS=true
JWT_SECRET=...
SESSION_SECRET=...
COOKIE_SECRET=...
OPENAI_API_KEY=...
ALLOWED_ORIGINS=https://your-site.netlify.app
NODE_ENV=production
PORT=3001
```

### Frontend (Netlify)
```bash
VITE_API_BASE_URL=https://your-app.fly.dev
VITE_WS_URL=wss://your-app.fly.dev
VITE_NODE_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_CHATBOT=true
```

---

## 🎉 Success!

Your application is now deployed on:
- **Frontend**: https://your-site.netlify.app
- **Backend**: https://your-app.fly.dev
- **Database**: Supabase
- **Cache**: Redis Labs

Enjoy your production-grade Smart Campus Assistant! 🚀
