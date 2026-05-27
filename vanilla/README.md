# Vanilla Version

نسخة Frontend معمولة بـ `HTML + CSS + JavaScript` بدون أي framework.

## التشغيل

من جذر المشروع:

```bash
npm run dev:vanilla
```

ثم افتح:

`http://localhost:5500`

## ملاحظات

- هذه النسخة تتكلم مع نفس API endpoints الموجودة في المشروع الأصلي.
- تم وضعها في مجلد مستقل `vanilla` لتجربة تدريجية بدون كسر نسخة Next.js.
- لو أردت، أقدر في خطوة تالية أحولها لنسخة متعددة الصفحات بدل SPA.

## تحسينات أمان مطبقة

- Sanitization قبل عرض أي نصوص قادمة من الـ API لتجنب XSS.
- Validation على المدخلات (phone/password/code/amount/count) قبل الإرسال.
- Session مخزنة في `sessionStorage` بدل `localStorage` لتقليل أثر التسريب طويل المدى.
- API timeout مع إلغاء تلقائي للطلبات المتأخرة.
- CSP وReferrer policy في `index.html` لخفض مخاطر تحميل مصادر غير موثوقة.
