# Smart Campus Assistant - Developer Guide

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Target Audience**: Future developers and maintainers  

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [Available Scripts](#available-scripts)
5. [Testing Procedures](#testing-procedures)
6. [Code Standards](#code-standards)
7. [Architecture Patterns](#architecture-patterns)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Performance Optimization](#performance-optimization)
11. [Security Guidelines](#security-guidelines)
12. [Security Services](#security-services)
13. [Real-time Features](#real-time-features)
14. [Known Issues](#known-issues)
15. [Future Improvements](#future-improvements)
16. [Contributing Guidelines](#contributing-guidelines)

---

## 🎯 Project Overview

The Smart Campus Assistant is a modern, full-stack web application built with React, TypeScript, Node.js, and Express. It provides comprehensive university management functionality including secure attendance tracking, course management, AI-powered chatbot, real-time notifications, and advanced security features.

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Security**: JWT, bcrypt, helmet, rate limiting, fraud detection
- **Real-time**: Socket.io, WebSocket, real-time notifications
- **Testing**: Jest, Cypress, Testing Library, Vitest
- **Deployment**: Docker, PM2, Nginx

---

## 🏗️ Project Structure

```
smart-campus-assistant/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── common/              # Reusable UI components
│   │   ├── student/             # Student-specific components
│   │   ├── professor/           # Professor-specific components
│   │   └── admin/               # Admin-specific components
│   ├── pages/                   # Page components (routes)
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # API services and business logic
│   ├── utils/                   # Utility functions
│   ├── contexts/                # React contexts (Auth, Theme)
│   ├── types/                   # TypeScript type definitions
│   ├── routes/                  # API route definitions
│   ├── controllers/             # API controllers
│   ├── middleware/              # Express middleware
│   └── generated/               # Generated Prisma client
├── server/                      # Backend source code
│   ├── index.ts                 # Main server file
│   └── api/                     # API route handlers
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma            # Database schema
│   ├── dev.db                   # Development database
│   └── seed.cjs                 # Database seeding script
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── __mocks__/               # Test mocks
├── cypress/                     # E2E tests
│   ├── e2e/                     # Test scenarios
│   └── support/                 # Test support files
├── config/                      # Configuration files
├── scripts/                     # Build and deployment scripts
├── docs/                        # Documentation
├── public/                      # Static assets
└── uploads/                     # File uploads
```

### Key Directories Explained

#### Frontend (`src/`)
- **`components/`**: Reusable UI components organized by feature
- **`pages/`**: Route components that represent different pages
- **`hooks/`**: Custom React hooks for shared logic
- **`services/`**: API calls and business logic
- **`utils/`**: Pure utility functions
- **`contexts/`**: React context providers for global state
- **`types/`**: TypeScript type definitions

#### Backend (`server/` & `src/routes/`, `src/controllers/`)
- **`server/index.ts`**: Main Express server setup
- **`src/routes/`**: API route definitions
- **`src/controllers/`**: Business logic for API endpoints
- **`src/middleware/`**: Express middleware functions

#### Database (`prisma/`)
- **`schema.prisma`**: Database schema definition
- **`dev.db`**: SQLite development database
- **`seed.cjs`**: Database seeding script

#### Testing (`tests/`, `cypress/`)
- **`tests/`**: Unit and integration tests
- **`cypress/`**: End-to-end tests

---

## 🚀 Development Setup

### Prerequisites

```bash
# Required software
Node.js >= 18.0.0
npm >= 8.0.0
Git

# Optional but recommended
Docker >= 20.0.0
Docker Compose >= 2.0.0
```

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/smart-campus-assistant.git
cd smart-campus-assistant

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev          # Frontend (port 5173)
npm run server:dev   # Backend (port 3001)
```

### Environment Configuration

#### Development (`.env`)
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# Optional
OPENAI_API_KEY="your-openai-api-key"
LOG_LEVEL="debug"
```

---

## 📜 Available Scripts

### Development Scripts

```bash
# Frontend development
npm run dev                    # Start Vite dev server
npm run build                  # Build for production
npm run preview               # Preview production build
npm run typecheck             # TypeScript type checking

# Backend development
npm run server:dev            # Start backend with hot reload
npm run server                # Start backend (production)
npm run server:ts             # Start backend with ts-node
```

### Database Scripts

```bash
# Database management
npm run db:generate           # Generate Prisma client
npm run db:push               # Push schema to database
npm run db:migrate            # Run database migrations
npm run db:reset              # Reset database
npm run db:seed               # Seed database with initial data
npm run db:studio             # Open Prisma Studio
```

### Testing Scripts

```bash
# Unit tests
npm test                      # Run all tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage
npm run test:ci               # Run tests in CI mode
npm run test:unit:new         # Run specific unit test

# E2E tests
npm run cypress:open          # Open Cypress test runner
npm run cypress:run           # Run Cypress tests headlessly
npm run test:e2e              # Run E2E tests
```

### Production Scripts

```bash
# Production readiness
npm run check:prod            # Check production readiness
npm run test:smoke            # Run smoke tests
npm run analyze:bundle        # Analyze bundle size
npm run analyze:deps          # Analyze dependencies
npm run lighthouse            # Run Lighthouse audit
npm run lighthouse:ci         # Run Lighthouse CI
```

### Utility Scripts

```bash
# Code quality
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues

# Build analysis
npm run analyze:bundle        # Analyze webpack bundle
npm run analyze:deps          # Check for unused dependencies
```

---

## 🧪 Testing Procedures

### Unit Testing

#### Test Structure
```
tests/
├── __mocks__/                # Mock implementations
├── attendance.test.ts        # Attendance functionality tests
├── auth.test.ts             # Authentication tests
├── chatbot.test.ts          # Chatbot functionality tests
├── course.test.ts           # Course management tests
├── notification.test.ts     # Notification tests
├── time.utils.test.ts       # Time utility tests
├── user.test.ts             # User management tests
├── jest.setup.ts            # Jest configuration
└── setup.ts                 # Test setup utilities
```

#### Running Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npm run test:unit:new

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Writing Unit Tests
```typescript
// Example test structure
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    // Test user interactions
  });
});
```

### End-to-End Testing

#### Cypress Test Structure
```
cypress/
├── e2e/                      # Test scenarios
│   ├── accessibility.cy.ts   # Accessibility tests
│   ├── attendance.cy.ts      # Attendance flow tests
│   ├── auth_refresh.cy.ts    # Authentication tests
│   ├── chatbot.cy.ts         # Chatbot tests
│   ├── dashboard.cy.ts       # Dashboard tests
│   ├── login.cy.ts           # Login tests
│   ├── performance.cy.ts     # Performance tests
│   ├── responsive.cy.ts      # Responsive design tests
│   ├── schedule.cy.ts        # Schedule tests
│   └── student_ai_min.cy.ts  # Student AI tests
├── support/                  # Test support files
│   ├── commands.ts           # Custom commands
│   └── e2e.ts                # E2E configuration
└── screenshots/              # Test screenshots
```

#### Running E2E Tests
```bash
# Open Cypress test runner
npm run cypress:open

# Run all E2E tests headlessly
npm run cypress:run

# Run specific test file
npx cypress run --spec "cypress/e2e/login.cy.ts"
```

#### Writing E2E Tests
```typescript
// Example Cypress test
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid="university-id"]').type('12345678');
    cy.get('[data-testid="password"]').type('123456');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/student-dashboard');
  });

  it('should show error with invalid credentials', () => {
    cy.get('[data-testid="university-id"]').type('00000000');
    cy.get('[data-testid="password"]').type('000000');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });
});
```

### Performance Testing

#### Lighthouse Testing
```bash
# Run Lighthouse audit
npm run lighthouse

# Run Lighthouse CI
npm run lighthouse:ci
```

#### Performance Test Scenarios
- **Core Web Vitals**: FCP, LCP, CLS, TBT
- **Mobile Performance**: Mobile-specific performance tests
- **Bundle Analysis**: Bundle size and chunk analysis
- **Memory Usage**: Memory leak detection

---

## 📏 Code Standards

### TypeScript Standards

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: number;
  universityId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Use enums for constants
enum UserRole {
  STUDENT = 'STUDENT',
  PROFESSOR = 'PROFESSOR',
  ADMIN = 'ADMIN'
}

// Use type aliases for unions
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
```

#### Function Definitions
```typescript
// Use explicit return types for public functions
export function calculateAttendancePercentage(
  present: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

// Use arrow functions for simple operations
const formatTime = (time: string): string => {
  return time.replace(/^(\d{1,2}):(\d{2})$/, '$1:$2');
};
```

### React Standards

#### Component Structure
```typescript
// Use functional components with TypeScript
interface ComponentProps {
  title: string;
  onAction: (id: string) => void;
  className?: string;
}

export function ComponentName({ 
  title, 
  onAction, 
  className = '' 
}: ComponentProps) {
  // Hooks at the top
  const [state, setState] = useState<string>('');
  
  // Event handlers
  const handleClick = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);
  
  // Render
  return (
    <div className={`component ${className}`}>
      <h2>{title}</h2>
      <button onClick={() => handleClick('test')}>
        Click me
      </button>
    </div>
  );
}
```

#### Custom Hooks
```typescript
// Custom hooks should start with 'use'
export function useApiData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // API call logic
  }, [url]);
  
  return { data, loading, error };
}
```

### API Standards

#### Controller Structure
```typescript
// Use async/await for async operations
export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { universityId, email, firstName, lastName, role } = req.body;
    
    // Validation
    if (!universityId || !email) {
      res.status(400).json({
        success: false,
        message: 'University ID and email are required'
      });
      return;
    }
    
    // Business logic
    const user = await prisma.user.create({
      data: { universityId, email, firstName, lastName, role }
    });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}
```

#### Error Handling
```typescript
// Use custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Use error middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

### CSS Standards

#### Tailwind CSS Usage
```typescript
// Use Tailwind classes consistently
<div className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
  <p className="text-gray-600">Description</p>
</div>

// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Use custom CSS for complex styles
<div className="custom-gradient-background">
  {/* Content */}
</div>
```

---

## 🏛️ Architecture Patterns

### Frontend Architecture

#### Component Hierarchy
```
App
├── AuthProvider
├── ThemeProvider
├── QueryProvider
├── ToastProvider
└── Routes
    ├── Login
    ├── StudentDashboard
    ├── ProfessorDashboard
    └── AdminDashboard
```

#### State Management
- **React Context**: Global state (auth, theme)
- **React Query**: Server state management
- **Local State**: Component-specific state with useState/useReducer

#### Data Flow
```
User Action → Component → Service → API → Database
     ↓
UI Update ← State Update ← Response Processing ← API Response
```

### Backend Architecture

#### Layered Architecture
```
Routes → Controllers → Services → Database
   ↓         ↓           ↓
Middleware → Validation → Business Logic → Prisma ORM
```

#### API Design
- **RESTful**: Standard HTTP methods and status codes
- **Consistent**: Uniform response format
- **Versioned**: API versioning for future compatibility
- **Documented**: OpenAPI/Swagger documentation

---

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
```typescript
// Request
{
  "universityId": "12345678",
  "password": "123456"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "universityId": "12345678",
      "email": "student@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

#### POST /api/auth/refresh
```typescript
// Request
{
  "refreshToken": "refresh-token"
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

### User Management Endpoints

#### GET /api/users
```typescript
// Query Parameters
{
  "page": 1,
  "limit": 10,
  "role": "STUDENT",
  "search": "john"
}

// Response
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### Course Management Endpoints

#### GET /api/courses
```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "courseCode": "CS101",
      "courseName": "Introduction to Computer Science",
      "description": "Basic programming concepts",
      "credits": 3,
      "professor": {
        "id": 1,
        "firstName": "Dr. Smith",
        "lastName": "Johnson"
      }
    }
  ]
}
```

### Attendance Endpoints

#### POST /api/attendance/mark
```typescript
// Request
{
  "qrCodeId": "qr-session-id",
  "status": "PRESENT"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "studentId": 1,
    "courseId": 1,
    "status": "PRESENT",
    "markedAt": "2024-12-01T10:00:00Z"
  }
}
```

---

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  university_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Courses Table
```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 3,
  professor_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES users(id)
);
```

#### Attendance Records Table
```sql
CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  qr_code_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PRESENT',
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id),
  UNIQUE(student_id, qr_code_id)
);
```

### Relationships
- **Users** → **Courses** (One-to-Many: Professor creates courses)
- **Users** → **Attendance Records** (One-to-Many: Student has attendance records)
- **Courses** → **Attendance Records** (One-to-Many: Course has attendance records)
- **QR Codes** → **Attendance Records** (One-to-Many: QR code generates attendance records)

---

## ⚡ Performance Optimization

### Frontend Optimizations

#### Code Splitting
```typescript
// Lazy load pages
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const ProfessorDashboard = lazy(() => import('./pages/ProfessorDashboard'));

