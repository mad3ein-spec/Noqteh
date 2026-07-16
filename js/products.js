// ========================================
// NOQTEH — Product Data
// Loads from backend API, falls back to local data
// ========================================

const localProducts = [
  {
    id: 1,
    title: "جوراب گلدوزی گل رز",
    category: "گلدوزی کلاسیک",
    price: 185000,
    oldPrice: 220000,
    rating: 4.9,
    reviews: 42,
    image: "editorial-11.jpg",
    badge: "پرفروش",
    description: "جوراب نخی باکیفیت با گلدوزی دستی گل رز. مناسب استفاده روزمره و هدیه دادن. رنگ کرم و صورتی، بافت نرم و ضد حساسیت.",
    colors: ["#F5E6D3", "#E8C4C4", "#2C2C2C"],
    sizes: ["36-38", "39-41", "42-44"]
  },
  {
    id: 2,
    title: "جوراب طرح باغ ایرانی",
    category: "طرح سنتی",
    price: 210000,
    oldPrice: null,
    rating: 4.8,
    reviews: 28,
    image: "editorial-6.jpg",
    badge: "جدید",
    description: "الهام گرفته از باغ‌های ایرانی با طرح‌های اسلیمی و گل‌های رنگارنگ. هر جفت توسط هنرمندان محلی با دقت گلدوزی شده است.",
    colors: ["#FAF8F5", "#D4E5D2", "#E8D5C4"],
    sizes: ["36-38", "39-41", "42-44"]
  },
  {
    id: 3,
    title: "جوراب مینیمال نخی",
    category: "سبک مینیمال",
    price: 145000,
    oldPrice: null,
    rating: 4.7,
    reviews: 56,
    image: "editorial-7.jpg",
    badge: null,
    description: "طرح ساده و ظریف با یک گل کوچک گلدوزی‌شده. مناسب علاقه‌مندان به استایل مینیمال و شیک.",
    colors: ["#FFFFFF", "#F0E6DC", "#B8C4C2"],
    sizes: ["36-38", "39-41", "42-44"]
  },
  {
    id: 4,
    title: "جوراب گلدوزی گیلاس",
    category: "میوه‌ای و شاد",
    price: 195000,
    oldPrice: 230000,
    rating: 4.9,
    reviews: 35,
    image: "editorial-2.jpg",
    badge: "محبوب",
    description: "طرح گیلاس‌های قرمز گلدوزی‌شده روی جوراب نخی کرم. شاد، خاص و مناسب فصل بهار و تابستان.",
    colors: ["#FAF8F5", "#2C2C2C", "#E8C4C4"],
    sizes: ["36-38", "39-41", "42-44"]
  },
  {
    id: 5,
    title: "جوراب گلدوزی گل آفتابگردان",
    category: "گلدوزی کلاسیک",
    price: 205000,
    oldPrice: null,
    rating: 4.8,
    reviews: 31,
    image: "editorial-14.jpg",
    badge: null,
    description: "گل آفتابگردان با نخ‌های زرد و قهوه‌ای روی زمینه مشکی. جذاب، هنری و چشم‌نواز.",
    colors: ["#2C2C2C", "#F5E6D3"],
    sizes: ["36-38", "39-41", "42-44"]
  },
  {
    id: 6,
    title: "جوراب طرح کویر و نخل",
    category: "طرح سنتی",
    price: 225000,
    oldPrice: null,
    rating: 5.0,
    reviews: 19,
    image: "hero-1.jpg",
    badge: "ویژه",
    description: "طرح کویر، نخل و غروب با الهام از طبیعت ایران. گلدوزی دستی با رنگ‌های گرم و خاکی.",
    colors: ["#E8D5C4", "#C4B5A5", "#FAF8F5"],
    sizes: ["36-38", "39-41", "42-44"]
  },
  {
    id: 7,
    title: "جوراب گلدوزی قلب",
    category: "کادویی",
    price: 165000,
    oldPrice: 195000,
    rating: 4.8,
    reviews: 64,
    image: "editorial-10.jpg",
    badge: "کادویی",
    description: "طرح قلب‌های ظریف گلدوزی‌شده. انتخاب عالی برای هدیه ولنتاین، سالگرد یا یک سورپرایز دوستانه.",
    colors: ["#FFFFFF", "#E8C4C4", "#F5E6D3"],
    sizes: ["36-38", "39-41", "42-44"]
  },
  {
    id: 8,
    title: "جوراب طرح حیوانات جنگل",
    category: "فانتزی",
    price: 200000,
    oldPrice: null,
    rating: 4.7,
    reviews: 23,
    image: "editorial-3.jpg",
    badge: null,
    description: "طرح روباه، خرگوش و پرنده با گلدوزی ظریف. مناسب استایل کژوال و روزهای خاص.",
    colors: ["#FAF8F5", "#D4E5D2", "#E8C4C4"],
    sizes: ["36-38", "39-41", "42-44"]
  }
];

let products = [];
let productsLoaded = false;
let productLoadError = false;

async function api(path, options = {}) {
  const STATIC_MODE = (typeof CONFIG !== 'undefined' && CONFIG.STATIC_MODE) ? true : false;
  if (STATIC_MODE) throw new Error('static mode');
  const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE) ? CONFIG.API_BASE : '/api';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function adaptBackendProduct(p) {
  const img = (p.images && p.images[0]) || 'hero-1.jpg';
  return {
    id: p.id,
    title: p.name.fa,
    category: 'گلدوزی دستی',
    price: p.price,
    oldPrice: p.comparePrice,
    rating: 4.8,
    reviews: 0,
    image: img.startsWith('http') ? img.replace(/^.*\//, '') : img,
    badge: p.isFeatured ? 'ویژه' : null,
    description: p.description || 'محصول دست‌دوز NOQTEH',
    colors: p.colors || ["#F5E6D3", "#E8C4C4", "#2C2C2C"],
    sizes: p.sizes || ["36-38", "39-41", "42-44"],
    slug: p.slug,
    backendId: p.id,
    weightGrams: p.weightGrams || 0
  };
}

async function loadProducts() {
  try {
    const data = await api('/products?limit=100');
    if (data.success && data.data.length > 0) {
      products = data.data.map(adaptBackendProduct);
    } else {
      products = localProducts;
    }
  } catch (err) {
    console.warn('Failed to load products from API, using local data', err);
    products = localProducts;
    productLoadError = true;
  }
  productsLoaded = true;
  document.dispatchEvent(new CustomEvent('noqteh:productsLoaded'));
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('fa-IR') + ' تومان';
}

function getProductById(id) {
  return products.find(p => p.id === Number(id)) || localProducts.find(p => p.id === Number(id));
}

function getProductBySlug(slug) {
  return products.find(p => p.slug === slug);
}

// Load on startup
loadProducts();
