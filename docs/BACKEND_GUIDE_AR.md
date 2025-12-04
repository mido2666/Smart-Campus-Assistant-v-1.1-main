# 🔧 دليل الباك-إند المفصل - Smart Campus Assistant

## 📚 المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [بنية الملفات](#بنية-الملفات)
3. [الاعتماديات (Dependencies)](#الاعتماديات-dependencies)
4. [كيفية بدء السيرفر](#كيفية-بدء-السيرفر)
5. [API Endpoints](#api-endpoints)
6. [المصادقة (Authentication)](#المصادقة-authentication)
7. [التعامل مع قاعدة البيانات](#التعامل-مع-قاعدة-البيانات)
8. [Middleware](#middleware)
9. [إدارة الأخطاء](#إدارة-الأخطاء)
10. [Logging](#logging)

---

## نظرة عامة

الباك-إند مبنى على **Node.js** و **Express.js** مع **TypeScript** لتوفير API RESTful شامل لإدارة الحرم الجامعي. يستخدم **Prisma ORM** للتعامل مع قاعدة البيانات **PostgreSQL** و **JWT** للمصادقة.

### المميزات الرئيسية

- ✅ RESTful API
- ✅ JWT Authentication
- ✅ Role-based Access Control (RBAC)
- ✅ WebSocket (Socket.io) للتواصل الفوري
- ✅ Security middleware (CORS, Rate Limiting, Input Validation)
- ✅ Error handling شامل
- ✅ Logging متقدم
- ✅ TypeScript للسلامة النوعية

---

## بنية الملفات

### الهيكل الأساسي

```
server/
├── index.ts                 # نقطة الدخول الرئيسية للسيرفر
├── api/                     # API routes إضافية
│   └── chat.js             # Chat API
└── ...

src/
├── routes/                  # تعريفات Routes
│   ├── auth.routes.ts      # Routes للمصادقة
│   ├── course.routes.ts    # Routes للكورسات
│   ├── attendance.routes.ts # Routes للحضور
│   ├── schedule.routes.ts  # Routes للجداول
│   ├── user.routes.ts      # Routes للمستخدمين
│   └── notification.routes.ts # Routes للإشعارات
│
├── controllers/             # Request Handlers
│   ├── auth.controller.ts  # معالج طلبات المصادقة
│   ├── course.controller.ts # معالج طلبات الكورسات
│   ├── attendance.controller.ts # معالج طلبات الحضور
│   ├── schedule.controller.ts # معالج طلبات الجداول
│   ├── user.controller.ts  # معالج طلبات المستخدمين
│   └── notification.controller.ts # معالج طلبات الإشعارات
│
├── services/                # Business Logic
│   ├── auth.service.ts     # منطق المصادقة
│   ├── course.service.ts   # منطق الكورسات
│   ├── attendance.service.ts # منطق الحضور
│   ├── schedule.service.ts # منطق الجداول
│   ├── user.service.ts     # منطق المستخدمين
│   ├── notification.service.ts # منطق الإشعارات
│   ├── ai.service.ts       # خدمة الذكاء الاصطناعي
│   ├── qr.service.ts       # خدمة QR Codes
│   └── security/           # خدمات الأمان
│       ├── fraud-detection.service.ts
│       ├── location.service.ts
│       ├── device-fingerprint.service.ts
│       ├── photo-verification.service.ts
│       └── time-validation.service.ts
│
├── middleware/              # Express Middleware
│   └── auth.middleware.ts  # Middleware للمصادقة
│
├── utils/                   # Utility Functions
│   └── jwt.ts              # وظائف JWT
│
└── generated/               # Generated files
    └── prisma/             # Prisma Client
```

---

## الاعتماديات (Dependencies)

### الاعتماديات الأساسية

#### 1. Express.js (`express`)

- **السبب**: إطار عمل الويب لبناء API RESTful
- **الاستخدام**: معالجة HTTP requests، routing، middleware

```javascript
import express from "express";
const app = express();
```

#### 2. Prisma (`@prisma/client`, `prisma`)

- **السبب**: ORM حديث للتعامل مع قاعدة البيانات
- **الاستخدام**: استعلامات قاعدة البيانات، migrations، type safety

```javascript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
```

#### 3. JWT (`jsonwebtoken`)

- **السبب**: توليد والتحقق من JWT tokens للمصادقة
- **الاستخدام**: إنشاء access tokens و refresh tokens

```javascript
import jwt from "jsonwebtoken";
const token = jwt.sign(payload, secret, { expiresIn: "15m" });
```

#### 4. Bcrypt (`bcryptjs`)

- **السبب**: تشفير كلمات المرور
- **الاستخدام**: Hash passwords قبل حفظها في قاعدة البيانات

```javascript
import bcrypt from "bcryptjs";
const hashedPassword = await bcrypt.hash(password, 10);
```

#### 5. CORS (`cors`)

- **السبب**: السماح بطلبات من Frontend على منافذ مختلفة
- **الاستخدام**: إعداد CORS headers

```javascript
import cors from "cors";
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);
```

#### 6. Socket.io (`socket.io`)

- **السبب**: التواصل الفوري (WebSocket)
- **الاستخدام**: إشعارات فورية، تحديثات مباشرة

```javascript
import { Server } from "socket.io";
const io = new Server(httpServer);
```

#### 7. Dotenv (`dotenv`)

- **السبب**: تحميل متغيرات البيئة من ملف `.env`
- **الاستخدام**: إعدادات التطبيق (secrets، database URLs)

```javascript
import dotenv from "dotenv";
dotenv.config();
```

#### 8. Morgan (`morgan`)

- **السبب**: Logging لطلبات HTTP
- **الاستخدام**: تسجيل جميع الطلبات الواردة

```javascript
import morgan from "morgan";
app.use(morgan("dev"));
```

#### 9. Express Rate Limit (`express-rate-limit`)

- **السبب**: منع إساءة الاستخدام (Rate Limiting)
- **الاستخدام**: تحديد عدد الطلبات المسموح بها لكل IP

```javascript
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

#### 10. Cookie Parser (`cookie-parser`)

- **السبب**: قراءة cookies من الطلبات
- **الاستخدام**: حفظ refresh tokens في cookies

```javascript
import cookieParser from "cookie-parser";
app.use(cookieParser());
```

---

## كيفية بدء السيرفر

### 1. الملف الرئيسي

الملف الرئيسي للسيرفر موجود في `server/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ ... }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
// ... more routes

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
});
```

### 2. الأوامر المطلوبة

#### للتطوير (Development)

```bash
npm run server:dev
```

هذا الأمر يستخدم `nodemon` لإعادة تشغيل السيرفر تلقائياً عند تغيير الملفات.

#### للإنتاج (Production)

```bash
npm run server
```

هذا الأمر يستخدم `tsx` لتشغيل ملف TypeScript مباشرة.

#### للتشغيل العادي (Node.js)

```bash
npm run server:js
```

هذا الأمر يتطلب بناء TypeScript أولاً.

### 3. المتغيرات البيئية اللازمة

في ملف `.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/smart_campus?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# Bcrypt
BCRYPT_SALT_ROUNDS="12"

# OpenAI (Optional)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="deepseek/deepseek-chat"
OPENAI_BASE_URL="https://openrouter.ai/api/v1"
```

---

## API Endpoints

### Authentication Endpoints

#### 1. POST `/api/auth/register`

**الوصف**: تسجيل مستخدم جديد

**Body Parameters**:

```json
{
  "universityId": "12345678",
  "email": "student@university.edu",
  "password": "123456",
  "firstName": "أحمد",
  "lastName": "محمد",
  "role": "student" // أو "professor" أو "admin"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "universityId": "12345678",
      "email": "student@university.edu",
      "firstName": "أحمد",
      "lastName": "محمد",
      "role": "STUDENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Authentication**: غير مطلوب

**Rate Limit**: 3 محاولات كل 15 دقيقة

---

#### 2. POST `/api/auth/login`

**الوصف**: تسجيل الدخول

**Body Parameters**:

```json
{
  "universityId": "12345678",
  "password": "123456"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "universityId": "12345678",
      "email": "student@university.edu",
      "firstName": "أحمد",
      "lastName": "محمد",
      "role": "STUDENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Authentication**: غير مطلوب

**Rate Limit**:

- Development: 10 محاولات كل 15 دقيقة
- Production: 5 محاولات كل 15 دقيقة

---

#### 3. POST `/api/auth/refresh`

**الوصف**: تجديد Access Token

**Body Parameters**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Authentication**: غير مطلوب (لكن يتطلب refresh token صالح)

---

#### 4. POST `/api/auth/logout`

**الوصف**: تسجيل الخروج

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response Example**:

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Authentication**: مطلوب

---

#### 5. GET `/api/auth/me`

**الوصف**: الحصول على معلومات المستخدم الحالي

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "universityId": "12345678",
    "email": "student@university.edu",
    "firstName": "أحمد",
    "lastName": "محمد",
    "role": "STUDENT"
  }
}
```

**Authentication**: مطلوب

---

### Course Endpoints

#### 1. GET `/api/courses`

**الوصف**: الحصول على جميع الكورسات

**Query Parameters**:

- `professorId` (optional): فلترة حسب الأستاذ
- `isActive` (optional): فلترة حسب الحالة

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response Example**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "courseCode": "CS101",
      "courseName": "مقدمة في علوم الحاسب",
      "description": "كورس تمهيدي",
      "credits": 3,
      "professorId": 1,
      "isActive": true,
      "professor": {
        "id": 1,
        "firstName": "أحمد",
        "lastName": "السيد"
      },
      "enrollments": [],
      "schedules": []
    }
  ]
}
```

**Authentication**: مطلوب

---

#### 2. POST `/api/courses`

**الوصف**: إنشاء كورس جديد

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Body Parameters**:

```json
{
  "courseCode": "CS101",
  "courseName": "مقدمة في علوم الحاسب",
  "description": "كورس تمهيدي",
  "credits": 3
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": 1,
    "courseCode": "CS101",
    "courseName": "مقدمة في علوم الحاسب",
    "description": "كورس تمهيدي",
    "credits": 3,
    "professorId": 1,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Authentication**: مطلوب (PROFESSOR أو ADMIN فقط)

---

#### 3. GET `/api/courses/:id`

**الوصف**: الحصول على كورس محدد

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response Example**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "courseCode": "CS101",
    "courseName": "مقدمة في علوم الحاسب",
    "description": "كورس تمهيدي",
    "credits": 3,
    "professorId": 1,
    "isActive": true,
    "professor": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "السيد"
    },
    "enrollments": [
      {
        "id": 1,
        "studentId": 2,
        "student": {
          "id": 2,
          "firstName": "محمد",
          "lastName": "حسن"
        }
      }
    ],
    "schedules": []
  }
}
```

**Authentication**: مطلوب

---

#### 4. PUT `/api/courses/:id`

**الوصف**: تحديث كورس

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Body Parameters**:

```json
{
  "courseName": "مقدمة في علوم الحاسب (محدث)",
  "description": "وصف محدث",
  "credits": 4
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "id": 1,
    "courseCode": "CS101",
    "courseName": "مقدمة في علوم الحاسب (محدث)",
    "description": "وصف محدث",
    "credits": 4,
    "updatedAt": "2025-01-01T01:00:00.000Z"
  }
}
```

**Authentication**: مطلوب (PROFESSOR - مالك الكورس فقط - أو ADMIN)

---

#### 5. DELETE `/api/courses/:id`

**الوصف**: حذف كورس (soft delete)

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response Example**:

```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**Authentication**: مطلوب (PROFESSOR - مالك الكورس فقط - أو ADMIN)