// Use with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <StudentDashboard />
</Suspense>
```

#### Memoization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback((id: string) => {
  onAction(id);
}, [onAction]);

// Memoize components
const MemoizedComponent = memo(ComponentName);
```

#### Bundle Optimization
```typescript
// Vite configuration for manual chunking
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'chart-vendor': ['recharts']
        }
      }
    }
  }
});
```

### Backend Optimizations

#### Database Queries
```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true
  }
});

// Use include for related data
const courses = await prisma.course.findMany({
  include: {
    professor: {
      select: {
        firstName: true,
        lastName: true
      }
    }
  }
});

// Use pagination
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit
});
```

#### Caching
```typescript
// Use React Query for client-side caching
const { data, isLoading } = useQuery({
  queryKey: ['users', page, limit],
  queryFn: () => fetchUsers(page, limit),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
});
```

---

## 🔒 Security Guidelines

### 1. Security Architecture

#### Multi-layered Security Approach
```typescript
// Security layers in order of execution
1. Network Security (Firewall, SSL/TLS)
2. Application Security (Helmet, CORS, Rate Limiting)
3. Authentication & Authorization (JWT, RBAC)
4. Input Validation & Sanitization
5. Business Logic Security (Fraud Detection)
6. Data Security (Encryption, Access Control)
7. Monitoring & Logging
```

