# 🔐 Authentication System Documentation

## Overview

This document describes the comprehensive JWT-based authentication system implemented for the Smart Campus Assistant. The system provides secure user authentication, authorization, and session management.

## 🏗️ Architecture

The authentication system follows a layered architecture:

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   API Routes    │
│   (/api/auth)   │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Controllers   │
│   (auth.controller) │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Services      │
│   (auth.service) │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Utilities     │
│   (JWT, Crypto) │
└─────────────────┘
```

## 📁 File Structure

```
src/
├── controllers/
│   └── auth.controller.ts      # HTTP request handlers
├── services/
│   └── auth.service.ts         # Business logic
├── middleware/
│   └── auth.middleware.ts      # Route protection
├── routes/
│   └── auth.routes.ts          # API endpoints
├── utils/
│   ├── jwt.ts                  # JWT utilities
│   └── encryption.ts           # Password hashing
└── config/
    └── environment.ts          # Environment configuration

server/
└── index.ts                    # Main server with auth routes
```

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env` file in the project root:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=12

# Server Configuration
NODE_ENV=development
PORT=3001

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4173
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
# Development mode with TypeScript
npm run server:dev

# Or production mode
npm run server:ts
```

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/verify` | Verify token validity |
| `GET` | `/api/auth/health` | Health check |

### Protected Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/logout` | Logout user | ✅ |
| `GET` | `/api/auth/me` | Get current user | ✅ |
| `PUT` | `/api/auth/profile` | Update profile | ✅ |
| `POST` | `/api/auth/change-password` | Change password | ✅ |

### Role-based Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| `GET` | `/api/auth/admin/users` | List all users | Admin |
| `GET` | `/api/auth/professor/dashboard` | Professor dashboard | Professor/Admin |
| `GET` | `/api/auth/student/dashboard` | Student dashboard | Student |

## 📝 API Usage Examples

### 1. User Registration

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securePassword123",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_1234567890_abc123",
      "email": "student@university.edu",
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### 2. User Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@university.edu",
    "password": "securePassword123"
  }'
```

### 3. Access Protected Route

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🔒 Security Features

### 1. Password Security
- **Bcrypt Hashing**: Passwords are hashed using bcrypt with configurable salt rounds
- **Minimum Length**: Passwords must be at least 6 characters
- **Strength Validation**: Password strength checking endpoint

### 2. JWT Security
- **Short-lived Access Tokens**: 15 minutes default
- **Long-lived Refresh Tokens**: 7 days default
- **Token Versioning**: Tokens are invalidated on password change
- **Secure Headers**: Proper JWT headers and audience validation

### 3. Rate Limiting
- **Login Attempts**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per 15 minutes
- **General API**: Configurable rate limiting

### 4. CORS Protection
- **Configurable Origins**: Only allowed origins can access the API
- **Credentials Support**: Secure cookie handling
- **Preflight Handling**: Proper OPTIONS request handling

## 🛡️ Middleware

### Authentication Middleware

```typescript
// Require authentication
app.use('/protected', AuthMiddleware.authenticate());

// Require specific role
app.use('/admin', AuthMiddleware.authenticate(), AuthMiddleware.requireAdmin());

// Optional authentication
app.use('/optional', AuthMiddleware.optionalAuth());
```

### Available Middleware Functions

- `authenticate()` - Verify JWT token
- `requireRole(roles)` - Check user roles
- `requireAdmin()` - Admin only access
- `requireProfessorOrAdmin()` - Professor or Admin access
- `optionalAuth()` - Optional authentication
- `rateLimit(max, window)` - Rate limiting
- `corsOptions()` - CORS configuration

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Access token expiration | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | `12` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `ALLOWED_ORIGINS` | CORS origins | `localhost:3000,5173,4173` |

### JWT Configuration

```typescript
// Access token payload
{
  "userId": "user_123",
  "email": "user@example.com",
  "role": "student",
  "iat": 1640995200,
  "exp": 1640996100
}

// Refresh token payload
{
  "userId": "user_123",
  "tokenVersion": 1,
  "iat": 1640995200,
  "exp": 1641600000
}
```

## 🧪 Testing

### Manual Testing

1. **Start the server:**
   ```bash
   npm run server:dev
   ```

2. **Test registration:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123","role":"student","firstName":"Test","lastName":"User"}'
   ```

3. **Test login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123"}'
   ```

4. **Test protected route:**
   ```bash
   curl -X GET http://localhost:3001/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Health Check

```bash
curl http://localhost:3001/api/auth/health
```

## 🚨 Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "error": "Detailed error (development only)"
}
```

### Error Codes

- `MISSING_TOKEN` - No authorization header
- `INVALID_TOKEN` - Invalid or expired token
- `USER_NOT_FOUND` - User doesn't exist
- `ACCOUNT_DEACTIVATED` - User account is disabled
- `INSUFFICIENT_PERMISSIONS` - Insufficient role permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests

## 🔄 Integration with Frontend

### React Integration Example

```typescript
// Auth context
const AuthContext = createContext();

// Login function
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    // Refresh token is automatically stored in HTTP-only cookie
  }
};

// Protected API call
const fetchProtectedData = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## 📊 Monitoring and Logging

### Request Logging
All requests are logged with:
- Method and path
- Response status
- Response time
- User information (if authenticated)

### Security Logging
- Failed login attempts
- Token verification failures
- Rate limit violations
- Unauthorized access attempts

## 🔮 Future Enhancements

1. **Database Integration**: Replace in-memory storage with database
2. **Email Verification**: Add email verification for registration
3. **Password Reset**: Implement password reset functionality
4. **Two-Factor Authentication**: Add 2FA support
5. **Session Management**: Advanced session tracking
6. **Audit Logging**: Comprehensive audit trail
7. **API Documentation**: OpenAPI/Swagger documentation

## 🆘 Troubleshooting

### Common Issues

1. **"JWT_SECRET must be at least 32 characters"**
   - Solution: Set a longer JWT_SECRET in environment variables

2. **"Invalid or expired token"**
   - Solution: Check token expiration and refresh if needed

3. **CORS errors**
   - Solution: Add your frontend URL to ALLOWED_ORIGINS

4. **Rate limit exceeded**
   - Solution: Wait for the rate limit window to reset

### Debug Mode

Set `NODE_ENV=development` to enable detailed error messages and stack traces.

## 📞 Support

For issues or questions about the authentication system:

1. Check the error logs in the console
2. Verify environment variables are set correctly
3. Test endpoints using the provided curl examples
4. Check the health endpoint for system status

---

**Note**: This authentication system is designed for development and testing. For production use, ensure proper database integration, enhanced security measures, and comprehensive testing.