---

### Attendance Endpoints

#### 1. POST `/api/attendance/mark`

**الوصف**: تسجيل الحضور

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Body Parameters**:

```json
{
  "qrCodeId": 1,
  "location": {
    "latitude": 30.0444,
    "longitude": 31.2357
  },
  "deviceFingerprint": "abc123...",
  "photoUrl": "https://example.com/photo.jpg"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "id": 1,
    "studentId": 2,
    "courseId": 1,
    "qrCodeId": 1,
    "status": "PRESENT",
    "markedAt": "2025-01-01T10:00:00.000Z",
    "fraudScore": 0.1
  }
}
```

**Authentication**: مطلوب (STUDENT فقط)

---

#### 2. GET `/api/attendance/sessions`

**الوصف**: الحصول على جلسات الحضور

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

- `courseId` (optional): فلترة حسب الكورس
- `professorId` (optional): فلترة حسب الأستاذ

**Response Example**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sessionId": "uuid-here",
      "courseId": 1,
      "professorId": 1,
      "title": "محاضرة الأسبوع الأول",
      "description": "مقدمة في المادة",
      "expiresAt": "2025-01-01T11:00:00.000Z",
      "isActive": true,
      "latitude": 30.0444,
      "longitude": 31.2357,
      "radius": 50
    }
  ]
}
```

**Authentication**: مطلوب

---

### Schedule Endpoints

#### 1. GET `/api/schedule`

**الوصف**: الحصول على الجداول الزمنية

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Query Parameters**:

- `courseId` (optional): فلترة حسب الكورس
- `professorId` (optional): فلترة حسب الأستاذ
- `dayOfWeek` (optional): فلترة حسب اليوم (0-6)

**Response Example**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "courseId": 1,
      "professorId": 1,
      "dayOfWeek": 1,
      "startTime": "10:00",
      "endTime": "12:00",
      "room": "قاعة 101",
      "semester": "Fall 2024",
      "isActive": true
    }
  ]
}
```