#### Security Service Integration
```typescript
// src/services/security/index.ts
export class SecurityServiceFactory {
  static createLocationService(): LocationService {
    return new LocationService({
      enabled: process.env.LOCATION_VERIFICATION_ENABLED === 'true',
      accuracyThreshold: parseFloat(process.env.LOCATION_ACCURACY_THRESHOLD || '10'),
      maxDistance: 100,
      timeWindow: 300000,
    });
  }

  static createFraudDetectionService(): FraudDetectionService {
    return new FraudDetectionService({
      enabled: process.env.FRAUD_DETECTION_ENABLED === 'true',
      riskThreshold: parseFloat(process.env.FRAUD_RISK_THRESHOLD || '0.7'),
      mlModelPath: './models/fraud-detection.model',
    });
  }
}
```

### 2. Authentication & Authorization

#### JWT Security Implementation
```typescript
// src/middleware/auth.ts
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, universityId: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or user not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based access control
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }

    next();
  };
};
```

#### Password Security
```typescript
// src/utils/password.ts
export class PasswordService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return { isValid: errors.length === 0, errors };
  }
}
```

### 3. Input Validation & Sanitization

#### Express Validator Implementation
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

// Attendance validation
export const validateAttendanceScan = [
  body('qrCodeId')
    .isUUID()
    .withMessage('QR Code ID must be a valid UUID'),
  body('location')
    .isObject()
    .withMessage('Location must be an object')
    .custom((value) => {
      if (!value.latitude || !value.longitude) {
        throw new Error('Location must contain latitude and longitude');
      }
      return true;
    }),
  body('deviceFingerprint')
    .isString()
    .isLength({ min: 32, max: 64 })
    .withMessage('Device fingerprint must be a valid string'),
  validateInput
];

