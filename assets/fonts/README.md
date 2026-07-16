# 📝 راهنمای فونت‌های NOQTEH

## فونت‌های فعلی پروژه

این پروژه از فونت **IRANSansX** استفاده می‌کند:

| وزن | فایل مورد نیاز |
|-----|----------------|
| Regular (۴۰۰) | `IRANSansX-Regular.woff2` |
| Bold (۷۰۰) | `IRANSansX-Bold.woff2` |

## قرار دادن فایل‌ها

این دو فایل را دقیقاً با همین نام‌ها در این پوشه بگذارید:

```
pagol-shop/assets/fonts/
├── IRANSansX-Regular.woff2
└── IRANSansX-Bold.woff2
```

## تنظیمات CSS

فایل `css/style.css` این `@font-face` را دارد:

```css
@font-face {
  font-family: 'IRANSansX';
  src: url('../assets/fonts/IRANSansX-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'IRANSansX';
  src: url('../assets/fonts/IRANSansX-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

و متغیرها:

```css
:root {
  --font-body: 'IRANSansX', 'Vazirmatn', sans-serif;
  --font-display: 'IRANSansX', 'Vazirmatn', sans-serif;
  --font-accent: 'IRANSansX', 'Vazirmatn', sans-serif;
}
```

## نکات

- فایل‌ها باید دقیقاً **WOFF2** باشند.
- اگه بعداً خواستی فونت عوض کنی، فقط نام فایل‌ها در `css/style.css` و مسیر `assets/fonts/` تغییر می‌کنه.
- فونت‌ها در همه صفحات `preload` شدن برای سرعت بهتر.

---

موفق باشی! 🌸
