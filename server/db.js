const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      is_admin INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name_fa TEXT NOT NULL,
      name_en TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      name_fa TEXT NOT NULL,
      name_en TEXT,
      description TEXT,
      price INTEGER NOT NULL,
      compare_price INTEGER,
      cost INTEGER,
      stock INTEGER DEFAULT 0,
      weight_grams INTEGER DEFAULT 0,
      category_id INTEGER,
      images TEXT DEFAULT '[]',
      colors TEXT DEFAULT '[]',
      sizes TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Addresses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      recipient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      province TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      postal_code TEXT,
      address TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      address_id INTEGER,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
      payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),
      shipping_status TEXT DEFAULT 'pending' CHECK(shipping_status IN ('pending', 'ready', 'shipped', 'delivered')),
      subtotal INTEGER NOT NULL,
      shipping_cost INTEGER NOT NULL,
      discount_amount INTEGER DEFAULT 0,
      tax_amount INTEGER DEFAULT 0,
      total INTEGER NOT NULL,
      currency TEXT DEFAULT 'IRR',
      note TEXT,
      tracking_code TEXT,
      shipped_at DATETIME,
      delivered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (address_id) REFERENCES addresses(id)
    )
  `);

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      color TEXT,
      size TEXT,
      total_price INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Payments table (Zarinpal transactions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      authority TEXT UNIQUE,
      ref_id TEXT,
      amount INTEGER NOT NULL,
      gateway TEXT DEFAULT 'zarinpal',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'verified')),
      card_pan TEXT,
      card_hash TEXT,
      fee INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sessions/carts (optional, for anonymous carts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      cart_data TEXT DEFAULT '{}',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Insert default admin if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@noqteh.ir';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, is_admin, is_active)
      VALUES (?, ?, ?, ?, 1, 1)
    `).run(adminEmail, hash, 'مدیر', 'سایت');
  }

  // Insert default categories if empty
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCount.count === 0) {
    const categories = [
      ['women', 'زنانه', 'Women', 1],
      ['men', 'مردانه', 'Men', 2],
      ['kids', 'بچگانه', 'Kids', 3],
      ['limited', 'کالکشن محدود', 'Limited', 4]
    ];
    const insertCat = db.prepare('INSERT INTO categories (slug, name_fa, name_en, sort_order) VALUES (?, ?, ?, ?)');
    for (const cat of categories) insertCat.run(cat);
  }

  // Insert default settings
  const defaultSettings = {
    'site.name': 'NOQTEH',
    'site.currency': 'IRR',
    'shipping.base_cost': '65000',
    'shipping.free_threshold': '1500000',
    'zarinpal.merchant_id': 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    'zarinpal.sandbox': 'true'
  };
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }
}

initDatabase();

module.exports = db;