// User registration validation
export const validateUserRegistration = [
  body('universityId')
    .isLength({ min: 8, max: 8 })
    .isNumeric()
    .withMessage('University ID must be exactly 8 digits'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 50 })
    .withMessage('Password must be between 8 and 50 characters'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required'),
  validateInput
];
```

### 4. Rate Limiting & DDoS Protection

#### Rate Limiting Configuration
```typescript
// src/middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// Strict rate limiting for sensitive endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many sensitive requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiting
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 5. Security Headers

#### Helmet Configuration
```typescript
// src/middleware/securityHeaders.ts
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
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
```

### 6. Data Encryption

#### Sensitive Data Encryption
```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
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

### 7. Security Monitoring

#### Security Event Logging
```typescript
// src/middleware/securityMonitoring.ts
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
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
        duration,
        success: res.statusCode < 400,
      });
    }
    
    if (req.path.includes('/api/auth/')) {
      Logger.info('Authentication attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        duration,
        success: res.statusCode < 400,
      });
    }

    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      Logger.warn('Security violation detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
```

---

## 🛡️ Security Services

### 1. Location Verification Service

#### GPS Validation Implementation
```typescript
// src/services/security/location.service.ts
export class LocationService {
  async validateLocation(
    userLocation: LocationData,
    sessionLocation: LocationData,
    radius: number
  ): Promise<LocationValidationResult> {
    try {
      const distance = this.calculateDistance(userLocation, sessionLocation);
      const isWithinRadius = distance <= radius;
      const accuracy = this.verifyLocationAccuracy(userLocation);
      
      return {
        isValid: isWithinRadius && accuracy.isValid,
        distance,
        accuracy: accuracy.accuracy,
        isWithinRadius,
        confidence: this.calculateConfidence(distance, accuracy.accuracy),
      };
    } catch (error) {
      Logger.error('Location validation failed', error);
      return {
        isValid: false,
        distance: Infinity,
        accuracy: 0,
        isWithinRadius: false,
        confidence: 0,
        error: error.message,
      };
    }
  }

  private calculateDistance(loc1: LocationData, loc2: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}
```

### 2. Device Fingerprinting Service

#### Device Identification Implementation
```typescript
// src/services/security/device-fingerprint.service.ts
export class DeviceFingerprintService {
  async generateFingerprint(deviceInfo: DeviceInfo): Promise<string> {
    const fingerprintData = {
      userAgent: deviceInfo.userAgent,
      screenResolution: deviceInfo.screenResolution,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      platform: deviceInfo.platform,
      hardwareConcurrency: deviceInfo.hardwareConcurrency,
      canvas: await this.getCanvasFingerprint(),
      webgl: await this.getWebGLFingerprint(),
      audio: await this.getAudioFingerprint(),
    };

    const fingerprintString = JSON.stringify(fingerprintData);
    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
  }

  async validateFingerprint(
    currentFingerprint: string,
    storedFingerprints: string[]
  ): Promise<DeviceValidationResult> {
    const similarities = storedFingerprints.map(stored => 
      this.calculateSimilarity(currentFingerprint, stored)
    );

    const maxSimilarity = Math.max(...similarities);
    const isKnownDevice = maxSimilarity > 0.8;
    const isSuspicious = maxSimilarity < 0.3;

    return {
      isValid: isKnownDevice,
      similarity: maxSimilarity,
      isKnownDevice,
      isSuspicious,
      confidence: this.calculateConfidence(maxSimilarity),
    };
  }
}
```

### 3. Fraud Detection Service

#### ML-based Fraud Detection
```typescript
// src/services/security/fraud-detection.service.ts
export class FraudDetectionService {
  async analyzeAttempt(attemptData: AttendanceAttemptData): Promise<FraudDetectionResult> {
    try {
      const riskFactors = await this.identifyRiskFactors(attemptData);
      const riskScore = await this.calculateRiskScore(riskFactors);
      const isFraudulent = riskScore > this.config.riskThreshold;
      
      if (isFraudulent) {
        await this.generateFraudAlert(attemptData, riskFactors, riskScore);
      }

      return {
        isFraudulent,
        riskScore,
        riskFactors,
        confidence: this.calculateConfidence(riskScore),
        recommendations: this.generateRecommendations(riskFactors),
      };
    } catch (error) {
      Logger.error('Fraud detection failed', error);
      return {
        isFraudulent: false,
        riskScore: 0,
        riskFactors: [],
        confidence: 0,
        error: error.message,
      };
    }
  }

  private async identifyRiskFactors(attemptData: AttendanceAttemptData): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Location-based risks
    if (attemptData.locationAccuracy > 100) {
      factors.push({ type: 'LOCATION_INACCURATE', severity: 'HIGH', weight: 0.3 });
    }

    // Time-based risks
    if (attemptData.timeDeviation > 300000) { // 5 minutes
      factors.push({ type: 'TIME_MANIPULATION', severity: 'HIGH', weight: 0.4 });
    }

    // Device-based risks
    if (attemptData.deviceChange) {
      factors.push({ type: 'DEVICE_CHANGE', severity: 'MEDIUM', weight: 0.2 });
    }

    return factors;
  }
}
```

---

## 🔒 Security Considerations

### Authentication Security
```typescript
// JWT token validation
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}
```

### Input Validation
```typescript
// Use express-validator for input validation
import { body, validationResult } from 'express-validator';

