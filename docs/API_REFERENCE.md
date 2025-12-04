# 📡 مرجع API - Smart Campus Assistant

## Base URL

**Development**: `http://localhost:3001/api`

**Production**: `https://your-domain.com/api`

---

## Authentication

جميع الطلبات المصادقة تتطلب Header التالي:

```
Authorization: Bearer <accessToken>
```

---

## Endpoints

### Authentication

#### POST `/api/auth/register`

تسجيل مستخدم جديد.

**Request Body**:

```json
{
  "universityId": "12345678",
  "email": "student@university.edu",
  "password": "123456",
  "firstName": "أحمد",
  "lastName": "محمد",
  "role": "student"
}
```

**Response** (201):

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

**cURL Example**:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "12345678",
    "email": "student@university.edu",
    "password": "123456",
    "firstName": "أحمد",
    "lastName": "محمد",
    "role": "student"
  }'
```

---

#### POST `/api/auth/login`

تسجيل الدخول.

**Request Body**:

```json
{
  "universityId": "12345678",
  "password": "123456"
}
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "universityId": "12345678",
    "password": "123456"
  }'
```

---

#### POST `/api/auth/refresh`

تجديد Access Token.

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

#### POST `/api/auth/logout`

تسجيل الخروج.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response** (200):

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

---

#### GET `/api/auth/me`

الحصول على معلومات المستخدم الحالي.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

### Courses

#### GET `/api/courses`

الحصول على جميع الكورسات.

**Query Parameters**:

- `professorId` (optional): فلترة حسب الأستاذ
- `isActive` (optional): فلترة حسب الحالة

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X GET "http://localhost:3001/api/courses?professorId=1&isActive=true" \
  -H "Authorization: Bearer <accessToken>"
```

---

#### POST `/api/courses`

إنشاء كورس جديد.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Request Body**:

```json
{
  "courseCode": "CS101",
  "courseName": "مقدمة في علوم الحاسب",
  "description": "كورس تمهيدي",
  "credits": 3
}
```

**Response** (201):

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

**cURL Example**:

```bash
curl -X POST http://localhost:3001/api/courses \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "CS101",
    "courseName": "مقدمة في علوم الحاسب",
    "description": "كورس تمهيدي",
    "credits": 3
  }'
```

**Required Role**: PROFESSOR أو ADMIN

---

#### GET `/api/courses/:id`

الحصول على كورس محدد.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X GET http://localhost:3001/api/courses/1 \
  -H "Authorization: Bearer <accessToken>"
```

---

#### PUT `/api/courses/:id`

تحديث كورس.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Request Body**:

```json
{
  "courseName": "مقدمة في علوم الحاسب (محدث)",
  "description": "وصف محدث",
  "credits": 4
}
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X PUT http://localhost:3001/api/courses/1 \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "مقدمة في علوم الحاسب (محدث)",
    "description": "وصف محدث",
    "credits": 4
  }'
```

**Required Role**: PROFESSOR (مالك الكورس فقط) أو ADMIN

---

#### DELETE `/api/courses/:id`

حذف كورس (soft delete).

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response** (200):

```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**cURL Example**:

```bash
curl -X DELETE http://localhost:3001/api/courses/1 \
  -H "Authorization: Bearer <accessToken>"
```

**Required Role**: PROFESSOR (مالك الكورس فقط) أو ADMIN

---

### Attendance

#### POST `/api/attendance/mark`

تسجيل الحضور.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Request Body**:

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

**Response** (200):

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

**cURL Example**:

```bash
curl -X POST http://localhost:3001/api/attendance/mark \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCodeId": 1,
    "location": {
      "latitude": 30.0444,
      "longitude": 31.2357
    },
    "deviceFingerprint": "abc123...",
    "photoUrl": "https://example.com/photo.jpg"
  }'
```

**Required Role**: STUDENT

---

#### GET `/api/attendance/sessions`

الحصول على جلسات الحضور.

**Query Parameters**:

- `courseId` (optional): فلترة حسب الكورس
- `professorId` (optional): فلترة حسب الأستاذ

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X GET "http://localhost:3001/api/attendance/sessions?courseId=1" \
  -H "Authorization: Bearer <accessToken>"
```

---

### Schedule

#### GET `/api/schedule`

الحصول على الجداول الزمنية.

**Query Parameters**:

- `courseId` (optional): فلترة حسب الكورس
- `professorId` (optional): فلترة حسب الأستاذ
- `dayOfWeek` (optional): فلترة حسب اليوم (0-6)

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Response** (200):

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

**cURL Example**:

```bash
curl -X GET "http://localhost:3001/api/schedule?courseId=1&dayOfWeek=1" \
  -H "Authorization: Bearer <accessToken>"
```

---

#### POST `/api/schedule`

إنشاء جدول زمني جديد.

**Headers**:

```
Authorization: Bearer <accessToken>
```

**Request Body**:

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

**Response** (201):

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

**cURL Example**:

```bash
curl -X POST http://localhost:3001/api/schedule \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": 1,
    "dayOfWeek": 1,
    "startTime": "10:00",
    "endTime": "12:00",
    "room": "قاعة 101",
    "semester": "Fall 2024"
  }'
```

**Required Role**: PROFESSOR أو ADMIN

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid input data"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access token is required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied. Professor or Admin role required."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Course not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

بعض الـ endpoints لديها rate limiting:

- **Registration**: 3 محاولات كل 15 دقيقة
- **Login**:
  - Development: 10 محاولات كل 15 دقيقة
  - Production: 5 محاولات كل 15 دقيقة

عند تجاوز الحد:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Pagination

بعض الـ endpoints تدعم pagination (مستقبلاً):

```
GET /api/courses?page=1&limit=10
```

**Response**:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

**آخر تحديث**: يناير 2025
