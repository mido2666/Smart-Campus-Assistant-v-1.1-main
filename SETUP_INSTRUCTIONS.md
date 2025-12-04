# Complete Docker PostgreSQL Setup - Ready to Use! 🚀

## ✅ What's Been Configured

### 1. Docker Compose ✅
- **File:** `docker-compose.yml`
- **Container:** `smartcampus-db`
- **Image:** `postgres:15`
- **Port:** `5432:5432`
- **Volume:** Data persistence configured

### 2. Environment Configuration
- **File:** `.env` (needs manual update)
- **DATABASE_URL:** Should be `postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public`

### 3. NPM Scripts ✅
- **File:** `package.json`
- Added: `db:start`, `db:stop`, `db:migrate`

### 4. Prisma Schema ✅
- **File:** `prisma/schema.prisma`
- Already configured with all necessary models

## 🚀 Quick Start

### Step 1: Update .env File

Open `.env` and ensure it has:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
BCRYPT_SALT_ROUNDS=12
```

**Note:** Password is `postgres` (not `postgres123`)

### Step 2: Start PostgreSQL

```bash
npm run db:start
```

Or:

```bash
docker-compose up -d
```

### Step 3: Wait for PostgreSQL to be Ready

Wait 10-15 seconds for PostgreSQL to fully initialize.

### Step 4: Generate Prisma Client

```bash
npm run db:generate
```

**Note:** If you get permission errors, close your IDE and run from a new PowerShell terminal.

### Step 5: Create Database Tables

**Option A - Migrations (Recommended for production):**

```bash
npm run db:migrate
```

This will:
1. Create a migration file
2. Apply it to the database
3. Create all tables

**Option B - Quick Push (For prototyping):**

```bash
npm run db:push
```

This directly syncs schema without creating migration files.

### Step 6: Verify Setup

```bash
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555` where you can:
- ✅ See all tables
- ✅ View/edit data
- ✅ Verify everything is working

## 📋 Complete Setup Sequence

```bash
# 1. Start PostgreSQL
npm run db:start

# 2. Wait 10-15 seconds

# 3. Generate Prisma Client
npm run db:generate

# 4. Create tables
npm run db:migrate

# 5. Verify (optional)
npm run db:studio
```

## 🎯 Usage Commands

### Database Management:

```bash
# Start PostgreSQL
npm run db:start

# Stop PostgreSQL
npm run db:stop

# View status
docker-compose ps

# View logs
docker-compose logs -f postgres
```

### Prisma Commands:

```bash
# Generate client
npm run db:generate

# Create and apply migration
npm run db:migrate

# Quick push (no migration files)
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio

# Reset database (⚠️ deletes all data)
npm run db:reset
```

## ✅ Verification Checklist

- [ ] Docker Compose file exists (`docker-compose.yml`)
- [ ] PostgreSQL container running (`npm run db:start`)
- [ ] `.env` file has correct `DATABASE_URL`
- [ ] Prisma Client generated (`npm run db:generate`)
- [ ] Tables created (`npm run db:migrate`)
- [ ] Can view tables in Prisma Studio (`npm run db:studio`)

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs postgres

# Restart
docker-compose restart
```

### Prisma Permission Error

Close your IDE and run commands from a new PowerShell terminal.

### Port 5432 Already in Use

```bash
# Stop old container
docker stop smart-campus-postgres
docker rm smart-campus-postgres

# Then start with docker-compose
npm run db:start
```

### Database Connection Failed

1. Verify container is running: `docker-compose ps`
2. Check `.env` has correct `DATABASE_URL`
3. Wait a few more seconds (PostgreSQL needs time to initialize)

### Can't Connect After Migration

```bash
# Verify DATABASE_URL
cat .env | grep DATABASE_URL

# Should be: postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public

# Restart container
npm run db:stop
npm run db:start
```

## 📊 Database Details

- **Host:** localhost
- **Port:** 5432
- **Database:** smart_campus
- **Username:** postgres
- **Password:** postgres
- **Connection String:** `postgresql://postgres:postgres@localhost:5432/smart_campus`

## 🎉 You're Ready!

After completing all steps, you can:

1. ✅ Start backend: `node server/simple-auth-server.js`
2. ✅ Start frontend: `npm run dev`
3. ✅ Create accounts through the registration form
4. ✅ Use the database for all app features

## 📝 Important Notes

- ✅ Data persists in Docker volume (`postgres_data`)
- ✅ Container auto-restarts if Docker restarts
- ✅ All existing Prisma models are preserved
- ✅ No seed data - database starts empty and clean
- ✅ Ready for production use after JWT_SECRET change

## 🔄 Reset Everything

If you need to start completely fresh:

```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
npm run db:start
npm run db:migrate
```

---

**Everything is configured! Just follow the steps above and you're ready to go! 🚀**

