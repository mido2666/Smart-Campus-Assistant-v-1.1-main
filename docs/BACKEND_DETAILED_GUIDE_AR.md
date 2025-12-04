# 🔧 دليل الباك-إند المفصل - كيف يعمل الـ API خطوة بخطوة

## 📚 المحتويات

1. [نظرة عامة على الباك-إند](#نظرة-عامة-على-الباك-إند)
2. [كيف يبدأ السيرفر](#كيف-يبدأ-السيرفر)
3. [كيف يعمل الـ API من البداية للنهاية](#كيف-يعمل-الـ-api-من-البداية-للنهاية)
4. [تدفق الطلب الكامل (Request Flow)](#تدفق-الطلب-الكامل-request-flow)
5. [مثال عملي: إنشاء كورس جديد](#مثال-عملي-إنشاء-كورس-جديد)
6. [مثال عملي: تسجيل الدخول](#مثال-عملي-تسجيل-الدخول)
7. [كيف تعمل المصادقة (Authentication)](#كيف-تعمل-المصادقة-authentication)
8. [كيف تعمل قاعدة البيانات مع Prisma](#كيف-تعمل-قاعدة-البيانات-مع-prisma)
9. [Middleware وكيف تعمل](#middleware-وكيف-تعمل)
10. [إدارة الأخطاء](#إدارة-الأخطاء)

---

## نظرة عامة على الباك-إند

### ما هو الباك-إند؟

الباك-إند هو الجزء الذي يعمل على السيرفر ويتعامل مع:

- ✅ استقبال الطلبات من Frontend
- ✅ التحقق من صحة البيانات
- ✅ التعامل مع قاعدة البيانات
- ✅ إرسال الردود للـ Frontend

### البنية الأساسية

```
Frontend (React)
    ↓ HTTP Request
Backend (Express.js)
    ↓ Prisma ORM
Database (PostgreSQL)
    ↓ Response
Backend
    ↓ JSON Response
Frontend
```

---

## كيف يبدأ السيرفر

### 1. ملف البداية: `server/index.ts`

عند تشغيل `npm run server:dev`، يحدث التالي:

```typescript
// 1. تحميل المكتبات
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 2. تحميل متغيرات البيئة من ملف .env
dotenv.config();

// 3. إنشاء تطبيق Express
const app = express();

// 4. تحديد المنفذ (Port)
const PORT = process.env.PORT || 3001;
```

### 2. إعداد Middleware

```typescript
// Middleware للسماح بطلبات من Frontend (CORS)
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);

// Middleware لقراءة JSON من الطلبات
app.use(express.json({ limit: "10mb" }));

// Middleware لقراءة URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Middleware لتسجيل الطلبات (Logging)
app.use(morgan("dev"));
```

### 3. تسجيل Routes

```typescript
// تسجيل routes للمصادقة
app.use("/api/auth", authRouter);

// تسجيل routes للكورسات
app.use("/api/courses", courseRouter);

// تسجيل routes للحضور
app.use("/api/attendance", attendanceRouter);
```

### 4. بدء السيرفر

```typescript
// بدء الاستماع على المنفذ
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
});
```

**النتيجة**: السيرفر الآن يستمع على `http://localhost:3001` وجاهز لاستقبال الطلبات!

---

## كيف يعمل الـ API من البداية للنهاية

### الخطوات الكاملة لمعالجة طلب API

```
1. Frontend يرسل Request
   ↓
2. Express يستقبل Request
   ↓
3. Middleware يعالج Request
   (CORS, Body Parser, Auth)
   ↓
4. Route Handler يستقبل Request
   ↓
5. Controller يعالج Request
   ↓
6. Service ينفذ المنطق
   ↓
7. Prisma يتعامل مع Database
   ↓
8. Service يرجع البيانات
   ↓
9. Controller يرجع Response
   ↓
10. Express يرسل Response
   ↓
11. Frontend يستقبل Response
```

---

## تدفق الطلب الكامل (Request Flow)

### مثال: GET `/api/courses`

دعنا نتبع طلب من Frontend للحصول على جميع الكورسات:

#### الخطوة 1: Frontend يرسل Request

```typescript
// في Frontend (React)
const response = await apiClient.get("/api/courses", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

**ما يحدث**:

- Frontend يرسل HTTP GET request إلى `http://localhost:3001/api/courses`
- يضيف Header للـ Authorization مع JWT token

#### الخطوة 2: Express يستقبل Request

```typescript
// server/index.ts
app.use("/api/courses", courseRouter);
```

**ما يحدث**:

- Express يستقبل Request على المسار `/api/courses`
- يبحث عن Route مطابق في `courseRouter`

#### الخطوة 3: Route Handler

```typescript
// src/routes/course.routes.ts
router.get("/", CourseController.getAllCourses);
```

**ما يحدث**:

- Route handler يجد المسار `/` (يعني `/api/courses`)
- يستدعي `CourseController.getAllCourses`

#### الخطوة 4: Auth Middleware

```typescript
// src/routes/course.routes.ts
router.use(AuthMiddleware.authenticate());
```

**ما يحدث قبل الوصول للـ Controller**:

1. Auth Middleware يتحقق من JWT token
2. إذا كان Token صالح، يضيف `req.user` إلى Request
3. إذا كان Token غير صالح، يرسل 401 Unauthorized

```typescript
// src/middleware/auth.middleware.ts
static authenticate() {
  return async (req, res, next) => {
    // 1. استخراج Token من Header
    const token = req.headers.authorization?.split(' ')[1];

    // 2. التحقق من Token
    const payload = JWTUtils.verifyAccessToken(token);

    // 3. الحصول على المستخدم من Database
    const user = await AuthService.getUserById(payload.userId);

    // 4. إضافة المستخدم إلى Request
    req.user = user;

    // 5. الانتقال للخطوة التالية
    next();
  };
}
```

#### الخطوة 5: Controller

```typescript
// src/controllers/course.controller.ts
static async getAllCourses(req: Request, res: Response): Promise<void> {
  try {
    // 1. استخراج Query Parameters (مثل professorId)
    const { professorId, isActive } = req.query;

    // 2. استدعاء Service للحصول على البيانات
    const courses = await CourseService.getAllCourses({
      professorId: professorId ? parseInt(professorId as string) : undefined,
      isActive: isActive === 'true' ? true : undefined
    });

    // 3. إرسال Response
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    // 4. معالجة الأخطاء
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
```

**ما يحدث**:

- Controller يستقبل Request مع `req.user` (من Auth Middleware)
- يستخرج Query Parameters
- يستدعي Service للحصول على البيانات
- يرسل Response

#### الخطوة 6: Service

```typescript
// src/services/course.service.ts
static async getAllCourses(filters?: {
  professorId?: number;
  isActive?: boolean;
}): Promise<Course[]> {
  // 1. بناء Where Clause للاستعلام
  const where: any = {};

  if (filters?.professorId) {
    where.professorId = filters.professorId;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  // 2. استعلام قاعدة البيانات باستخدام Prisma
  const courses = await prisma.course.findMany({
    where,
    include: {
      professor: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          student: true
        }
      },
      schedules: {
        where: { isActive: true }
      }
    },
    orderBy: {
      courseCode: 'asc'
    }
  });

  // 3. إرجاع النتائج
  return courses;
}
```

**ما يحدث**:

- Service يبني استعلام Prisma
- يستعلم قاعدة البيانات
- يرجع البيانات

#### الخطوة 7: Prisma يتعامل مع Database

```typescript
// Prisma يترجم الكود إلى SQL
// الكود السابق يترجم إلى:

SELECT
  c.*,
  u.id as professor_id,
  u.firstName as professor_firstName,
  u.lastName as professor_lastName,
  ...
FROM courses c
LEFT JOIN users u ON c.professorId = u.id
LEFT JOIN course_enrollments e ON c.id = e.courseId
WHERE c.professorId = ? AND c.isActive = ?
ORDER BY c.courseCode ASC
```

**ما يحدث**:

- Prisma يترجم JavaScript إلى SQL
- PostgreSQL ينفذ الاستعلام
- يرجع البيانات

#### الخطوة 8: Response يعود للـ Frontend

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "courseCode": "CS101",
      "courseName": "مقدمة في علوم الحاسب",
      "professor": {
        "id": 1,
        "firstName": "أحمد",
        "lastName": "السيد"
      },
      "enrollments": [...],
      "schedules": [...]
    }
  ]
}
```

---

## مثال عملي: إنشاء كورس جديد

دعنا نتبع طلب إنشاء كورس جديد من البداية للنهاية:

### الخطوة 1: Frontend يرسل Request

```typescript
// في Frontend
const response = await apiClient.post(
  "/api/courses",
  {
    courseCode: "CS101",
    courseName: "مقدمة في علوم الحاسب",
    description: "كورس تمهيدي",
    credits: 3,
  },
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

**HTTP Request**:

```
POST /api/courses HTTP/1.1
Host: localhost:3001
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "courseCode": "CS101",
  "courseName": "مقدمة في علوم الحاسب",
  "description": "كورس تمهيدي",
  "credits": 3
}
```

### الخطوة 2: Route Handler

```typescript
// src/routes/course.routes.ts

// 1. تطبيق Auth Middleware على جميع Routes
router.use(AuthMiddleware.authenticate());

// 2. التحقق من Role (PROFESSOR أو ADMIN فقط)
const requireProfessorOrAdmin = (req, res, next) => {
  if (req.user.role !== "PROFESSOR" && req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Professor or Admin role required.",
    });
  }
  next();
};

// 3. Route Handler
router.post("/", requireProfessorOrAdmin, CourseController.createCourse);
```

**ما يحدث**:

1. Auth Middleware يتحقق من Token
2. يتحقق من أن المستخدم PROFESSOR أو ADMIN
3. يستدعي Controller

### الخطوة 3: Controller

```typescript
// src/controllers/course.controller.ts
static async createCourse(req: any, res: Response): Promise<void> {
  try {
    // 1. استخراج البيانات من Request Body
    const { courseCode, courseName, description, credits } = req.body;

    // 2. التحقق من البيانات المطلوبة
    if (!courseCode || !courseName) {
      return res.status(400).json({
        success: false,
        message: 'Course code and course name are required'
      });
    }

    // 3. الحصول على professorId من المستخدم المصادق عليه
    const professorId = req.user.id;

    // 4. استدعاء Service لإنشاء الكورس
    const course = await CourseService.createCourse({
      courseCode,
      courseName,
      description: description || '',
      credits: credits || 3,
      professorId: typeof professorId === 'string' ? parseInt(professorId) : professorId
    });

    // 5. إرسال Response
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error: any) {
    // 6. معالجة الأخطاء
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course'
    });
  }
}
```

**ما يحدث**:

- Controller يتحقق من البيانات
- يستدعي Service

### الخطوة 4: Service

```typescript
// src/services/course.service.ts
static async createCourse(data: CreateCourseData): Promise<Course> {
  try {
    // 1. التحقق من أن المستخدم أستاذ
    const professor = await prisma.user.findUnique({
      where: { id: data.professorId }
    });

    if (!professor || (professor.role !== 'PROFESSOR' && professor.role !== 'ADMIN')) {
      throw new Error('User is not authorized to create courses');
    }

    // 2. التحقق من عدم وجود كورس بنفس الكود
    const existingCourse = await prisma.course.findUnique({
      where: { courseCode: data.courseCode }
    });

    if (existingCourse) {
      throw new Error('Course with this code already exists');
    }

    // 3. إنشاء الكورس في قاعدة البيانات
    const course = await prisma.course.create({
      data: {
        courseCode: data.courseCode,
        courseName: data.courseName,
        description: data.description,
        credits: data.credits || 3,
        professorId: data.professorId,
        isActive: true
      },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        enrollments: true,
        schedules: true
      }
    });

    // 4. إرجاع الكورس المنشأ
    return course;
  } catch (error) {
    throw error;
  }
}
```

**ما يحدث**:

- Service يتحقق من الصلاحيات
- يتحقق من البيانات
- ينشئ الكورس في قاعدة البيانات
- يرجع الكورس المنشأ

### الخطوة 5: Prisma ينفذ الاستعلام

```typescript
// Prisma يترجم الكود إلى SQL:

INSERT INTO courses (
  "courseCode",
  "courseName",
  "description",
  "credits",
  "professorId",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'CS101',
  'مقدمة في علوم الحاسب',
  'كورس تمهيدي',
  3,
  1,
  true,
  NOW(),
  NOW()
) RETURNING *;
```

### الخطوة 6: Response

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
    "createdAt": "2025-01-01T10:00:00.000Z",
    "professor": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "السيد"
    }
  }
}
```

---

## مثال عملي: تسجيل الدخول

### الخطوة 1: Frontend يرسل Request

```typescript
// Frontend
const response = await apiClient.post("/api/auth/login", {
  universityId: "12345678",
  password: "123456",
});
```

### الخطوة 2: Route Handler

```typescript
// src/routes/auth.routes.ts
authRouter.post("/login", loginRateLimit, AuthController.login);
```

**ملاحظة**: لا يوجد Auth Middleware هنا لأن تسجيل الدخول endpoint عام (public)

### الخطوة 3: Controller

```typescript
// src/controllers/auth.controller.ts
static async login(req: Request, res: Response): Promise<void> {
  try {
    // 1. استخراج البيانات
    const { universityId, password } = req.body;

    // 2. التحقق من البيانات
    if (!universityId || !password) {
      return res.status(400).json({
        success: false,
        message: 'University ID and password are required'
      });
    }

    // 3. استدعاء Service
    const result = await AuthService.login({
      universityId,
      password
    });

    // 4. إرسال Response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid credentials'
    });
  }
}
```

### الخطوة 4: Service

```typescript
// src/services/auth.service.ts
static async login(data: LoginRequest): Promise<AuthResponse> {
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

  // 3. إنشاء Access Token
  const accessToken = JWTUtils.generateAccessToken({
    userId: user.id.toString(),
    role: user.role.toLowerCase()
  });

  // 4. إنشاء Refresh Token
  const refreshToken = JWTUtils.generateRefreshToken({
    userId: user.id.toString(),
    tokenVersion: user.tokenVersion
  });

  // 5. حفظ Refresh Token في قاعدة البيانات
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  // 6. إرجاع النتيجة
  return {
    user: {
      id: user.id.toString(),
      universityId: user.universityId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase()
    },
    accessToken,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes in seconds
  };
}
```

**ما يحدث**:

1. البحث عن المستخدم
2. التحقق من كلمة المرور باستخدام bcrypt
3. إنشاء JWT tokens
4. حفظ Refresh Token
5. إرجاع النتيجة

### الخطوة 5: Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "universityId": "12345678",
      "email": "student@university.edu",
      "firstName": "أحمد",
      "lastName": "محمد",
      "role": "student"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

## كيف تعمل المصادقة (Authentication)

### 1. إنشاء JWT Token

```typescript
// src/utils/jwt.ts
static generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m', // 15 دقيقة
      issuer: 'smart-campus-assistant',
      audience: 'smart-campus-users'
    }
  );
}
```

**ما يحدث**:

- JWT يحتوي على: `userId`, `role`, `exp` (expiration time)
- التوقيع باستخدام `JWT_SECRET`
- مدة الصلاحية: 15 دقيقة

### 2. التحقق من JWT Token

```typescript
// src/utils/jwt.ts
static verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}
```

**ما يحدث**:

- التحقق من صحة التوقيع
- التحقق من انتهاء الصلاحية
- إرجاع البيانات (payload)

### 3. Auth Middleware

```typescript
// src/middleware/auth.middleware.ts
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

      const token = authHeader.substring(7); // إزالة "Bearer "

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

      // 5. الانتقال للخطوة التالية
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