**Authentication**: مطلوب

---

#### 2. POST `/api/schedule`

**الوصف**: إنشاء جدول زمني جديد

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Body Parameters**:

```json
{
  "courseId": 1,
  "dayOfWeek": 1,
  "startTime": "10:00",
  "endTime": "12:00",
  "room": "قاعة 101",
  "semester": "Fall 2024"
}
```

**Response Example**:

```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": 1,
    "courseId": 1,
    "professorId": 1,
    "dayOfWeek": 1,
    "startTime": "10:00",
    "endTime": "12:00",
    "room": "قاعة 101",
    "semester": "Fall 2024",
    "isActive": true
  }
}
```

**Authentication**: مطلوب (PROFESSOR أو ADMIN فقط)

---

## المصادقة (Authentication)

### كيف تعمل المصادقة

يستخدم النظام **JWT (JSON Web Tokens)** للمصادقة. هناك نوعان من Tokens:

1. **Access Token**: يستخدم للوصول إلى الـ API (مدة صلاحية قصيرة: 15 دقيقة)
2. **Refresh Token**: يستخدم لتجديد Access Token (مدة صلاحية أطول: 7 أيام)

### تسلسل تسجيل الدخول

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Controller
    participant S as Auth Service
    participant D as Database
    participant J as JWT Utils

    C->>A: POST /api/auth/login
    A->>S: validateCredentials()
    S->>D: Find user by universityId
    D-->>S: User data
    S->>S: Compare password (bcrypt)
    S->>J: Generate access token
    J-->>S: Access token
    S->>J: Generate refresh token
    J-->>S: Refresh token
    S-->>A: User + Tokens
    A-->>C: Response with tokens
    C->>C: Store tokens (localStorage)
