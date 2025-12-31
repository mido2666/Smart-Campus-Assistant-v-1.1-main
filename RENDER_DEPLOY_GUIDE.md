# دليل الانتقال من Railway إلى Render

هذا الدليل يشرح خطوات نقل الـ Backend الخاص بمشروعك من Railway إلى منصة Render.

## 1. الإعدادات المضافة (render.yaml)
تمت إضافة ملف `render.yaml` إلى مشروعك. هذا الملف يسهل عملية النشر (Blueprint) حيث يخبر Render بالإعدادات المطلوبة تلقائياً.

- **Build Command:** `npm install && npm run build:backend`
- **Start Command:** `npm start`

## 2. خطوات النشر على Render

### الخيار أ: استخدام Blueprint (الأسهل)
1. قم برفع التغييرات الجديدة (ملف `render.yaml`) إلى GitHub.
2. اذهب إلى [لوحة تحكم Render](https://dashboard.render.com/).
3. اضغط على زر **New +** واختر **Blueprint**.
4. اربط حساب GitHub الخاص بك واختر مستودع المشروع (Repository).
5. سيقوم Render بقراءة ملف `render.yaml` وإعداد الخدمة تلقائياً.
6. ستحتاج فقط إلى إدخال متغيرات البيئة (Environment Variables) في الخطوة التالية.

### الخيار ب: النشر اليدوي (Web Service)
1. اذهب إلى [لوحة تحكم Render](https://dashboard.render.com/).
2. اضغط على **New +** واختر **Web Service**.
3. اختر المستودع من GitHub.
4. في صفحة الإعدادات:
   - **Name:** اختر اسماً (مثلاً `smart-campus-backend`).
   - **Region:** اختر أقرب منطقة (مثلاً `Frankfurt`).
   - **Build Command:** `npm install && npm run build:backend`
   - **Start Command:** `npm start`
   - **Plan:** اختر `Free` (أو الخطة التي تناسبك).

## 3. نقل متغيرات البيئة (Environment Variables)
هذه أهم خطوة ليعمل المشروع بشكل صحيح.
يجب عليك نسخ المتغيرات من ملف `.env` أو من إعدادات Railway القديمة واضافتها في Render في قسم **Environment**.

أهم المتغيرات التي يجب إضافتها:
- `DATABASE_URL`: رابط قاعدة البيانات (من Supabase).
- `DIRECT_URL`: رابط قاعدة البيانات المباشر (من Supabase - إن وجد).
- `JWT_SECRET`: مفتاح التشفير.
- `CORS_ORIGINS`: رابط الـ Frontend الخاص بك على Vercel (مثلاً `https://your-app.vercel.app`). **هام جداً ليعمل الموقع مع السيرفر**.
- `SUPABASE_URL` و `SUPABASE_KEY`: إذا كنت تستخدمهم.
- أي متغيرات أخرى للمفاتيح (OpenAI, Email, etc).

> **ملاحظة:** تأكد من إضافة `PORT` بقيمة `10000` في متغيرات البيئة (أو اتركه وسيقوم Render بتغييره، لكن يفضل تحديده).

## 4. تحديث الـ Frontend (Vercel)
بعد نجاح النشر على Render، ستحصل على رابط جديد للـ Backend (مثلاً `https://smart-campus-backend.onrender.com`).

1. اذهب إلى مشروع الـ Frontend على **Vercel**.
2. ادخل على **Settings** > **Environment Variables**.
3. قم بتحديث المتغير الذي يشير إلى الـ Backend (غالباً اسمه `VITE_API_URL` أو `VITE_BACKEND_URL` أو ما شابه) وضع الرابط الجديد الخاص بـ Render.
4. أعد نشر الـ Frontend على Vercel (Redeploy) ليعتمد الرابط الجديد.

## 5. ملاحظات هامة حول Render (Free Tier)
- الخطة المجانية في Render تضع السيرفر في وضع السكون (Sleep) بعد 15 دقيقة من عدم النشاط.
- عند أول طلب بعد السكون، قد يستغرق الرد وقتاً أطول (حوالي 30-50 ثانية) حتى يعمل السيرفر مجدداً (Cold Start).
- لتجنب ذلك، يمكنك استخدام خدمة مجانية مثل `UptimeRobot` لعمل "Ping" للسيرفر كل 10 دقائق، أو الترقية للخطة المدفوعة.
