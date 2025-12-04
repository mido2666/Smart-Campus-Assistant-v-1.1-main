# Debug Login Error - Internal Server Error

## المشكلة (Problem)
"Internal server error during login" يحدث عند محاولة تسجيل الدخول.

## الحلول التي تم إجراؤها (Solutions Applied)

### 1. إصلاح `.substr()` إلى `.substring()`
- `.substr()` deprecated في JavaScript الحديث
- تم استبداله بـ `.substring()` في جميع الأماكن

### 2. تحسين Error Handling
- إضافة logging مفصل للأخطاء
- إضافة error stack في development mode
- تحسين Global Error Handler

### 3. إضافة Request Logging
- إضافة middleware للـ logging
- تسجيل كل طلب login بالتفصيل

## كيفية التحقق من المشكلة (How to Debug)

### 1. تحقق من Server Logs

في terminal الـ server، يجب أن ترى:
```
Login request middleware: { method: 'POST', path: '/api/auth/login', ... }
Login request received: { body: {...}, headers: {...}, ... }
Login attempt: { universityId: '20221245', password: '***' }
```

### 2. تحقق من Browser Console

في browser console، يجب أن ترى:
```
📡 [ApiClient] POST /auth/login { universityId: '20221245', password: '123456' }
```

إذا كان هناك خطأ:
```
❌ [ApiClient] POST /auth/login - Error: ...
```

### 3. تحقق من Network Tab

في browser DevTools → Network:
1. ابحث عن `login` request
2. تحقق من:
   - Status Code (يجب أن يكون 200)
   - Response (يجب أن يحتوي على `success: true`)
   - Request Payload (يجب أن يحتوي على `universityId` و `password`)

## إعادة تشغيل الـ Server (Restart Server)

بعد التغييرات، يجب إعادة تشغيل الـ server:

1. **أوقف الـ server الحالي** (Ctrl+C)
2. **شغل الـ server مرة أخرى**:
   ```bash
   node server/simple-auth-server.js
   ```

## اختبار مباشر (Direct Test)

جرب هذا الأمر في terminal منفصل:
```bash
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"universityId":"20221245","password":"123456"}' -UseBasicParsing
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

## إذا استمرت المشكلة (If Problem Persists)

1. **تحقق من Server Logs**: ابحث عن أي أخطاء في terminal الـ server
2. **تحقق من Browser Console**: ابحث عن أي أخطاء JavaScript
3. **تحقق من Network Tab**: ابحث عن أي طلبات فاشلة
4. **تحقق من CORS**: تأكد أن الـ server يسمح بـ origin صحيح
5. **تحقق من Port**: تأكد أن الـ server يعمل على port 3001

