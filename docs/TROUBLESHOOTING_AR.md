# 🐛 استكشاف الأخطاء - Smart Campus Assistant

## المشاكل الشائعة والحلول

### 1. خطأ EPERM في Prisma

**الخطأ**:

```
Error: EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp...'
```

**السبب**: ملف Prisma query engine قيد الاستخدام من عملية أخرى.

**الحل**:

```bash
# 1. تنظيف ملفات Prisma المؤقتة
npm run db:clean

# 2. إعادة إنشاء Prisma Client
npm run db:regenerate

# 3. إذا استمرت المشكلة، أغلق:
#    - VS Code / أي IDE
#    - أي عملية Node.js تعمل
#    - أعد تشغيل الكمبيوتر إذا لزم الأمر
```

---

### 2. قاعدة البيانات غير قابلة للوصول

**الخطأ**:

```
Error: P1001: Can't reach database server at `localhost:5432`
```

**الحل**:

```bash
# 1. التحقق من حالة Docker
docker ps

# 2. إذا لم تكن قاعدة البيانات تعمل:
npm run db:start

# 3. إصلاح DATABASE_URL تلقائياً
npm run db:fix-url

# 4. التحقق من المنفذ الصحيح
# Docker قد يعمل على منفذ مختلف (مثلاً 5433 بدلاً من 5432)
```

---

### 3. المنفذ قيد الاستخدام

**الخطأ**:

```
Error: listen EADDRINUSE: address already in use :::3001
```

**الحل**:

#### Windows (PowerShell):

```powershell
# البحث عن العملية
netstat -ano | findstr :3001

# إنهاء العملية (استبدل <PID> بالرقم الفعلي)
taskkill /PID <PID> /F
```

#### macOS/Linux:

```bash
# البحث عن العملية
lsof -i :3001

# إنهاء العملية (استبدل <PID> بالرقم الفعلي)
kill -9 <PID>
```

---

### 4. مشاكل CORS

**الخطأ**:

```
Access to XMLHttpRequest at 'http://localhost:3001/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**الحل**:

1. **تحديث ALLOWED_ORIGINS في `.env`**:

```env
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://192.168.1.4:5173"
```

2. **إعادة تشغيل Backend Server**:

```bash
npm run server:dev
```

3. **التحقق من CORS headers في Response**:

```bash
curl -I http://localhost:3001/api/health
```

---

### 5. مشاكل Environment Variables

**الخطأ**:

```
Error: JWT_SECRET is not set
```

**الحل**:

```bash
# 1. إنشاء ملف .env
npm run env:create

# 2. التحقق من متغيرات البيئة
npm run env:check

# 3. التأكد من أن .env موجود في المجلد الجذر
```

---

### 6. Prisma Permission Errors

**الخطأ**:

```
Error: EACCES: permission denied
```

**الحل**:

#### Windows:

```powershell
# تشغيل PowerShell كـ Administrator
# ثم:
npm run db:clean --full
npm run db:generate
```

#### macOS/Linux:

```bash
# استخدام sudo (بحذر)
sudo npm run db:clean --full
sudo npm run db:generate
```

---

### 7. Docker لا يعمل

**الخطأ**:

```
Error: Cannot connect to the Docker daemon
```

**الحل**:

1. **تشغيل Docker Desktop**:

   - افتح Docker Desktop
   - انتظر حتى يكون جاهزاً

2. **التحقق من حالة Docker**:

```bash
docker ps
```

3. **إعادة تشغيل Docker**:
   - أغلق Docker Desktop
   - افتحه مرة أخرى

---

### 8. Module Not Found Errors

**الخطأ**:

```
Error: Cannot find module 'xxx'
```

**الحل**:

```bash
# 1. حذف node_modules و package-lock.json
rm -rf node_modules package-lock.json

# 2. إعادة تثبيت التبعيات
npm install

# 3. إذا استمرت المشكلة، تنظيف npm cache
npm cache clean --force
npm install
```

---

### 9. TypeScript Errors

**الخطأ**:

```
Type error: Cannot find name 'xxx'
```

**الحل**:

```bash
# 1. فحص TypeScript
npm run typecheck

# 2. إعادة بناء Prisma Client
npm run db:generate

# 3. إعادة تشغيل TypeScript Server في VS Code
#    Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### 10. Frontend لا يعمل بعد Build

**الخطأ**: الصفحة بيضاء أو أخطاء في Console

**الحل**:

1. **التحقق من Console في المتصفح**:

   - افتح Developer Tools (F12)
   - ابحث عن الأخطاء

2. **التحقق من Base URL**:

   - تأكد من أن API URL صحيح في `src/services/api.ts`

3. **إعادة Build**:

```bash
npm run build
npm run preview
```

---

## أوامر التشخيص

### فحص حالة السيرفرات

```bash
npm run dev:check
```

### فحص قاعدة البيانات

```bash
# فتح Prisma Studio
npm run db:studio

# فحص الاتصال
npm run db:push
```

### فحص Environment Variables

```bash
npm run env:check
```

### تنظيف وإعادة البناء

```bash
# تنظيف Prisma
npm run db:clean

# إعادة إنشاء Prisma Client
npm run db:regenerate

# تنظيف npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Logs و Debugging

### Backend Logs

```bash
# في Terminal حيث يعمل Backend
# يجب أن ترى logs لكل request
```

### Frontend Logs

```bash
# في Browser Console (F12)
# أو في Terminal حيث يعمل Vite
```

### Database Logs

```bash
# في Prisma Studio
npm run db:studio

# أو في Docker logs
docker logs smartcampus-db
```

### Enable Debug Mode

في `.env`:

```env
DEBUG=true
LOG_LEVEL=debug
DEBUG_PRISMA=true
PRISMA_LOG_QUERIES=true
DEBUG_ROUTES=true
```

---

## الحصول على المساعدة

إذا لم تحل المشكلة:

1. **تحقق من Logs**: ابحث عن أخطاء في Console أو Logs
2. **تحقق من الوثائق**: راجع `docs/` folder
3. **تحقق من GitHub Issues**: ابحث عن مشاكل مشابهة
4. **إنشاء Issue جديد**: مع تفاصيل المشكلة والخطوات لإعادة إنتاجها

---

**آخر تحديث**: يناير 2025
