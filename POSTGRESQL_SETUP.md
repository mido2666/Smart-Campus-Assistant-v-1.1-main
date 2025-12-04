# PostgreSQL Database Integration - Complete Setup

## Overview

This document describes the complete PostgreSQL database integration for the Smart Campus Assistant application, including database setup, Prisma configuration, registration API, and frontend integration.

## Database Setup

### 1. Prisma Schema Update

The `prisma/schema.prisma` file has been updated to include a `name` field in the User model:

```prisma
model User {
  id                   Int                   @id @default(autoincrement())
  universityId         String                @unique
  email                String                @unique
  password             String
  name                 String?               // Full name (for registration API)
  firstName            String
  lastName             String
  role                 UserRole              @default(STUDENT)
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  // ... relations
}
```

### 2. Environment Configuration

Create a `.env` file in the project root with:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/smart_campus?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
BCRYPT_SALT_ROUNDS=12
```

Or use the `.env.example` file as a template.

### 3. Database Migration

Run the following commands to set up the database:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Or create and run migrations
npm run db:migrate
```

## Backend API

### Registration Endpoint

**Endpoint**: `POST /api/register`

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response** (Success - 201):

```json
{
  "success": true,
  "message": "Account created successfully! You can now login.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "universityId": "12345678",
      "role": "STUDENT",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**Response** (Error - 400/409/500):

```json
{
  "success": false,
  "message": "Error message here"
}
```

### Login Endpoint (Updated)

**Endpoint**: `POST /api/auth/login`

The login endpoint now uses PostgreSQL to authenticate users:

- Finds user by `universityId` or `email`
- Verifies password using bcrypt
- Returns user data (excluding password)

## Frontend Integration

### Registration Form

The registration form is integrated into the Login page (`src/pages/Login.tsx`):

1. **Create Account Button**: Click "Create Account" button on the login page
2. **Registration Form**: Fill in:
   - Full Name (required, min 2 characters)
   - Email (required, valid email format)
   - Password (required, min 6 characters)
   - Confirm Password (must match password)
3. **Success**: After successful registration, a success message is shown and the form closes after 2 seconds

### Validation

- **Name**: Required, minimum 2 characters
- **Email**: Required, valid email format, unique
- **Password**: Required, minimum 6 characters
- **Confirm Password**: Required, must match password

### Error Handling

- **400 Bad Request**: Missing fields or validation errors
- **409 Conflict**: Email already exists
- **500 Internal Server Error**: Server-side errors

All errors are displayed to the user in a user-friendly format.

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt before storing in the database
2. **Email Uniqueness**: Database constraint ensures unique email addresses
3. **University ID Generation**: Automatically generates unique 8-digit university IDs
4. **Input Validation**: Both frontend and backend validation
5. **Error Messages**: User-friendly error messages without exposing sensitive information

## Database Connection

The Prisma client is configured in `config/database.ts`:

```typescript
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

export default prisma;
```

## Testing

### 1. Test Database Connection

```bash
# Start PostgreSQL server
# Then run:
npm run db:studio
# This opens Prisma Studio to view the database
```

### 2. Test Registration API

```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "12345678",
    "password": "password123"
  }'
```

### 4. Test in Frontend

1. Start the backend server: `node server/simple-auth-server.js`
2. Start the frontend: `npm run dev`
3. Navigate to the login page
4. Click "Create Account"
5. Fill in the registration form
6. Submit and verify the account is created

## File Changes Summary

### Backend

- ✅ `prisma/schema.prisma` - Added `name` field to User model
- ✅ `server/simple-auth-server.js` - Added `/api/register` endpoint with Prisma and bcrypt
- ✅ `server/simple-auth-server.js` - Updated `/api/auth/login` to use Prisma
- ✅ `.env.example` - Added database configuration template

### Frontend

- ✅ `src/pages/Login.tsx` - Added registration form component
- ✅ `src/pages/Login.tsx` - Added "Create Account" button and state management

## Next Steps

1. **Configure Database**: Set up PostgreSQL and update `.env` with your connection string
2. **Run Migrations**: Execute `npm run db:push` or `npm run db:migrate`
3. **Test Registration**: Create a test account through the frontend
4. **Verify in Database**: Use Prisma Studio (`npm run db:studio`) to view created users

## Notes

- **No Auto-Users**: The system does not create any default users automatically
- **Manual Management**: All users must be created through the registration form
- **University ID**: Automatically generated as an 8-digit number
- **Default Role**: New users are assigned the `STUDENT` role by default

## Troubleshooting

### Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:

1. Ensure PostgreSQL is running
2. Check `.env` file has correct `DATABASE_URL`
3. Verify PostgreSQL credentials

### Migration Failed

**Error**: `Migration failed`

**Solution**:

1. Check database connection
2. Ensure schema is correct
3. Try `npm run db:push` instead of `npm run db:migrate`

### Email Already Exists

**Error**: `Email already registered`

**Solution**: Use a different email address or login with existing credentials
