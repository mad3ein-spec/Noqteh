const db = require('./db');

const seedProducts = [
  {
    sku: 'NOQ-001',
    slug: 'rose-embroidered-socks',
    name_fa: 'جوراب گلدوزی گل رز',
    name_en: 'Rose Embroidered Socks',
    description: 'جوراب نخی باکیفیت با گلدوزی دستی گل رز. مناسب استفاده روزمره و هدیه دادن.',
    price: 185000,
    compare_price: 220000,
    stock: 45,
    weight_grams: 80,
    category_id: 1,
    images: JSON.stringify(['editorial-11.jpg']),
    colors: JSON.stringify(['#F5E6D3', '#E8C4C4', '#2C2C2C']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44']),
    is_featured: 1
  },
  {
    sku: 'NOQ-002',
    slug: 'persian-garden-socks',
    name_fa: 'جوراب طرح باغ ایرانی',
    name_en: 'Persian Garden Socks',
    description: 'الهام گرفته از باغ‌های ایرانی با طرح‌های اسلیمی و گل‌های رنگارنگ.',
    price: 210000,
    stock: 30,
    weight_grams: 85,
    category_id: 1,
    images: JSON.stringify(['editorial-6.jpg']),
    colors: JSON.stringify(['#FAF8F5', '#D4E5D2', '#E8D5C4']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44'])
  },
  {
    sku: 'NOQ-003',
    slug: 'minimal-cotton-socks',
    name_fa: 'جوراب مینیمال نخی',
    name_en: 'Minimal Cotton Socks',
    description: 'طرح ساده و ظریف با یک گل کوچک گلدوزی‌شده. مناسب استایل مینیمال.',
    price: 145000,
    stock: 60,
    weight_grams: 70,
    category_id: 2,
    images: JSON.stringify(['editorial-7.jpg']),
    colors: JSON.stringify(['#FFFFFF', '#F0E6DC', '#B8C4C2']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44'])
  },
  {
    sku: 'NOQ-004',
    slug: 'cherry-embroidered-socks',
    name_fa: 'جوراب گلدوزی گیلاس',
    name_en: 'Cherry Embroidered Socks',
    description: 'طرح گیلاس‌های قرمز گلدوزی‌شده روی جوراب نخی کرم.',
    price: 195000,
    compare_price: 230000,
    stock: 35,
    weight_grams: 80,
    category_id: 3,
    images: JSON.stringify(['editorial-2.jpg']),
    colors: JSON.stringify(['#FAF8F5', '#2C2C2C', '#E8C4C4']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44'])
  },
  {
    sku: 'NOQ-005',
    slug: 'sunflower-socks',
    name_fa: 'جوراب گلدوزی گل آفتابگردان',
    name_en: 'Sunflower Socks',
    description: 'گل آفتابگردان با نخ‌های زرد و قهوه‌ای روی زمینه مشکی.',
    price: 205000,
    stock: 25,
    weight_grams: 82,
    category_id: 1,
    images: JSON.stringify(['editorial-14.jpg']),
    colors: JSON.stringify(['#2C2C2C', '#F5E6D3']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44'])
  },
  {
    sku: 'NOQ-006',
    slug: 'desert-palm-socks',
    name_fa: 'جوراب طرح کویر و نخل',
    name_en: 'Desert Palm Socks',
    description: 'طرح کویر، نخل و غروب با الهام از طبیعت ایران.',
    price: 225000,
    stock: 20,
    weight_grams: 90,
    category_id: 4,
    images: JSON.stringify(['hero-1.jpg']),
    colors: JSON.stringify(['#E8D5C4', '#C4B5A5', '#FAF8F5']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44']),
    is_featured: 1
  },
  {
    sku: 'NOQ-007',
    slug: 'heart-embroidered-socks',
    name_fa: 'جوراب گلدوزی قلب',
    name_en: 'Heart Embroidered Socks',
    description: 'طرح قلب‌های ظریف گلدوزی‌شده. انتخاب عالی برای هدیه.',
    price: 165000,
    compare_price: 195000,
    stock: 55,
    weight_grams: 75,
    category_id: 3,
    images: JSON.stringify(['editorial-10.jpg']),
    colors: JSON.stringify(['#FFFFFF', '#E8C4C4', '#F5E6D3']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44'])
  },
  {
    sku: 'NOQ-008',
    slug: 'forest-animals-socks',
    name_fa: 'جوراب طرح حیوانات جنگل',
    name_en: 'Forest Animals Socks',
    description: 'طرح روباه، خرگوش و پرنده با گلدوزی ظریف.',
    price: 200000,
    stock: 28,
    weight_grams: 80,
    category_id: 3,
    images: JSON.stringify(['editorial-3.jpg']),
    colors: JSON.stringify(['#FAF8F5', '#D4E5D2', '#E8C4C4']),
    sizes: JSON.stringify(['36-38', '39-41', '42-44'])
  }
];

function seed() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (existing.count > 0) {
    console.log('Products already seeded');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO products (sku, slug, name_fa, name_en, description, price, compare_price, stock, weight_grams, category_id, images, colors, sizes, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (const p of seedProducts) {
      insert.run(p.sku, p.slug, p.name_fa, p.name_en, p.description, p.price, p.compare_price, p.stock, p.weight_grams, p.category_id, p.images, p.colors, p.sizes, p.is_featured);
    }
  })();

  console.log(`Seeded ${seedProducts.length} products`);
}

seed();
