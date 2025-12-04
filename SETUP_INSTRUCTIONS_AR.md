# إعداد PostgreSQL مع Docker - دليل كامل 🚀

## ✅ ما تم إعداده

### 1. Docker Compose ✅

- **الملف:** `docker-compose.yml`
- **Container:** `smartcampus-db`
- **Image:** `postgres:15`
- **Port:** `5432:5432`
- **Volume:** إعداد حفظ البيانات

### 2. إعدادات البيئة (Environment)

- **الملف:** `.env` (يحتاج تحديث يدوي)
- **DATABASE_URL:** يجب أن يكون `postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public`

### 3. NPM Scripts ✅

- **الملف:** `package.json`
- تم إضافة: `db:start`, `db:stop`, `db:migrate`

### 4. Prisma Schema ✅

- **الملف:** `prisma/schema.prisma`
- تم إعداده بالفعل مع جميع النماذج اللازمة

## 🚀 البدء السريع

### الخطوة 1: تحديث ملف .env

افتح `.env` وتأكد من وجود:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random
BCRYPT_SALT_ROUNDS=12
```

**ملاحظة:** كلمة المرور هي `postgres` (وليس `postgres123`)

### الخطوة 2: تشغيل PostgreSQL

```bash
npm run db:start
```

أو:

```bash
docker-compose up -d
```

### الخطوة 3: انتظار PostgreSQL ليكون جاهزاً

انتظر 10-15 ثانية حتى يتم تهيئة PostgreSQL بالكامل.

### الخطوة 4: إنشاء Prisma Client

```bash
npm run db:generate
```

**ملاحظة:** إذا ظهرت أخطاء permission، أغلق IDE وأشغل الأمر من PowerShell جديد.

### الخطوة 5: إنشاء جداول قاعدة البيانات

**الخيار أ - Migrations (موصى به للإنتاج):**

```bash
npm run db:migrate
```

سيقوم هذا بـ:

1. إنشاء ملف migration
2. تطبيقه على قاعدة البيانات
3. إنشاء جميع الجداول

**الخيار ب - Quick Push (للبروتوتايب):**

```bash
npm run db:push
```

هذا يزامن Schema مباشرة دون إنشاء ملفات migration.

### الخطوة 6: التحقق من الإعداد

```bash
npm run db:studio
```

سيتم فتح Prisma Studio على `http://localhost:5555` حيث يمكنك:

- ✅ رؤية جميع الجداول
- ✅ عرض/تعديل البيانات
- ✅ التحقق من أن كل شيء يعمل

## 📋 تسلسل الإعداد الكامل

```bash
# 1. تشغيل PostgreSQL
npm run db:start

# 2. انتظر 10-15 ثانية

# 3. إنشاء Prisma Client
npm run db:generate

# 4. إنشاء الجداول
npm run db:migrate

# 5. التحقق (اختياري)
npm run db:studio
```

## 🎯 أوامر الاستخدام

### إدارة قاعدة البيانات:

```bash
# تشغيل PostgreSQL
npm run db:start

# إيقاف PostgreSQL
npm run db:stop

# عرض الحالة
docker-compose ps

# عرض السجلات
docker-compose logs -f postgres
```

### أوامر Prisma:

```bash
# إنشاء Client
npm run db:generate

# إنشاء وتطبيق migration
npm run db:migrate

# Quick push (بدون ملفات migration)
npm run db:push

# فتح Prisma Studio (GUI)
npm run db:studio

# إعادة تعيين قاعدة البيانات (⚠️ يحذف جميع البيانات)
npm run db:reset
```

## ✅ قائمة التحقق

- [ ] ملف Docker Compose موجود (`docker-compose.yml`)
- [ ] PostgreSQL container يعمل (`npm run db:start`)
- [ ] ملف `.env` يحتوي على `DATABASE_URL` الصحيح
- [ ] Prisma Client تم إنشاؤه (`npm run db:generate`)
- [ ] الجداول تم إنشاؤها (`npm run db:migrate`)
- [ ] يمكن عرض الجداول في Prisma Studio (`npm run db:studio`)

## 🔍 استكشاف الأخطاء

### Container لا يبدأ

```bash
# فحص السجلات
docker-compose logs postgres

# إعادة التشغيل
docker-compose restart
```

### خطأ Prisma Permission

أغلق IDE وأشغل الأوامر من PowerShell جديد.

