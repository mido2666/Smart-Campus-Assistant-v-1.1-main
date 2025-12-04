# Database Setup with Prisma ORM

This document explains the database setup for the Student Management System using Prisma ORM with PostgreSQL.

## 🗄️ Database Configuration

### Prisma Schema
The database schema is defined in `prisma/schema.prisma` with the following models:

- **User Model**: Contains user information with fields:
  - `id`: Auto-incrementing primary key
  - `universityId`: Unique university identifier
  - `email`: Unique email address
  - `password`: Hashed password (hash before storing)
  - `firstName`: User's first name
  - `lastName`: User's last name
  - `role`: User role (STUDENT, PROFESSOR, ADMIN)
  - `createdAt`: Timestamp when user was created
  - `updatedAt`: Timestamp when user was last updated

### User Roles
The system supports three user roles:
- `STUDENT`: Regular student users
- `PROFESSOR`: Professor/instructor users
- `ADMIN`: Administrative users

## 🚀 Getting Started

### 1. Environment Setup

Make sure your `.env` file contains the database connection string:

**For Local Development:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_campus_dev?schema=public"
```

**For Production:**
```env
DATABASE_URL="postgresql://username:password@host:5432/smart_campus_prod?schema=public"
```

### 2. PostgreSQL Setup with Docker

The easiest way to run PostgreSQL locally is using Docker:

```bash
# Start PostgreSQL 15 container
docker run --name smart-campus-postgres \
  -e POSTGRES_DB=smart_campus_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15-alpine

# Or use Docker Compose
docker-compose -f docker-compose.dev.yml up db -d
```

Wait 10-15 seconds for PostgreSQL to initialize, then proceed with database setup.

### 3. Database Commands
Use the following npm scripts to manage your database:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Create and apply migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### 4. Using the Database Client
Import the Prisma client in your application:

```typescript
import prisma from './config/database';

// Example: Create a user
const user = await prisma.user.create({
  data: {
    universityId: 'STU001',
    email: 'john.doe@university.edu',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: 'STUDENT'
  }
});
```

## 📁 File Structure

```
├── prisma/
│   └── schema.prisma          # Database schema definition
├── config/
│   ├── database.ts            # Prisma client configuration
│   └── database-example.ts    # Example usage functions
├── src/
│   └── generated/
│       └── prisma/            # Generated Prisma client (auto-generated)
└── .env                       # Environment variables
```

## 🔧 Configuration Details

### Prisma Client Setup
The database client is configured in `config/database.ts` with:
- Singleton pattern to prevent multiple instances
- Development logging for queries and errors
- Global variable storage for hot reloads in development

### Type Safety
The setup provides full TypeScript type safety:
- Auto-generated types from Prisma schema
- Exported types for use throughout the application
- IntelliSense support for all database operations

## 🔒 Security Notes

1. **Password Hashing**: Always hash passwords before storing them in the database
2. **Environment Variables**: Never commit `.env` files to version control
3. **Database Access**: Use connection pooling in production environments
4. **Input Validation**: Validate all user inputs before database operations

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in `.env` file
   - Verify database credentials

2. **Prisma Client Not Found**
   - Run `npm run db:generate` to generate the client
   - Check that the output path in schema.prisma is correct

3. **Schema Sync Issues**
   - Use `npm run db:push` for development
   - Use `npm run db:migrate` for production migrations

4. **PostgreSQL Connection Issues**
   - Ensure PostgreSQL container is running: `docker ps --filter "name=smart-campus-postgres"`
   - Check if database exists: `docker exec -it smart-campus-postgres psql -U postgres -l`
   - Verify DATABASE_URL in `.env` matches container configuration
   - Wait 10-15 seconds after starting container for initialization

5. **Authentication Errors**
   - Verify PostgreSQL credentials match `.env` file
   - Check if database was created: `docker exec -it smart-campus-postgres psql -U postgres -d smart_campus_dev`
   - Ensure DATABASE_URL format is correct: `postgresql://user:password@host:port/database?schema=public`

## 📚 Next Steps

1. Set up authentication middleware
2. Create API endpoints for user management
3. Implement password hashing (bcrypt)
4. Add database migrations for production
5. Set up connection pooling for scalability

## 🔗 Useful Links

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript with Prisma](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/using-prismaclient-with-typescript)
