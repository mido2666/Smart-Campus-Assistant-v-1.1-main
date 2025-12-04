# حل مشكلة Docker - Fix Docker Error

## ❌ المشكلة

```
docker: error during connect: Head "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping":
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

## 🔍 السبب

**Docker Desktop غير قيد التشغيل.**

## ✅ الحل

### الطريقة 1: تشغيل Docker Desktop (الأسهل)

**1. افتح Docker Desktop:**

- ابحث في قائمة Start عن "Docker Desktop"
- أو اذهب إلى: `C:\Program Files\Docker\Docker\Docker Desktop.exe`
- شغّل Docker Desktop

**2. انتظر حتى يظهر Docker Desktop في System Tray:**

- انتظر حتى يظهر أيقونة Docker 🐳 في الأسفل بجوار الساعة
- سيظهر "Docker Desktop is running" عندما يكون جاهزاً

**3. بعد ذلك شغّل الأمر:**

```powershell
docker run --name smart-campus-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=smart_campus -p 5432:5432 -d postgres:15-alpine
```

### الطريقة 2: التحقق من Docker

```powershell
# تحقق من أن Docker يعمل
docker --version

# تحقق من الحالة
docker ps
```

إذا ظهر خطأ، فـ Docker Desktop غير قيد التشغيل.

### الطريقة 3: تشغيل Docker Desktop من PowerShell

```powershell
# تشغيل Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# انتظر 30-60 ثانية حتى يبدأ
Start-Sleep -Seconds 30

# تحقق من الحالة
docker ps
```

## 🚀 بعد تشغيل Docker Desktop

### الخطوة 1: شغّل PostgreSQL

```powershell
docker run --name smart-campus-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=smart_campus -p 5432:5432 -d postgres:15-alpine
```

### الخطوة 2: تحقق من التشغيل

```powershell
# تحقق من أن Container يعمل
docker ps

# يجب أن ترى smart-campus-postgres في القائمة
```

### الخطوة 3: أنشئ ملف .env

```powershell
# إنشاء ملف .env
@"
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/smart_campus?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
BCRYPT_SALT_ROUNDS=12
"@ | Out-File -FilePath .env -Encoding utf8
```

### الخطوة 4: أنشئ الجداول

```powershell
npm run db:generate
npm run db:push
```

## 🔄 إذا استمرت المشكلة

### 1. أعد تشغيل Docker Desktop

- اغلقه بالكامل من System Tray
- شغّله مرة أخرى

### 2. تحقق من Windows Features

```powershell
# تحقق من أن WSL2 مفعّل
wsl --version

# إذا لم يكن مثبت، ثبّته من Microsoft Store أو Windows Features
```

### 3. أعد تشغيل الكمبيوتر

أحياناً يحتاج Docker Desktop إعادة تشغيل النظام.

## 📝 ملاحظات

- ✅ Docker Desktop يحتاج وقت للبدء (30-60 ثانية)
- ✅ تأكد من أن Docker Desktop يعمل قبل تشغيل الأوامر
- ✅ تحقق من System Tray لأيقونة Docker 🐳

## 🆘 إذا لم يكن Docker Desktop مثبت

### تثبيت Docker Desktop:

1. حمّل من: https://www.docker.com/products/docker-desktop/
2. ثبت Docker Desktop
3. أعد تشغيل الكمبيوتر
4. شغّل Docker Desktop

## ✅ البديل: تثبيت PostgreSQL مباشرة

إذا لم تريد استخدام Docker، يمكنك تثبيت PostgreSQL مباشرة:

1. حمّل PostgreSQL من: https://www.postgresql.org/download/windows/
2. ثبت PostgreSQL
3. أنشئ قاعدة بيانات `smart_campus`
4. غيّر `DATABASE_URL` في `.env`
