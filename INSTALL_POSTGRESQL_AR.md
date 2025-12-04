# تثبيت PostgreSQL - Install PostgreSQL

## ✅ النتيجة

**PostgreSQL غير مثبت على جهازك.**

## 🔧 طرق التثبيت

### الطريقة 1: تثبيت PostgreSQL مباشرة (Recommended)

#### Windows:

**1. تحميل PostgreSQL:**

- اذهب إلى: https://www.postgresql.org/download/windows/
- أو استخدم PostgreSQL Installer: https://www.postgresql.org/download/windows/
- حمّل **PostgreSQL 15** أو أحدث

**2. التثبيت:**

1. شغّل الملف `.exe` الذي حمّلته
2. اتبع خطوات التثبيت
3. احفظ كلمة المرور التي ستضعها لـ `postgres` user (ستحتاجها لاحقاً)
4. اختار Port 5432 (الافتراضي)
5. اترك باقي الإعدادات كما هي

**3. التحقق من التثبيت:**

افتح PowerShell واكتب:

```powershell
# التحقق من التثبيت
psql --version

# إذا ظهرت رسالة خطأ، أضف PostgreSQL إلى PATH:
# C:\Program Files\PostgreSQL\15\bin
```

**4. إنشاء قاعدة البيانات:**

```powershell
# الاتصال بـ PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE smart_campus;

# الخروج
\q
```

### الطريقة 2: استخدام Docker (أسهل وأسرع)

#### خطوات التثبيت:

**1. تحميل Docker Desktop:**

- اذهب إلى: https://www.docker.com/products/docker-desktop/
- حمّل Docker Desktop لـ Windows
- ثبت Docker Desktop

**2. تشغيل PostgreSQL في Docker:**

```powershell
# شغّل PostgreSQL container
docker run --name smart-campus-postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=smart_campus `
  -p 5432:5432 `
  -d postgres:15-alpine

# التحقق من التشغيل
docker ps
```

**3. التحقق من الاتصال:**

```powershell
# الاتصال بقاعدة البيانات
docker exec -it smart-campus-postgres psql -U postgres -d smart_campus
```

## 🔧 إعداد المشروع

### بعد تثبيت PostgreSQL:

**1. إنشاء ملف `.env`:**

```bash
# في جذر المشروع
copy .env.example .env
# أو أنشئ ملف .env جديد
```

**2. تعديل ملف `.env`:**

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/smart_campus?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
BCRYPT_SALT_ROUNDS=12
```

**ملاحظة:** استبدل `postgres123` بكلمة المرور التي وضعتها أثناء التثبيت.

**3. إنشاء الجداول:**

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

**4. التحقق:**

```bash
# فتح Prisma Studio (GUI لقاعدة البيانات)
npm run db:studio
```

سيتم فتح المتصفح على `http://localhost:5555` حيث يمكنك رؤية قاعدة البيانات.

## 📋 ملخص الخطوات

### إذا اخترت التثبيت المباشر:

1. ✅ حمّل PostgreSQL من الموقع الرسمي
2. ✅ ثبت PostgreSQL
3. ✅ احفظ كلمة المرور
4. ✅ أنشئ قاعدة بيانات `smart_campus`
5. ✅ أنشئ ملف `.env` وأضف `DATABASE_URL`
6. ✅ شغّل `npm run db:generate` و `npm run db:push`

### إذا اخترت Docker:

1. ✅ ثبت Docker Desktop
2. ✅ شغّل `docker run` command (كما هو موضح أعلاه)
3. ✅ أنشئ ملف `.env` وأضف `DATABASE_URL`
4. ✅ شغّل `npm run db:generate` و `npm run db:push`

## 🔍 التحقق من التثبيت

### الطريقة 1: Command Line

```powershell
# إذا ثبتت PostgreSQL مباشرة
psql --version

# إذا استخدمت Docker
docker ps
docker exec -it smart-campus-postgres psql --version
```

### الطريقة 2: اختبار الاتصال

```powershell
# اختبار الاتصال
Test-NetConnection -ComputerName localhost -Port 5432

# إذا نجح، سترى: TcpTestSucceeded : True
```

### الطريقة 3: استخدام Prisma Studio

```bash
npm run db:studio
```

إذا فتح المتصفح وظهرت قاعدة البيانات، فالتثبيت نجح! ✅

## ⚠️ مشاكل محتملة

### 1. Port 5432 مستخدم

**الحل:**

```powershell
# إذا استخدمت Docker، غيّر Port:
docker run --name smart-campus-postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=smart_campus `
  -p 5433:5432 `  # غيّر Port إلى 5433
  -d postgres:15-alpine

# ثم غيّر DATABASE_URL في .env:
# DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/smart_campus?schema=public"
```

### 2. كلمة المرور خطأ

**الحل:**

- إذا نسيت كلمة المرور، يمكنك إعادة تعيينها في PostgreSQL
- أو استخدم Docker وابدأ من جديد

### 3. قاعدة البيانات غير موجودة

**الحل:**

```powershell
# إنشاء قاعدة البيانات
psql -U postgres -c "CREATE DATABASE smart_campus;"

# أو باستخدام Docker:
docker exec -it smart-campus-postgres psql -U postgres -c "CREATE DATABASE smart_campus;"
```

## ✅ بعد التثبيت

بعد تثبيت PostgreSQL بنجاح:

1. ✅ أنشئ ملف `.env` مع `DATABASE_URL`
2. ✅ شغّل `npm run db:generate`
3. ✅ شغّل `npm run db:push`
4. ✅ اختبر بـ `npm run db:studio`

## 📝 ملاحظات مهمة

- ✅ استخدم **Docker** إذا كنت تريد إعداد أسهل وأسرع
- ✅ استخدم **التثبيت المباشر** إذا كنت تريد أداء أفضل
- ✅ احفظ كلمة المرور في مكان آمن
- ✅ لا تشارك ملف `.env` مع أحد

## 🆘 المساعدة

إذا واجهت أي مشاكل:

1. ✅ تحقق من أن PostgreSQL يعمل
2. ✅ تحقق من Port 5432 متاح
3. ✅ تحقق من `DATABASE_URL` في `.env` صحيح
4. ✅ تحقق من كلمة المرور صحيحة