export const validateUser = [
  body('universityId')
    .isLength({ min: 8, max: 8 })
    .withMessage('University ID must be exactly 8 digits'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 1, max: 9 })
    .withMessage('Password must be 1-9 digits')
];
```

### CORS Configuration
```typescript
// Configure CORS properly
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

---

## 🔄 Real-time Features

### 1. Socket.io Service Architecture

#### Service Implementation
```typescript
// src/services/socket.service.ts
export class SocketService {
  private io: Server;
  private messageQueue: Queue<SocketMessage> = new Queue();
  private connectedUsers: Map<string, string> = new Map();

  init(httpServer: http.Server): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use(this.authenticate.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
    this.handleMessageQueue();
  }

  private authenticate(socket: Socket, next: (err?: Error) => void): void {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  }
}
```

#### Event Management
```typescript
// Real-time event emission
export class SocketService {
  emitAttendanceMarked(data: AttendanceMarkedData): void {
    this.emit('attendance:marked', data, `session:${data.sessionId}`, 1);
  }

  emitFraudDetected(data: FraudDetectedData): void {
    this.emit('attendance:fraud_detected', data, `session:${data.sessionId}`, 2);
    this.emit('security:fraud_alert', data, `role:PROFESSOR`, 2);
  }

  emitLocationWarning(data: LocationWarningData): void {
    this.emit('attendance:location_warning', data, `session:${data.sessionId}`, 1);
  }

  emitDeviceWarning(data: DeviceWarningData): void {
    this.emit('attendance:device_warning', data, `session:${data.sessionId}`, 1);
  }

  emitSessionStarted(data: SessionStartedData): void {
    this.emit('session:started', data, `course:${data.courseId}`, 1);
  }

  emitSessionEnded(data: SessionEndedData): void {
    this.emit('session:ended', data, `course:${data.courseId}`, 1);
  }
}
```