### Port 5432 مستخدم بالفعل

```bash
# إيقاف container القديم
docker stop smart-campus-postgres
docker rm smart-campus-postgres

# ثم شغّل مع docker-compose
npm run db:start
```

### فشل الاتصال بقاعدة البيانات

1. تحقق من أن Container يعمل: `docker-compose ps`
2. تحقق من `.env` يحتوي على `DATABASE_URL` الصحيح
3. انتظر بضع ثواني إضافية (PostgreSQL يحتاج وقت للتهيئة)

### لا يمكن الاتصال بعد Migration

```bash
# التحقق من DATABASE_URL
cat .env | grep DATABASE_URL

# يجب أن يكون: postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public

# إعادة تشغيل container
npm run db:stop
npm run db:start
```

## 📊 تفاصيل قاعدة البيانات

- **Host:** localhost
- **Port:** 5432
- **Database:** smart_campus
- **Username:** postgres
- **Password:** postgres
- **Connection String:** `postgresql://postgres:postgres@localhost:5432/smart_campus`

## 🎉 جاهز!

بعد إكمال جميع الخطوات، يمكنك:

1. ✅ تشغيل backend: `node server/simple-auth-server.js`
2. ✅ تشغيل frontend: `npm run dev`
3. ✅ إنشاء حسابات من خلال نموذج التسجيل
4. ✅ استخدام قاعدة البيانات لجميع ميزات التطبيق

## 📝 ملاحظات مهمة

- ✅ البيانات تُحفظ في Docker volume (`postgres_data`)
- ✅ Container يعيد التشغيل تلقائياً إذا تم إعادة تشغيل Docker
- ✅ جميع نماذج Prisma الموجودة محفوظة
- ✅ لا توجد بيانات تجريبية - قاعدة البيانات تبدأ فارغة ونظيفة
- ✅ جاهزة للاستخدام في الإنتاج بعد تغيير JWT_SECRET

## 🔄 إعادة تعيين كل شيء

إذا كنت تريد البدء من جديد تماماً:

```bash
# إيقاف وإزالة كل شيء
docker-compose down -v

# البدء من جديد
npm run db:start
npm run db:migrate
```

## 🗄️ الحفظ الدائم للبيانات

البيانات تُحفظ في Docker volume اسمه `postgres_data`. هذا يعني:

- ✅ البيانات تبقى حتى لو أوقفت/أعدت تشغيل container
- ✅ البيانات تبقى حتى لو أعدت تشغيل Docker
- ❌ البيانات تُحذف فقط إذا شغّلت `docker-compose down -v`

## 🔐 الأمان

### كلمات المرور

- **PostgreSQL Password:** `postgres` (يمكن تغييره في `docker-compose.yml`)
- **JWT Secret:** يجب تغييره في الإنتاج (`JWT_SECRET` في `.env`)

### نصائح الأمان

1. ✅ غير `POSTGRES_PASSWORD` في `docker-compose.yml` للإنتاج
2. ✅ استخدم `JWT_SECRET` قوي وفريد في `.env`
3. ✅ لا تشارك ملف `.env` مع أحد
4. ✅ استخدم `docker-compose down -v` فقط عندما تريد حذف جميع البيانات

## 📚 الملفات المرجعية

- `docker-compose.yml` - إعدادات Docker
- `.env` - متغيرات البيئة
- `prisma/schema.prisma` - تعريف قاعدة البيانات
- `DOCKER_SETUP_COMPLETE.md` - التوثيق الكامل
- `SETUP_INSTRUCTIONS.md` - هذا الملف (بالعربية)

## 🆘 الدعم

إذا واجهت أي مشاكل:

1. ✅ تحقق من أن Container يعمل: `docker-compose ps`
2. ✅ تحقق من السجلات: `docker-compose logs postgres`
3. ✅ تحقق من `DATABASE_URL` في `.env`
4. ✅ تأكد من انتظار 10-15 ثانية بعد تشغيل Container

## ✅ الخلاصة

**كل شيء جاهز! فقط اتبع الخطوات أعلاه وستكون جاهزاً للبدء! 🚀**

---

### أوامر سريعة:

```bash
# تشغيل PostgreSQL
npm run db:start

# إنشاء الجداول
npm run db:generate
npm run db:migrate

# التحقق
npm run db:studio
```

**هذا كل شيء! استمتع باستخدام PostgreSQL مع Docker! 🎉**
