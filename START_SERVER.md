# كيفية تشغيل الـ Server - How to Start Server

## 🚀 تشغيل Backend Server

### الخطوة 1: افتح Terminal جديد

افتح **terminal جديد** منفصل عن terminal الـ frontend.

### الخطوة 2: شغل الـ Server

```bash
# Navigate to project directory
cd C:\Users\K_e_r_o\Downloads\Smart-Campus-Assistant-v0.5-main

# Start the server
node server/simple-auth-server.js
```

### الخطوة 3: تحقق من أن الـ Server يعمل

يجب أن ترى:

```
🚀 Smart Campus Assistant API server listening on http://localhost:3001
📊 Environment: development
🔐 JWT Secret configured: Yes
🌐 CORS Origins: http://localhost:3000, http://localhost:5173, http://localhost:4173
📝 Available endpoints:
   - Authentication: http://localhost:3001/api/auth
   - Health Check: http://localhost:3001/api/auth/health
   - Chat: http://localhost:3001/api/chat
```

### الخطوة 4: اختبر الـ Endpoints

#### Health Check:

```bash
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/health" -UseBasicParsing
```

#### Test Chat:

```bash
Invoke-WebRequest -Uri "http://localhost:3001/api/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"message":"Hello","lang":"en"}' -UseBasicParsing
```

## 🔧 استكشاف الأخطاء

### المشكلة: Port 3001 already in use

**الحل**:

```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### المشكلة: Cannot find module

**الحل**:

```bash
# Install dependencies
npm install
```

### المشكلة: Server starts but endpoints return 404

**الحل**:

1. تأكد أن `chatRouter` موجود في `server/simple-auth-server.js`
2. تأكد أن ترتيب الـ routes صحيح (API routes قبل 404 handler)
3. أعد تشغيل الـ server

## 📝 ملاحظات مهمة

- **يجب أن يعمل الـ server في terminal منفصل**
- **لا تغلق terminal الـ server أثناء استخدام التطبيق**
- **الـ server يعمل على**: `http://localhost:3001`
- **الـ frontend يعمل على**: `http://localhost:5173` (افتراضي)

## ✅ بعد تشغيل الـ Server

1. **تحقق من Health Check**:

   - افتح المتصفح: `http://localhost:3001/api/auth/health`
   - يجب أن ترى: `{"success":true,"message":"Authentication service is healthy"}`

2. **اختبر Chatbot**:
   - افتح التطبيق في المتصفح
   - اذهب إلى صفحة Chatbot
   - أرسل رسالة
   - يجب أن تحصل على response من الـ AI

## 🔄 إعادة تشغيل الـ Server

إذا قمت بتعديل الكود:

1. **أوقف الـ server**: اضغط `Ctrl+C` في terminal الـ server
2. **شغل مرة أخرى**: `node server/simple-auth-server.js`

## 📊 Monitoring

يمكنك مراقبة الـ server logs في terminal لرؤية:

- الطلبات الواردة
- الأخطاء (إن وجدت)
- Chat requests

## 🆘 إذا استمرت المشكلة

1. **تحقق من Console Logs**: ابحث عن أي أخطاء في terminal الـ server
2. **تحقق من Browser Console**: ابحث عن أي أخطاء CORS أو network errors
3. **تحقق من Port**: تأكد أن port 3001 غير مستخدم من قبل تطبيق آخر
4. **أعد تشغيل الـ Server**: أحياناً الحل الأبسط هو الأفضل
