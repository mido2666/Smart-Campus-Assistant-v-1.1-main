# Quick Fix: Chatbot Endpoint Not Found

## المشكلة (Problem)

"Cannot connect to server. Please ensure it's running on port 3001."

## الحل السريع (Quick Solution)

### 1. إعادة تشغيل Backend Server

**يجب إعادة تشغيل الـ server بعد التغييرات!**

#### الخطوة 1: أوقف الـ Server الحالي

في terminal الـ server:

- اضغط `Ctrl+C` لإيقاف الـ server

#### الخطوة 2: شغل الـ Server مرة أخرى

```bash
node server/simple-auth-server.js
```

يجب أن ترى:

```
🚀 Smart Campus Assistant API server listening on http://localhost:3001
📝 Available endpoints:
   - Authentication: http://localhost:3001/api/auth
   - Health Check: http://localhost:3001/api/auth/health
   - Chat: http://localhost:3001/api/chat
```

### 2. تحقق من أن الـ Chat Endpoint يعمل

#### اختبار مباشر:

```bash
Invoke-WebRequest -Uri "http://localhost:3001/api/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Hello","lang":"en"}' -UseBasicParsing
```

يجب أن تحصل على:

```json
{
  "success": true,
  "reply": "Hi! I'm here to help...",
  "suggestions": [...]
}
```

### 3. تحقق من Health Check

```bash
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/health" -UseBasicParsing
```

يجب أن تحصل على:

```json
{
  "success": true,
  "message": "Authentication service is healthy"
}
```

## ✅ تم إصلاح المشاكل

1. ✅ **ترتيب Routes**: Chat router الآن قبل 404 handler
2. ✅ **Chat Router**: تم إضافته إلى `simple-auth-server.js`
3. ✅ **Endpoint Paths**: تم إصلاح جميع المسارات
4. ✅ **Error Handling**: رسائل خطأ واضحة للمستخدم

## 🚨 مهم جداً!

**بعد أي تغييرات في `server/simple-auth-server.js`:**

1. **أوقف الـ server** (Ctrl+C)
2. **شغل مرة أخرى** (`node server/simple-auth-server.js`)

**بدون إعادة التشغيل، التغييرات لن تُطبق!**

## 🔍 استكشاف الأخطاء

### إذا استمرت المشكلة:

1. **تحقق من أن الـ Server يعمل**:

   ```bash
   netstat -ano | findstr :3001
   ```

   يجب أن ترى `LISTENING` على port 3001

2. **تحقق من Console Logs**:

   - في terminal الـ server، يجب أن ترى incoming requests
   - ابحث عن أي أخطاء

3. **تحقق من Browser Console**:

   - افتح DevTools → Network tab
   - ابحث عن `/api/chat` request
   - تحقق من Status Code (يجب أن يكون 200)
   - تحقق من Response

4. **اختبار مباشر للـ Endpoint**:

   ```bash
   # Test ping
   Invoke-WebRequest -Uri "http://localhost:3001/api/chat/ping" -UseBasicParsing

   # Test chat
   Invoke-WebRequest -Uri "http://localhost:3001/api/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"test","lang":"en"}' -UseBasicParsing
   ```

## 📝 ملاحظات

- **الـ Server يجب أن يعمل على port 3001**
- **Frontend يعمل على port 5173** (افتراضي)
- **يجب إعادة تشغيل الـ server بعد أي تغييرات**
- **Chat endpoint**: `POST /api/chat`

## ✅ Checklist

- [ ] Server يعمل على port 3001
- [ ] Health check يعمل (`/api/auth/health`)
- [ ] Chat endpoint يعمل (`/api/chat`)
- [ ] Frontend يصل إلى backend
- [ ] Chatbot يعمل بدون أخطاء