---

## كيف تعمل قاعدة البيانات مع Prisma

### 1. Prisma Client

```typescript
// config/database.ts
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

export default prisma;
```

### 2. استعلامات Prisma

#### Create (إنشاء)

```typescript
const course = await prisma.course.create({
  data: {
    courseCode: "CS101",
    courseName: "مقدمة في علوم الحاسب",
    professorId: 1,
  },
});
```

**SQL المقابل**:

```sql
INSERT INTO courses (courseCode, courseName, professorId)
VALUES ('CS101', 'مقدمة في علوم الحاسب', 1)
RETURNING *;
```

#### Read (قراءة)

```typescript
// Find Unique (بحث عن واحد)
const course = await prisma.course.findUnique({
  where: { id: 1 },
});

// Find Many (بحث عن عدة)
const courses = await prisma.course.findMany({
  where: { isActive: true },
});
```

**SQL المقابل**:

```sql
SELECT * FROM courses WHERE id = 1;
SELECT * FROM courses WHERE isActive = true;
```

#### Update (تحديث)

```typescript
const course = await prisma.course.update({
  where: { id: 1 },
  data: {
    courseName: "مقدمة في علوم الحاسب (محدث)",
  },
});
```

**SQL المقابل**:

```sql
UPDATE courses
SET courseName = 'مقدمة في علوم الحاسب (محدث)'
WHERE id = 1
RETURNING *;
```

