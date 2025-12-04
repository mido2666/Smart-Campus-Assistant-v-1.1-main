# Upstash Redis Setup Guide (Alternative to Redis Labs)

## Why Upstash?

- ✅ أسهل في التسجيل (يدعم GitHub بشكل ممتاز)
- ✅ REST API (لا يحتاج اتصال مباشر)
- ✅ مجاني تماماً (10,000 requests/day)
- ✅ لا يحتاج TLS configuration
- ✅ أسرع في الإعداد

---

## خطوات التسجيل

### 1. إنشاء حساب

1. اذهب إلى: https://upstash.com/
2. اضغط **"Get Started"**
3. سجل باستخدام:
   - **GitHub** (موصى به - يعمل بدون مشاكل) ✅
   - أو **Google**
   - أو **Email**

### 2. إنشاء Database

1. بعد تسجيل الدخول، اضغط **"Create Database"**
2. املأ البيانات:
   ```
   Name: smart-campus-cache
   Type: Regional
   Region: eu-central-1 (Frankfurt) أو الأقرب لك
   TLS: Enabled ✓
   Eviction: No eviction
   ```
3. اضغط **"Create"**

### 3. الحصول على Credentials

بعد إنشاء الـ database:

1. اذهب إلى **Details** tab
2. **انسخ** القيم التالية:

```bash
# UPSTASH_REDIS_REST_URL
https://caring-crab-12345.upstash.io

# UPSTASH_REDIS_REST_TOKEN  
AXXXAAIncDYXXXXXXX...
```

---

## التكوين

### في ملف `.env`:

```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

### في Fly.io:

```bash
fly secrets set UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
fly secrets set UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

### في Netlify:

لا تحتاج - الـ cache في الـ backend فقط.

---

## التثبيت

```bash
# Install Upstash SDK
npm install @upstash/redis
```

---

## الاستخدام

### استخدام الخدمة الجديدة:

```typescript
// بدلاً من
import { redisService } from '../config/redis.js';

// استخدم
import { upstashService } from '../config/upstash.js';

// نفس الـ API:
await upstashService.set('key', 'value', 300);
const value = await upstashService.get('key');
await upstashService.delete('key');

// Cache function result
const data = await upstashService.cache(
  'users:all',
  async () => await prisma.user.findMany(),
  300 // 5 minutes
);
```

---

## الاختبار

```bash
# Test connection
node -e "
const { upstashService } = require('./config/upstash.js');
upstashService.set('test', 'Hello Upstash!')
  .then(() => upstashService.get('test'))
  .then(console.log)
  .catch(console.error);
"
```

---

## المقارنة

| Feature | Redis Labs | Upstash |
|---------|-----------|---------|
| التسجيل بـ GitHub | ❌ مشاكل | ✅ يعمل |
| Setup | متوسط | سهل جداً |
| Free Tier | 30MB | 10K requests/day |
| Connection | Direct TCP | REST API |
| TLS Setup | مطلوب | تلقائي |
| الأفضل؟ | - | ✅ **موصى به** |

---

## Migration من Redis Labs

إذا بدأت بـ Redis Labs وتريد التحويل:

1. Install Upstash SDK: `npm install @upstash/redis`
2. Create `config/upstash.ts` (تم بالفعل ✅)
3. Update `.env` with Upstash credentials
4. Replace imports في الكود:
   ```typescript
   // Old
   import { redisService } from '../config/redis.js';
   
   // New
   import { upstashService } from '../config/upstash.js';
   ```
5. Deploy!

---

## الدعم

- Documentation: https://docs.upstash.com/redis
- Dashboard: https://console.upstash.com/
- Status: https://status.upstash.com/

---

## ❓ FAQ

**Q: هل Upstash مجاني فعلاً؟**
A: نعم! 10,000 requests يومياً مجاناً للأبد.

**Q: هل يعمل مع Fly.io؟**
A: نعم! REST API يعمل من أي مكان.

**Q: ماذا لو احتجت أكثر من 10K requests/day؟**
A: الخطة المدفوعة رخيصة جداً ($0.2 per 100K requests).

**Q: هل يمكن استخدامه محلياً؟**
A: نعم! يعمل في development و production.

---

🎉 **الآن لديك Redis يعمل بدون مشاكل!**
