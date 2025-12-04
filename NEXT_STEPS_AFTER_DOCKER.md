# الخطوات التالية بعد تشغيل Docker Desktop 🚀

## ✅ الخطوات بالترتيب

### الخطوة 1: التحقق من أن Docker يعمل

```powershell
docker ps
```

**إذا ظهرت قائمة (حتى لو فارغة)، فـ Docker يعمل! ✅**

### الخطوة 2: تشغيل PostgreSQL Container

```powershell
docker run --name smart-campus-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=smart_campus -p 5432:5432 -d postgres:15-alpine
```

**النتيجة المتوقعة:**

- سترى hash طويل (مثل: `a1b2c3d4e5f6...`)
- هذا يعني أن Container تم إنشاؤه بنجاح ✅

### الخطوة 3: التحقق من التشغيل

```powershell
docker ps
```

**يجب أن ترى:**

```
NAMES                  STATUS          PORTS
smart-campus-postgres  Up X seconds    0.0.0.0:5432->5432/tcp
```

### الخطوة 4: إنشاء ملف `.env`

```powershell
@"
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/smart_campus?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
BCRYPT_SALT_ROUNDS=12
"@ | Out-File -FilePath .env -Encoding utf8
```

**للتحقق:**

```powershell
Get-Content .env
```

### الخطوة 5: إنشاء Prisma Client

```powershell
npm run db:generate
```

**النتيجة المتوقعة:**

- `✔ Generated Prisma Client`
- لا توجد أخطاء ✅

### الخطوة 6: إنشاء الجداول في قاعدة البيانات

```powershell
npm run db:push
```

**النتيجة المتوقعة:**

- `✔ Your database is now in sync with your Prisma schema`
- لا توجد أخطاء ✅

### الخطوة 7: التحقق من قاعدة البيانات (اختياري)

```powershell
npm run db:studio
```

**سيتم فتح المتصفح على:** `http://localhost:5555`

يمكنك:

- ✅ رؤية جدول `users`
- ✅ إضافة/تعديل/حذف البيانات

### الخطوة 8: تشغيل Backend Server

```powershell
node server/simple-auth-server.js
```

**النتيجة المتوقعة:**

```
🚀 Smart Campus Assistant API server listening on http://localhost:3001
📝 Available endpoints:
   - Authentication: http://localhost:3001/api/auth
   - Health Check: http://localhost:3001/api/auth/health
   - Chat: http://localhost:3001/api/chat
```

### الخطوة 9: تشغيل Frontend

```powershell
npm run dev
```

**سيتم فتح المتصفح على:** `http://localhost:5173`

### الخطوة 10: اختبار إنشاء حساب

1. افتح صفحة Login
2. اضغط "Create Account"
3. املأ النموذج:
   - Name: اختبار
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. اضغط "Create Account"
5. يجب أن ترى رسالة نجاح ✅

## 🔍 التحقق من كل شيء

### 1. Docker Container يعمل؟

```powershell
docker ps
```

### 2. قاعدة البيانات متاحة؟

```powershell
Test-NetConnection -ComputerName localhost -Port 5432
```

### 3. ملف .env موجود؟

```powershell
Test-Path .env
```

### 4. الجداول موجودة؟

```powershell
npm run db:studio
```

## ⚠️ مشاكل محتملة وحلولها

### مشكلة: Container موجود بالفعل

**الخطأ:**

```
Error response from daemon: Conflict. The container name "smart-campus-postgres" is already in use
```

**الحل:**

```powershell
# حذف Container القديم
docker rm -f smart-campus-postgres

# ثم شغّل الأمر مرة أخرى
docker run --name smart-campus-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=smart_campus -p 5432:5432 -d postgres:15-alpine
```

### مشكلة: Port 5432 مستخدم

**الخطأ:**

```
Error: bind: address already in use
```

**الحل:**

```powershell
# استخدام port آخر
docker run --name smart-campus-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=smart_campus -p 5433:5432 -d postgres:15-alpine

# ثم غيّر DATABASE_URL في .env إلى:
# DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/smart_campus?schema=public"
```

### مشكلة: قاعدة البيانات غير موجودة

**الحل:**

```powershell
# إنشاء قاعدة البيانات يدوياً
docker exec -it smart-campus-postgres psql -U postgres -c "CREATE DATABASE smart_campus;"
```

## ✅ Checklist النهائي

- [ ] Docker Desktop يعمل
- [ ] PostgreSQL Container يعمل (`docker ps`)
- [ ] ملف `.env` موجود وصحيح
- [ ] Prisma Client تم إنشاؤه (`npm run db:generate`)
- [ ] الجداول تم إنشاؤها (`npm run db:push`)
- [ ] Backend Server يعمل
- [ ] Frontend يعمل
- [ ] يمكن إنشاء حساب جديد

## 🎯 جاهز!

بعد إكمال جميع الخطوات، يمكنك:

- ✅ إنشاء حسابات جديدة
- ✅ تسجيل الدخول
- ✅ استخدام التطبيق بالكامل