#### Delete (حذف)

```typescript
// Hard Delete
await prisma.course.delete({
  where: { id: 1 },
});

// Soft Delete (الأفضل)
await prisma.course.update({
  where: { id: 1 },
  data: { isActive: false },
});
```

### 3. Relations (العلاقات)

```typescript
// Include Relations
const course = await prisma.course.findUnique({
  where: { id: 1 },
  include: {
    professor: true, // إحضار بيانات الأستاذ
    enrollments: {
      include: {
        student: true, // إحضار بيانات الطلاب
      },
    },
  },
});
```

**SQL المقابل**:

```sql
SELECT
  c.*,
  u.* as professor,
  e.* as enrollments,
  s.* as student
FROM courses c
LEFT JOIN users u ON c.professorId = u.id
LEFT JOIN course_enrollments e ON c.id = e.courseId
LEFT JOIN users s ON e.studentId = s.id
WHERE c.id = 1;
```

---

## Middleware وكيف تعمل

### 1. CORS Middleware

```typescript
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);
```

**ما يحدث**:

- يضيف Headers للسماح بطلبات من Frontend
- يسمح بإرسال Cookies (credentials)

**Headers المضافة**:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

### 2. Body Parser Middleware

```typescript
app.use(express.json({ limit: "10mb" }));
```

