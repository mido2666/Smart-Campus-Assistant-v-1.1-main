# Docker PostgreSQL Setup - Complete ✅

## ✅ What's Been Set Up

### 1. Docker Compose Configuration

**File:** `docker-compose.yml`

- ✅ Container name: `smartcampus-db`
- ✅ Image: `postgres:15`
- ✅ Environment variables configured
- ✅ Port mapping: `5432:5432`
- ✅ Volume for data persistence
- ✅ Health check configured
- ✅ Auto-restart enabled

### 2. Environment Configuration

**File:** `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public"
```

### 3. Prisma Schema

**File:** `prisma/schema.prisma`

- ✅ Already configured with PostgreSQL provider
- ✅ All necessary models already defined:
  - User (with registration support)
  - Course
  - AttendanceRecord
  - Schedule
  - And many more...
- ✅ Schema is comprehensive and ready to use

### 4. NPM Scripts Added

**File:** `package.json`

New scripts added:

- `npm run db:start` - Start PostgreSQL with Docker Compose
- `npm run db:stop` - Stop PostgreSQL
- `npm run db:migrate` - Run Prisma migrations

## 🚀 Quick Start

### Single Command to Start Everything:

```bash
npm run db:start
```

This will:

1. ✅ Start PostgreSQL in Docker
2. ✅ Create the database `smart_campus`
3. ✅ Make it ready for Prisma migrations

### Complete Setup Flow:

```bash
# 1. Start PostgreSQL
npm run db:start

# 2. Wait a few seconds for PostgreSQL to be ready

# 3. Generate Prisma Client
npm run db:generate

# 4. Create all tables (migration)
npm run db:migrate

# OR use db:push for quick prototyping:
npm run db:push

# 5. Open Prisma Studio to view database
npm run db:studio
```

## 📋 Available Commands

### Database Management:

```bash
# Start PostgreSQL
npm run db:start
# or
docker-compose up -d

# Stop PostgreSQL
npm run db:stop
# or
docker-compose down

# View running containers
docker-compose ps

# View logs
docker-compose logs -f postgres
```

### Prisma Commands:

```bash
# Generate Prisma Client
npm run db:generate

# Create migration and apply it
npm run db:migrate

# Push schema changes (for prototyping)
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## 🔍 Verification

### 1. Check Docker Container:

```bash
docker-compose ps
```

Should show:

```
NAME              STATUS          PORTS
smartcampus-db    Up X seconds    0.0.0.0:5432->5432/tcp
```

### 2. Test Database Connection:

```bash
# Test connection with psql (if installed)
psql -h localhost -U postgres -d smart_campus

# Or use Prisma Studio
npm run db:studio
```

### 3. Verify Tables Created:

After running `npm run db:migrate` or `npm run db:push`, open Prisma Studio:

```bash
npm run db:studio
```

You should see all tables:

- users
- courses
- attendance_records
- schedules
- notifications
- chat_sessions
- And more...

## 📊 Database Information

- **Host:** localhost
- **Port:** 5432
- **Database:** smart_campus
- **Username:** postgres
- **Password:** postgres
- **Connection String:** `postgresql://postgres:postgres@localhost:5432/smart_campus`

## 🗄️ Data Persistence

Data is stored in a Docker volume named `postgres_data`. This means:

- ✅ Data persists even if you stop/restart the container
- ✅ Data persists even if you restart Docker
- ❌ Data is deleted only if you run `docker-compose down -v`

## 🔧 Troubleshooting

### Container won't start:

```bash
# Check logs
docker-compose logs postgres

# Restart
docker-compose restart
```

### Port 5432 already in use:

```bash
# Stop the old container
docker stop smart-campus-postgres
docker rm smart-campus-postgres

# Or change port in docker-compose.yml
```

### Prisma can't connect:

1. Verify container is running: `docker-compose ps`
2. Check DATABASE_URL in `.env`
3. Wait a few seconds after starting container (PostgreSQL needs time to initialize)

### Reset everything:

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Start fresh
npm run db:start
npm run db:migrate
```

## ✅ Next Steps

1. **Start PostgreSQL:**

   ```bash
   npm run db:start
   ```

2. **Create tables:**

   ```bash
   npm run db:migrate
   ```

3. **Verify:**

   ```bash
   npm run db:studio
   ```

4. **Start backend server:**

   ```bash
   node server/simple-auth-server.js
   ```

5. **Start frontend:**
   ```bash
   npm run dev
   ```

## 🎯 Summary

Everything is configured and ready! Just run:

```bash
npm run db:start
npm run db:migrate
```

And you're ready to use the database! 🚀
