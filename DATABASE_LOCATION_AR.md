# أين يتم حفظ البيانات؟ - Where Data is Stored

## 📍 موقع حفظ البيانات

البيانات تُحفظ في **PostgreSQL Database** على جهازك المحلي (أو على خادم إذا كنت تستخدم قاعدة بيانات سحابية).

## 🔧 إعداد قاعدة البيانات

### 1. قاعدة البيانات المحلية (Local Database)

#### خطوات الإعداد:

**أ) إعداد PostgreSQL:**

```bash
# إذا لم يكن PostgreSQL مثبت، يمكنك تثبيته أو استخدام Docker

# استخدام Docker (الأسهل):
docker run --name smart-campus-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=smart_campus \
  -p 5432:5432 \
  -d postgres:15-alpine
```

**ب) إعداد ملف `.env`:**

أنشئ ملف `.env` في جذر المشروع:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/smart_campus?schema=public"
```

**المكونات:**
- `postgres` - اسم المستخدم
- `yourpassword` - كلمة المرور
- `localhost` - عنوان الخادم
- `5432` - المنفذ (Port)
- `smart_campus` - اسم قاعدة البيانات
- `public` - Schema name

### 2. إنشاء الجداول (Tables)

بعد إعداد قاعدة البيانات، يجب إنشاء الجداول:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# أو استخدام Migrations
npm run db:migrate
```

## 📊 الجداول التي سيتم إنشاؤها

### جدول Users (المستخدمين)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  "universityId" VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  name VARCHAR,
  "firstName" VARCHAR NOT NULL,
  "lastName" VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'STUDENT',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**أين يتم الحفظ:**
- ✅ قاعدة البيانات: `smart_campus`
- ✅ الجدول: `users`
- ✅ الموقع: `localhost:5432` (على جهازك المحلي)

## 🔍 كيفية عرض البيانات

### 1. استخدام Prisma Studio (GUI)

```bash
npm run db:studio
```

سيتم فتح متصفح على `http://localhost:5555` حيث يمكنك:
- ✅ عرض جميع المستخدمين
- ✅ إضافة مستخدمين
- ✅ تعديل البيانات
- ✅ حذف البيانات

### 2. استخدام PostgreSQL Client

يمكنك استخدام أي PostgreSQL client مثل:
- **pgAdmin**
- **DBeaver**
- **Postico** (Mac)
- **DataGrip** (JetBrains)

**الاتصال:**
- Host: `localhost`
- Port: `5432`
- Database: `smart_campus`
- User: `postgres`
- Password: `yourpassword`

### 3. استخدام Command Line

```bash
# الاتصال بقاعدة البيانات
psql -U postgres -d smart_campus

# عرض جميع المستخدمين
SELECT * FROM users;

# عرض عدد المستخدمين
SELECT COUNT(*) FROM users;

# البحث عن مستخدم
SELECT * FROM users WHERE email = 'test@example.com';
```

## 📁 الملفات المهمة

### 1. Schema Definition

**الملف:** `prisma/schema.prisma`

يحدد هيكل قاعدة البيانات وجميع الجداول:

```prisma
model User {
  id                   Int                   @id @default(autoincrement())
  universityId         String                @unique
  email                String                @unique
  password             String
  name                 String?
  firstName            String
  lastName             String
  role                 UserRole              @default(STUDENT)
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
}
```

### 2. Database Connection

**الملف:** `config/database.ts`

يحتوي على إعدادات الاتصال بقاعدة البيانات:

```typescript
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

export default prisma;
```

### 3. Environment Variables

**الملف:** `.env`

يحتوي على معلومات الاتصال:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_campus?schema=public"
```

## 🗄️ مثال على حفظ البيانات

### عند إنشاء حساب جديد:

**1. المستخدم يملأ النموذج:**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "password123"
}
```

**2. الـ Backend يستقبل البيانات:**
```javascript
// server/simple-auth-server.js
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  // تشفير كلمة المرور
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // حفظ في قاعدة البيانات
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || name,
      universityId: generatedId,
      role: 'STUDENT'
    }
  });
});
```

**3. البيانات تُحفظ في:**
- **قاعدة البيانات:** PostgreSQL
- **الجدول:** `users`
- **الموقع الفعلي:** `localhost:5432/smart_campus`

## 🔐 الأمان

### تشفير كلمات المرور

كلمات المرور **مشفرة** قبل الحفظ باستخدام `bcrypt`:

```javascript
const hashedPassword = await bcrypt.hash(password, 12);
// النتيجة: $2b$12$xyz123... (لا يمكن قراءتها)
```

**ملاحظة:** كلمة المرور الأصلية **لا تُحفظ أبداً** في قاعدة البيانات.

## 📍 الخلاصة

### أين تُحفظ البيانات؟

1. **المستخدمون (Users):**
   - ✅ **قاعدة البيانات:** PostgreSQL
   - ✅ **الجدول:** `users`
   - ✅ **الموقع:** `localhost:5432/smart_campus` (أو على خادم سحابي)

2. **كلمات المرور:**
   - ✅ **مشفرة** باستخدام bcrypt
   - ✅ **لا تُحفظ** ككلمات مرور واضحة

3. **ملفات الإعداد:**
   - ✅ `prisma/schema.prisma` - تعريف هيكل البيانات
   - ✅ `.env` - معلومات الاتصال
   - ✅ `config/database.ts` - إعدادات الاتصال

## 🔍 التحقق من البيانات

بعد إنشاء حساب، يمكنك التحقق:

```bash
# 1. فتح Prisma Studio
npm run db:studio

# 2. أو استخدام psql
psql -U postgres -d smart_campus
SELECT * FROM users;
```

## 📝 ملاحظات مهمة

- ✅ البيانات تُحفظ **محلياً** على جهازك إذا كنت تستخدم PostgreSQL محلي
- ✅ يمكنك نقل قاعدة البيانات إلى خادم سحابي (مثل AWS RDS, Supabase, Railway)
- ✅ لا تنسَ عمل Backup دوري لقاعدة البيانات
- ✅ حافظ على ملف `.env` آمن ولا تشاركه مع أحد