### 2. Real-time Components

#### Live Attendance Tracking
```typescript
// src/components/realtime/LiveAttendanceTracking.tsx
export function LiveAttendanceTracking() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: { token: localStorage.getItem('token') }
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('attendance:marked', (data) => {
      setAttendanceData(prev => ({
        ...prev,
        totalPresent: (prev?.totalPresent || 0) + 1,
        recentActivity: [data, ...(prev?.recentActivity || []).slice(0, 9)]
      }));
    });

    socket.on('attendance:fraud_detected', (data) => {
      setFraudAlerts(prev => [data, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-4">
      <ConnectionStatusIndicator status={connectionStatus} />
      <AttendanceStats data={attendanceData} />
      <FraudAlerts alerts={fraudAlerts} />
    </div>
  );
}
```

#### Real-time Fraud Alerts
```typescript
// src/components/realtime/RealTimeFraudAlerts.tsx
export function RealTimeFraudAlerts() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({
    severity: 'all',
    resolved: false,
  });

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');

    socket.on('security:fraud_alert', (alert: FraudAlert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    socket.on('security:risk_high', (alert: FraudAlert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
    if (filters.resolved !== undefined && alert.isResolved !== filters.resolved) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <AlertFilters filters={filters} onFiltersChange={setFilters} />
      <AlertList alerts={filteredAlerts} />
    </div>
  );
}
```

