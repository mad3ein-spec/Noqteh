# NOQTEH — Editorial Fashion E-commerce

فروشگاه جوراب‌های گلدوزی‌شده دست‌ساز با سبک مجله‌ای، الهام گرفته از Zara.

## 🎨 پالت رنگی

پالت رنگی nude و مدرن:
- **Background**: `#FAF7F2` (کرم گرم)
- **Warm Background**: `#F2EBE0`
- **Text**: `#2C2825` (قهوه‌ای تیره)
- **Accent**: `#A67C52` (شتری/کاراملی)
- **Border**: `#E8E0D4`

## 🔤 فونت

IRANSansX:
- `assets/fonts/IRANSansX-Regular.woff2`
- `assets/fonts/IRANSansX-Bold.woff2`

## ✨ ویژگی‌ها

- 🎨 پالت رنگی nude/mdern
- 🌗 Dark Mode
- 🖱 Custom Cursor
- 🛒 Cart Drawer
- 👁 Quick View Modal
- 📏 Size Guide Modal
- 🔍 Image Zoom on Hover
- ↔️ Horizontal Scroll Lookbook
- 📢 Marquee / Ticker
- 📱 Sticky Add to Cart (موبایل)
- 🍔 Full-Screen Menu with Image Preview
- 🔍 جستجو و فیلتر محصولات
- 💟 Wishlist
- ✨ انیمیشن‌های اسکرول

## 📄 صفحات

| صفحه | لینک |
|------|------|
| خانه | `index.html` |
| فروشگاه | `shop.html` |
| Lookbook | `lookbook.html` |
| جزئیات محصول | `product.html?id=1` |
| سبد خرید | `cart.html` |
| پرداخت | `checkout.html` |
| حساب کاربری | `account.html` |
| درباره ما | `about.html` |
| تماس | `contact.html` |
| ۴۰۴ | `404.html` |

## 🚀 اجرای محلی

```bash
cd pagol-shop
python3 -m http.server 9000
```

```
http://localhost:9000
```

## 🌐 دپلوی روی GitHub Pages (بدون بک‌اند)

۱. همه فایل‌ها رو پوش کن به ریپوی گیت‌هاب:
```bash
git add .
git commit -m "Deploy static NOQTEH site"
git push origin main
```

۲. توی گیت‌هاب برو به **Settings → Pages**

۳. سورس رو بذار روی **Deploy from a branch → main → / (root)**

۴. فایل `CNAME` با محتوای `smartcafi.shop` توی روت ریپو هست. GitHub دامنه رو می‌خونه.

۵. DNS دامنه رو ست کن (یکی از دو حالت):

### حالت A — رکوردهای A
| Type | Host | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

### حالت B — رکورد CNAME
| Type | Host | Value |
|------|------|-------|
| CNAME | @ | yourusername.github.io |

> اگه CNAME زدی، باید `www` هم CNAME بزنی به `yourusername.github.io`

۶. توی GitHub Pages تیک **Enforce HTTPS** رو بعد از فعال شدن DNS بزن.

۷. منتظر بمان تا DNS پروپگیت بشه (معمولاً چند دقیقه تا ۲۴ ساعت).

## ⚙️ حالت استاتیک

توی `js/config.js` مقدار `STATIC_MODE` روی `true` هست. یعنی:
- فرانت‌اند بدون بک‌اند کار می‌کنه
- محصولات از دیتای محلی لود می‌شن
- سبد خرید با localStorage کار می‌کنه
- ثبت‌نام/لاگین و پرداخت آنلاین موقتاً غیرفعاله و پیام مناسب نشون میده

وقتی بک‌اند رو دپلوی کردی، کافیه `STATIC_MODE` رو `false` بذاری و `API_BASE` رو آدرس سرورت بذار.

---

© ۱۴۰۴ NOQTEH
