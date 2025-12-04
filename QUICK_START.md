# Quick Start Guide - Fix 404 Error

## المشكلة (Problem)
إذا كنت تحصل على خطأ `Request failed with status code 404` عند تسجيل الدخول، فالمشكلة أن الـ backend server غير قيد التشغيل.

## الحل (Solution)

### 1. تشغيل Backend Server

افتح terminal جديد (منفصل عن الـ frontend) وقم بتشغيل:

```bash
# Option 1: تشغيل simple auth server
node server/simple-auth-server.js

# أو Option 2: تشغيل server من package.json
npm run server
```

الـ server سيعمل على: `http://localhost:3001`

### 2. التحقق من أن الـ Server يعمل

افتح المتصفح واذهب إلى:
- Health Check: http://localhost:3001/api/auth/health
- أو اختبر بالـ curl:
  ```bash
  curl http://localhost:3001/api/auth/health
  ```

### 3. تشغيل Frontend

في terminal آخر، قم بتشغيل:

```bash
npm run dev
```

### 4. تسجيل الدخول

استخدم بيانات الاختبار:
- **للطالب**: University ID: `20221245` | Password: `123456`
- **للأستاذ**: University ID: `11111111` | Password: `111111`

## ملاحظات مهمة

- يجب أن يعمل الـ backend على `http://localhost:3001`
- الـ frontend سيعمل على `http://localhost:5173` (افتراضي)
- تأكد من أن الـ server يعمل قبل محاولة تسجيل الدخول

## استكشاف الأخطاء

إذا استمرت المشكلة:

1. **تحقق من المنفذ**: تأكد أن منفذ 3001 غير مستخدم:
   ```bash
   netstat -ano | findstr :3001
   ```

2. **تحقق من الـ logs**: انظر إلى terminal الـ server لرؤية أي أخطاء

3. **تحقق من CORS**: تأكد أن الـ server يسمح بـ origin: `http://localhost:5173`