### 3. Notification System

#### Email Notifications
```typescript
// src/services/notifications/email-notifications.service.ts
export class EmailNotificationsService {
  async sendFraudAlertEmail(alertData: FraudAlertData): Promise<void> {
    const template = await this.getTemplate('fraud_alert');
    const html = this.renderTemplate(template, {
      studentName: alertData.studentName,
      alertType: alertData.alertType,
      severity: alertData.severity,
      timestamp: alertData.timestamp,
      description: alertData.description,
    });

    await this.sendEmail({
      to: alertData.professorEmail,
      subject: `Security Alert: ${alertData.alertType}`,
      html,
    });
  }

  async sendAttendanceConfirmationEmail(attendanceData: AttendanceData): Promise<void> {
    const template = await this.getTemplate('attendance_confirmation');
    const html = this.renderTemplate(template, {
      studentName: attendanceData.studentName,
      courseName: attendanceData.courseName,
      timestamp: attendanceData.timestamp,
      location: attendanceData.location,
    });

    await this.sendEmail({
      to: attendanceData.studentEmail,
      subject: 'Attendance Confirmed',
      html,
    });
  }
}
```

#### Push Notifications
```typescript
// src/services/notifications/push-notifications.service.ts
export class PushNotificationsService {
  async sendPushNotification(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return;

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
    });

    await webpush.sendNotification(subscription, payload);
  }

  async subscribe(userId: string, subscription: PushSubscription): Promise<void> {
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        keys: JSON.stringify(subscription.keys),
        isActive: true,
      },
    });
  }
}
```

### 4. Real-time Data Synchronization

#### State Management
```typescript
// src/hooks/useRealtimeData.ts
export function useRealtimeData<T>(
  eventName: string,
  initialData: T,
  room?: string
): [T, (data: T) => void] {
  const [data, setData] = useState<T>(initialData);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (newData: T) => {
      setData(newData);
    };

    socket.on(eventName, handleUpdate);
    
    if (room) {
      socket.emit('join-room', room);
    }

    return () => {
      socket.off(eventName, handleUpdate);
      if (room) {
        socket.emit('leave-room', room);
      }
    };
  }, [socket, eventName, room]);

  const updateData = useCallback((newData: T) => {
    setData(newData);
    if (socket) {
      socket.emit(eventName, newData);
    }
  }, [socket, eventName]);

  return [data, updateData];
}
```

#### Connection Management
```typescript
// src/hooks/useSocket.ts
export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
}
```

---

## 🐛 Known Issues

### Current Issues

#### 1. Service Worker Errors
- **Issue**: Service worker causing console errors
- **Status**: Temporarily disabled
- **Workaround**: Service worker is commented out in App.tsx
- **Fix**: Update service worker implementation

#### 2. Mobile Touch Issues
- **Issue**: Some touch interactions not working on older mobile devices
- **Status**: Minor
- **Workaround**: Use desktop mode on mobile
- **Fix**: Update touch event handlers

#### 3. Database Connection Pool
- **Issue**: SQLite connection pool not optimized
- **Status**: Low priority
- **Workaround**: Restart server if connection issues occur
- **Fix**: Implement connection pooling

### Resolved Issues

#### 1. TypeScript Configuration
- **Issue**: TypeScript path aliases not working in tests
- **Status**: ✅ Resolved
- **Solution**: Updated jest.config.js with proper module mapping

#### 2. Build Optimization
- **Issue**: Large bundle sizes
- **Status**: ✅ Resolved
- **Solution**: Implemented code splitting and manual chunking

---

## 🚀 Future Improvements

### Phase 3 Enhancements

