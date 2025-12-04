# Fix: Internal Server Error During Login

## المشكلة (Problem)
إذا كنت تحصل على "Internal server error during login"، فالمشاكل المحتملة:

1. **Backend Server غير قيد التشغيل**
2. **خطأ في الـ response format**
3. **مشكلة في CORS**

## الحلول (Solutions)

### 1. تأكد من تشغيل Backend Server

في terminal منفصل:

```bash
# تشغيل simple auth server
node server/simple-auth-server.js
```

يجب أن ترى:
```
🚀 Smart Campus Assistant API server listening on http://localhost:3001
```

### 2. تحقق من Health Check

افتح المتصفح أو استخدم curl:
```bash
curl http://localhost:3001/api/auth/health
```

يجب أن تحصل على:
```json
{
  "success": true,
  "message": "Authentication service is healthy"
}
```

### 3. اختبر Login مباشرة

استخدم curl لاختبار Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"universityId":"20221245","password":"123456"}'
```

يجب أن تحصل على:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "accessToken": "mock-access-token",
    "refreshToken": "mock-refresh-token",
    "expiresIn": 900
  }
}
```

### 4. تحقق من Console Logs

- **في terminal الـ server**: ابحث عن `Login attempt:` أو `Login error:`
- **في browser console**: ابحث عن `📡 [ApiClient] POST` أو `❌ [ApiClient] POST`

### 5. تأكد من الـ Port

تأكد أن:
- Backend يعمل على: `http://localhost:3001`
- Frontend يعمل على: `http://localhost:5173` (افتراضي)
- لا يوجد conflict في المنافذ

## التغييرات التي تم إجراؤها (Changes Made)

1. ✅ **إصلاح baseURL**: الآن يشمل `/api` → `http://localhost:3001/api`
2. ✅ **إضافة refreshToken**: Server الآن يرسل `refreshToken` في الـ response
3. ✅ **تحسين Error Handling**: الآن يعرض تفاصيل الخطأ بشكل أفضل

## البيانات للاختبار (Test Credentials)

- **طالب**: University ID: `20221245` | Password: `123456`
- **أستاذ**: University ID: `11111111` | Password: `111111`