**ما يحدث**:

- يحول JSON body إلى JavaScript object
- يضيفه إلى `req.body`

**مثال**:

```json
// Request Body
{
  "courseCode": "CS101"
}

// يصبح في req.body
req.body = {
  courseCode: "CS101"
}
```

### 3. Auth Middleware

راجع قسم [كيف تعمل المصادقة](#كيف-تعمل-المصادقة-authentication)

### 4. Error Handler Middleware

```typescript
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});
```

**ما يحدث**:

- يلتقط جميع الأخطاء
- يرسل Response مناسب
- في Development، يرسل stack trace

---

## إدارة الأخطاء

### 1. Errors في Controller

```typescript
try {
  const course = await CourseService.createCourse(data);
  res.status(201).json({
    success: true,
    data: course,
  });
} catch (error) {
  // معالجة الخطأ
  res.status(500).json({
    success: false,
    message: error.message,
  });
}
```

### 2. Errors في Service

```typescript
static async createCourse(data: CreateCourseData) {
  // التحقق من البيانات
  if (!data.courseCode) {
    throw new Error('Course code is required');
  }

  // التحقق من الصلاحيات
  const user = await prisma.user.findUnique({
    where: { id: data.professorId }
  });

  if (!user || user.role !== 'PROFESSOR') {
    throw new Error('User is not authorized');
  }

  // إنشاء الكورس
  return await prisma.course.create({ data });
}
```

### 3. Global Error Handler

```typescript
app.use((error, req, res, next) => {
  console.error("Error:", error);

  // خطأ في المصادقة
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // خطأ في قاعدة البيانات
  if (error.code === "P2002") {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry",
    });
  }

  // خطأ عام
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});
```

---

## ملخص

### التدفق الكامل

1. **Frontend** → يرسل HTTP Request
2. **Express** → يستقبل Request
3. **Middleware** → يعالج Request (CORS, Auth, Body Parser)
4. **Route** → يوجه Request للـ Controller المناسب
5. **Controller** → يستدعي Service
6. **Service** → ينفذ المنطق ويستعلم قاعدة البيانات
7. **Prisma** → يترجم إلى SQL وينفذ الاستعلام
8. **Database** → يرجع البيانات
9. **Service** → يرجع البيانات للـ Controller
10. **Controller** → يرسل Response
11. **Express** → يرسل HTTP Response
12. **Frontend** → يستقبل Response

### المكونات الرئيسية

- **Express**: إطار عمل الويب
- **Routes**: توجيه الطلبات
- **Controllers**: معالجة الطلبات
- **Services**: المنطق التجاري
- **Prisma**: ORM للتعامل مع قاعدة البيانات
- **Middleware**: معالجة قبل الوصول للـ Routes
- **JWT**: المصادقة
- **Bcrypt**: تشفير كلمات المرور

---

**آخر تحديث**: يناير 2025
