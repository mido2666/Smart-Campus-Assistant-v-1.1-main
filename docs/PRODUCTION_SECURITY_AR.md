# 🔒 أمن وحماية Production - Smart Campus Assistant

## نقاط الأمان المهمة

### 1. حماية JWT Secret

**المشكلة**: JWT Secret ضعيف أو معروف.

**الحل**:

- استخدم secret قوي وطويل (64+ حرف)
- استخدم متغيرات البيئة (لا تضع secret في الكود)
- غير Secret بشكل دوري
- استخدم secrets مختلفة للـ Development و Production

```env
# .env.production
JWT_SECRET="your-super-long-random-secret-min-64-chars-change-this-in-production"
```

---

### 2. تغيير كلمات مرور قاعدة البيانات

**المشكلة**: كلمات المرور الافتراضية.

**الحل**:

- استخدم كلمات مرور قوية لقاعدة البيانات
- لا تستخدم `postgres:postgres` في Production
- استخدم secrets management (مثلاً AWS Secrets Manager)

```env
# .env.production
DATABASE_URL="postgresql://strong_username:strong_password@db-host:5432/smart_campus?schema=public"
```

---

### 3. HTTPS

**المشكلة**: HTTP غير آمن.

**الحل**:

- استخدم HTTPS في Production
- احصل على SSL Certificate (Let's Encrypt مجاني)
- استخدم reverse proxy (Nginx) مع SSL

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 4. Rate Limiting

**المشكلة**: عدم وجود rate limiting.

**الحل**:

- طبق rate limiting على جميع الـ endpoints الحساسة
- استخدم Redis للـ rate limiting الموزع

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

---

### 5. حماية من CSRF

**المشكلة**: عدم وجود حماية CSRF.

**الحل**:

- استخدم CSRF tokens
- استخدم SameSite cookies

```typescript
import csrf from "csurf";

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.post("/api/courses", csrfProtection, (req, res) => {
  // ...
});
```

---

### 6. حماية من XSS

**المشكلة**: عدم تنظيف المدخلات.

**الحل**:

- نظف جميع المدخلات من المستخدم
- استخدم DOMPurify للـ HTML
- استخدم Content Security Policy (CSP)

```typescript
import DOMPurify from "dompurify";

const cleanInput = DOMPurify.sanitize(userInput);
```

```typescript
// Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  next();
});
```

---

### 7. تأمين ngrok أو استبداله

**المشكلة**: ngrok URLs مؤقتة وغير آمنة.

**الحل**:

#### خيار 1: Basic Auth

```bash
ngrok http 3001 --basic-auth="username:password"
```

#### خيار 2: IP Whitelist

```bash
ngrok http 3001 --region=us --hostname=your-domain.ngrok.io
```

#### خيار 3: Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:3001
```

---

### 8. تهيئة CORS

**المشكلة**: CORS مفتوح للجميع.

**الحل**:

- قيد CORS origins في Production
- لا تستخدم `*` في Production

```typescript
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

```env
# .env.production
ALLOWED_ORIGINS="https://your-domain.com,https://www.your-domain.com"
```

---

### 9. تشفير البيانات الحساسة

**المشكلة**: البيانات الحساسة غير مشفرة.

**الحل**:

- شفر البيانات الحساسة في قاعدة البيانات
- استخدم encryption at rest
- استخدم TLS للاتصالات

```typescript
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, "salt", 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
```

---

### 10. Security Headers

**المشكلة**: عدم وجود security headers.

**الحل**:

- استخدم Helmet.js
- أضف security headers

```typescript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

---

## النسخ الاحتياطي (Backup)

### 1. قاعدة البيانات

**الحل**:

- أتمتة النسخ الاحتياطي اليومي
- احفظ النسخ في مكان آمن
- اختبر استعادة النسخ بشكل دوري

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres smart_campus > backup_${DATE}.sql

# Upload to S3 or other storage
aws s3 cp backup_${DATE}.sql s3://your-backup-bucket/
```

### 2. الملفات

**الحل**:

- احفظ ملفات uploads في cloud storage (S3)
- استخدم versioning
- أتمتة النسخ الاحتياطي

---

## Monitoring و Logging

### 1. Error Tracking

**الحل**:

- استخدم Sentry أو Rollbar
- سجل جميع الأخطاء
- أرسل تنبيهات للأخطاء الحرجة

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 2. Logging

**الحل**:

- استخدم structured logging (Winston, Pino)
- احفظ Logs في central location
- راجع Logs بشكل دوري

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
```

### 3. Monitoring

**الحل**:

- استخدم monitoring tools (Prometheus, Grafana)
- راقب Performance metrics
- راقب Uptime

---

## Checklist قبل النشر

- [ ] JWT_SECRET قوي وفريد
- [ ] كلمات مرور قاعدة البيانات قوية
- [ ] HTTPS مفعّل
- [ ] Rate limiting مفعّل
- [ ] CORS محدود
- [ ] Security headers مفعّلة
- [ ] CSRF protection مفعّل
- [ ] XSS protection مفعّل
- [ ] Input validation شامل
- [ ] Error handling شامل
- [ ] Logging مفعّل
- [ ] Monitoring مفعّل
- [ ] Backup strategy موجودة
- [ ] Environment variables محمية
- [ ] Secrets management موجود
- [ ] SSL certificates محدثة
- [ ] Firewall rules صحيحة
- [ ] Database backups أتمتة
- [ ] Disaster recovery plan موجود

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

---

**آخر تحديث**: يناير 2025
