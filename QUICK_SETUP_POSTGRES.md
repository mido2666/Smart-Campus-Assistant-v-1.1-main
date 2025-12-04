# تثبيت PostgreSQL بسرعة باستخدام Docker 🚀

## ✅ Docker مثبت على جهازك!

يمكنك تثبيت PostgreSQL خلال دقائق باستخدام Docker.

## 🚀 التثبيت السريع (3 خطوات)

### الخطوة 1: تشغيل PostgreSQL Container

```powershell
docker run --name smart-campus-postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=smart_campus `
  -p 5432:5432 `
  -d postgres:15-alpine
```

### الخطوة 2: إنشاء ملف `.env`

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

### الخطوة 3: إنشاء الجداول

```powershell
npm run db:generate
npm run db:push
```

## ✅ التحقق من التثبيت

```powershell
# التحقق من أن Container يعمل
docker ps

# فتح Prisma Studio (GUI لقاعدة البيانات)
npm run db:studio
```

## 🎯 كل شيء جاهز!

بعد ذلك يمكنك:

- ✅ إنشاء حسابات جديدة من صفحة Login
- ✅ عرض البيانات من Prisma Studio
- ✅ استخدام التطبيق كالمعتاد