```

### كود مثال: تسجيل الدخول

```typescript
// src/services/auth.service.ts
static async login(data: LoginRequest) {
  // 1. البحث عن المستخدم
  const user = await prisma.user.findUnique({
    where: { universityId: data.universityId }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // 2. التحقق من كلمة المرور
  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // 3. إنشاء Tokens
  const accessToken = JWTUtils.generateAccessToken({
    userId: user.id,
    role: user.role
  });

  const refreshToken = JWTUtils.generateRefreshToken({
    userId: user.id
  });

  // 4. حفظ Refresh Token في قاعدة البيانات
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  // 5. إرجاع النتيجة
  return {
    user: {
      id: user.id,
      universityId: user.universityId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}
```

### تسلسل تسجيل مستخدم جديد

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Controller
    participant S as Auth Service
    participant D as Database
    participant B as Bcrypt

    C->>A: POST /api/auth/register
    A->>A: Validate input
    A->>S: register()
    S->>D: Check if user exists
    D-->>S: User not found
    S->>B: Hash password
    B-->>S: Hashed password
    S->>D: Create user
    D-->>S: Created user
    S->>J: Generate tokens
    J-->>S: Tokens
    S-->>A: User + Tokens
    A-->>C: Response
```

### كود مثال: التسجيل

```typescript
// src/services/auth.service.ts
static async register(data: RegisterRequest) {
  // 1. التحقق من عدم وجود المستخدم
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { universityId: data.universityId },
        { email: data.email }
      ]
    }
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // 2. تشفير كلمة المرور
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // 3. إنشاء المستخدم
  const user = await prisma.user.create({
    data: {
      universityId: data.universityId,
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      name: data.name || `${data.firstName} ${data.lastName}`,
      role: data.role.toUpperCase()
    }
  });

  // 4. إنشاء Tokens
  const accessToken = JWTUtils.generateAccessToken({
    userId: user.id,
    role: user.role
  });

  const refreshToken = JWTUtils.generateRefreshToken({
    userId: user.id
  });

  // 5. حفظ Refresh Token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    user: {
      id: user.id,
      universityId: user.universityId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}
```

### تخزين كلمة المرور (Bcrypt)

يتم تشفير كلمات المرور باستخدام **bcrypt** قبل حفظها في قاعدة البيانات:

```typescript
import bcrypt from "bcryptjs";

// عند التسجيل
const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds

// عند تسجيل الدخول
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**ملاحظات**:

- `12` rounds: عدد جولات التشفير (أعلى = أكثر أماناً لكن أبطأ)
- كلمات المرور المشفرة لا يمكن فكها (one-way hash)
- المقارنة تتم باستخدام `bcrypt.compare()`

---

## التعامل مع قاعدة البيانات

### Prisma ORM

يستخدم النظام **Prisma ORM** للتعامل مع قاعدة البيانات. Prisma يوفر:

- ✅ Type safety
- ✅ Auto-completion
- ✅ Migrations
- ✅ Query builder

### النماذج (Models)

راجع `prisma/schema.prisma` للحصول على تعريفات النماذج الكاملة.

#### مثال: نموذج User

```prisma
model User {
  id            Int       @id @default(autoincrement())
  universityId  String    @unique
  email         String    @unique
  password      String
  firstName     String
  lastName      String
  role          UserRole  @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  coursesCreated Course[] @relation("CourseCreator")
  enrollments   CourseEnrollment[]

  @@map("users")
}
```

### أمثلة على الاستعلامات

#### 1. إنشاء مستخدم جديد

```typescript
const user = await prisma.user.create({
  data: {
    universityId: "12345678",
    email: "student@university.edu",
    password: hashedPassword,
    firstName: "أحمد",
    lastName: "محمد",
    role: "STUDENT",
  },
});
```

#### 2. البحث عن مستخدم

```typescript
// بالـ ID
const user = await prisma.user.findUnique({
  where: { id: 1 },
});

// بالـ universityId
const user = await prisma.user.findUnique({
  where: { universityId: "12345678" },
});

// بالـ email
const user = await prisma.user.findUnique({
  where: { email: "student@university.edu" },
});
```

#### 3. إنشاء كورس جديد

```typescript
const course = await prisma.course.create({
  data: {
    courseCode: "CS101",
    courseName: "مقدمة في علوم الحاسب",
    description: "كورس تمهيدي",
    credits: 3,
    professorId: 1,
    isActive: true,
  },
  include: {
    professor: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  },
});
```

#### 4. الحصول على جميع الكورسات

```typescript
const courses = await prisma.course.findMany({
  where: {
    isActive: true,
    professorId: 1, // فلترة حسب الأستاذ
  },
  include: {
    professor: true,
    enrollments: {
      where: { status: "ACTIVE" },
      include: {
        student: true,
      },
    },
    schedules: {
      where: { isActive: true },
    },
  },
  orderBy: {
    courseCode: "asc",
  },
});
```

#### 5. تحديث كورس

```typescript
const course = await prisma.course.update({
  where: { id: 1 },
  data: {
    courseName: "مقدمة في علوم الحاسب (محدث)",
    description: "وصف محدث",
    credits: 4,
  },
});
```

#### 6. حذف كورس (Soft Delete)

```typescript
const course = await prisma.course.update({
  where: { id: 1 },
  data: {
    isActive: false,
  },
});
```

#### 7. إنشاء سجل حضور

```typescript
const attendanceRecord = await prisma.attendanceRecord.create({
  data: {
    studentId: 2,
    courseId: 1,
    qrCodeId: 1,
    status: "PRESENT",
    location: {
      latitude: 30.0444,
      longitude: 31.2357,
    },
    deviceFingerprint: "abc123...",
    fraudScore: 0.1,
  },
  include: {
    student: true,
    course: true,
    qrCode: true,
  },
});
```

---

## Middleware

### 1. Auth Middleware

**الموقع**: `src/middleware/auth.middleware.ts`

**الوظيفة**: التحقق من JWT tokens وإضافة معلومات المستخدم إلى `req.user`

**الاستخدام**:

```typescript
import { AuthMiddleware } from "../middleware/auth.middleware";

// حماية route
router.get("/protected", AuthMiddleware.authenticate(), (req, res) => {
  // req.user متاح هنا
  res.json({ user: req.user });
});

// حماية route مع دور محدد
router.get(
  "/admin",
  AuthMiddleware.authenticate(),
  AuthMiddleware.requireAdmin(),
  (req, res) => {
    // فقط ADMIN يمكنه الوصول
  }
);
```

**الكود**:

```typescript
static authenticate() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // 1. استخراج Token من Header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      const token = authHeader.substring(7);

      // 2. التحقق من Token
      const payload = JWTUtils.verifyAccessToken(token);

      // 3. الحصول على المستخدم من قاعدة البيانات
      const user = await AuthService.getUserById(payload.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // 4. إضافة المستخدم إلى Request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  };
}
```

### 2. CORS Middleware

**الوظيفة**: السماح بطلبات من Frontend

**الإعداد**:

```typescript
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### 3. Rate Limiting Middleware

**الوظيفة**: تحديد عدد الطلبات المسموح بها

**الاستخدام**:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

app.use("/api/", limiter);
```

### 4. Body Parser Middleware

**الوظيفة**: تحليل JSON و URL-encoded bodies

**الإعداد**:

```typescript
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
```

---

## إدارة الأخطاء

### Global Error Handler

**الموقع**: `server/index.ts`

```typescript
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", error);

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
);
```

### Error Handling في Controllers

```typescript
static async createCourse(req: Request, res: Response): Promise<void> {
  try {
    // ... logic
  } catch (error: any) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course'
    });
  }
}
```

---

## Logging

### Morgan (HTTP Request Logging)

**الاستخدام**:

```typescript
import morgan from "morgan";

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
```

### Console Logging

```typescript
console.log("[AuthController] Login request received");
console.error("[Error] Failed to create course:", error);
```

### Structured Logging (مستقبلاً)

يمكن إضافة مكتبة مثل `winston` أو `pino` للـ logging المتقدم.

---

## Security Best Practices

1. **JWT Secrets**: استخدم secrets قوية وطويلة (32+ حرف)
2. **Password Hashing**: استخدم bcrypt مع 12 rounds على الأقل
3. **Rate Limiting**: طبق rate limiting على جميع الـ endpoints الحساسة
4. **Input Validation**: تحقق من جميع المدخلات
5. **SQL Injection**: استخدم Prisma (parameterized queries)
6. **CORS**: قيد CORS origins
7. **HTTPS**: استخدم HTTPS في الإنتاج
8. **Environment Variables**: لا تضع secrets في الكود

---

**آخر تحديث**: يناير 2025