#### 1. Progressive Web App (PWA)
```typescript
// Add PWA capabilities
const pwaConfig = {
  name: 'Smart Campus Assistant',
  short_name: 'CampusApp',
  description: 'University management system',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#3b82f6'
};
```

#### 2. Real-time Features
```typescript
// WebSocket implementation
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',')
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });
});
```

#### 3. Advanced Analytics
```typescript
// Analytics dashboard
interface AnalyticsData {
  userEngagement: UserEngagementMetrics;
  attendanceTrends: AttendanceTrends;
  performanceMetrics: PerformanceMetrics;
}
```

### Performance Improvements

#### 1. Database Optimization
- Implement database indexing
- Add query optimization
- Implement connection pooling
- Add database caching

#### 2. Frontend Optimization
- Implement virtual scrolling for large lists
- Add image lazy loading
- Implement service worker caching
- Add preloading strategies

### Security Enhancements

#### 1. Advanced Authentication
- Implement two-factor authentication
- Add biometric authentication
- Implement session management
- Add password policies

#### 2. Data Protection
- Implement data encryption
- Add audit logging
- Implement data retention policies
- Add GDPR compliance

---

## 🤝 Contributing Guidelines

### Development Workflow

#### 1. Branch Naming
```bash
# Feature branches
git checkout -b feature/user-authentication
git checkout -b feature/attendance-tracking

# Bug fix branches
git checkout -b fix/login-validation
git checkout -b fix/mobile-responsive

# Hotfix branches
git checkout -b hotfix/security-patch
```

#### 2. Commit Messages
```bash
# Use conventional commits
git commit -m "feat(auth): add JWT token refresh"
git commit -m "fix(ui): resolve mobile navigation issue"
git commit -m "docs(api): update authentication endpoints"
git commit -m "test(attendance): add unit tests for attendance service"
```

#### 3. Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Run all tests and linting
4. Create pull request
5. Request code review
6. Merge after approval

### Code Review Checklist

#### Frontend Review
- [ ] TypeScript types are properly defined
- [ ] Components are properly tested
- [ ] Responsive design is implemented
- [ ] Accessibility standards are met
- [ ] Performance is optimized

#### Backend Review
- [ ] API endpoints are properly documented
- [ ] Error handling is implemented
- [ ] Input validation is present
- [ ] Security measures are in place
- [ ] Database queries are optimized

### Testing Requirements

#### Unit Tests
- [ ] All new functions have unit tests
- [ ] Test coverage is above 80%
- [ ] Tests are properly mocked
- [ ] Edge cases are covered

#### Integration Tests
- [ ] API endpoints are tested
- [ ] Database operations are tested
- [ ] Authentication flows are tested
- [ ] Error scenarios are covered

#### E2E Tests
- [ ] Critical user flows are tested
- [ ] Mobile responsiveness is tested
- [ ] Cross-browser compatibility is tested
- [ ] Performance is validated

---

## 📞 Support and Resources

### Documentation
- **API Documentation**: Available at `/api-docs` endpoint
- **Component Documentation**: Storybook integration (planned)
- **Database Schema**: Prisma Studio at `http://localhost:5555`

### Development Tools
- **IDE**: VS Code with recommended extensions
- **Debugging**: Chrome DevTools, React DevTools
- **Testing**: Jest, Cypress, Testing Library
- **Linting**: ESLint, Prettier
- **Type Checking**: TypeScript compiler

### Learning Resources
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs/

---

## 📋 Quick Reference

### Essential Commands
```bash
# Development
npm run dev              # Start frontend
npm run server:dev       # Start backend
npm run build            # Build for production

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run cypress:open     # Open Cypress

# Production
npm run check:prod       # Check production readiness
npm run test:smoke       # Run smoke tests
```

### Key Files
- **Frontend Entry**: `src/main.tsx`
- **Backend Entry**: `server/index.ts`
- **Database Schema**: `prisma/schema.prisma`
- **Environment**: `.env`
- **Package Config**: `package.json`
- **Vite Config**: `vite.config.ts`
- **Jest Config**: `jest.config.js`

### Important URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **Database Studio**: http://localhost:5555

---

**Developer Guide Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintained By**: Development Team
