const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function safeJsonParse(str, fallback = []) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function formatProduct(row) {
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    name: { fa: row.name_fa, en: row.name_en },
    description: row.description,
    price: row.price,
    comparePrice: row.compare_price,
    cost: row.cost,
    stock: row.stock,
    weightGrams: row.weight_grams,
    categoryId: row.category_id,
    images: safeJsonParse(row.images),
    colors: safeJsonParse(row.colors),
    sizes: safeJsonParse(row.sizes),
    isActive: !!row.is_active,
    isFeatured: !!row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Public: list products
router.get('/', [
  query('category').optional(),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('featured').optional().isBoolean()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const categorySlug = req.query.category;
  const search = req.query.search;
  const featured = req.query.featured === 'true';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 24;
  const offset = (page - 1) * limit;

  let where = ['p.is_active = 1'];
  const params = [];

  if (categorySlug) {
    where.push('c.slug = ?');
    params.push(categorySlug);
  }
  if (search) {
    where.push('(p.name_fa LIKE ? OR p.name_en LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (featured) {
    where.push('p.is_featured = 1');
  }

  const whereClause = where.join(' AND ');

  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${whereClause}
  `).get(...params);

  const rows = db.prepare(`
    SELECT p.*, c.slug as category_slug, c.name_fa as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${whereClause}
    ORDER BY p.is_featured DESC, p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    success: true,
    data: rows.map(formatProduct),
    pagination: {
      page,
      limit,
      total: countRow.total,
      totalPages: Math.ceil(countRow.total / limit)
    }
  });
});

// Public: single product
router.get('/:slug', (req, res) => {
  const row = db.prepare(`
    SELECT p.*, c.slug as category_slug, c.name_fa as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).get(req.params.slug);

  if (!row) {
    return res.status(404).json({ success: false, message: 'محصول یافت نشد' });
  }

  res.json({ success: true, data: formatProduct(row) });
});

// Admin: create product
router.post('/', authenticate, requireAdmin, [
  body('sku').notEmpty().trim(),
  body('slug').notEmpty().trim(),
  body('nameFa').notEmpty().trim(),
  body('price').isInt({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('categoryId').optional().isInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const {
    sku, slug, nameFa, nameEn, description, price, comparePrice, cost,
    stock, weightGrams, categoryId, images, colors, sizes, isFeatured
  } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO products (sku, slug, name_fa, name_en, description, price, compare_price, cost,
        stock, weight_grams, category_id, images, colors, sizes, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sku, slug, nameFa, nameEn || '', description || '', price,
      comparePrice || null, cost || null, stock || 0, weightGrams || 0,
      categoryId || null, JSON.stringify(images || []), JSON.stringify(colors || []),
      JSON.stringify(sizes || []), isFeatured ? 1 : 0
    );

    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: formatProduct(row) });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'SKU یا اسلاگ قبلاً استفاده شده است' });
    }
    throw err;
  }
});

// Admin: update product
router.put('/:id', authenticate, requireAdmin, [
  body('price').optional().isInt({ min: 0 }),
  body('stock').optional().isInt({ min: 0 })
], (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ success: false, message: 'محصول یافت نشد' });

  const {
    sku, slug, nameFa, nameEn, description, price, comparePrice, cost,
    stock, weightGrams, categoryId, images, colors, sizes, isActive, isFeatured
  } = req.body;

  try {
    db.prepare(`
      UPDATE products SET
        sku = COALESCE(?, sku),
        slug = COALESCE(?, slug),
        name_fa = COALESCE(?, name_fa),
        name_en = COALESCE(?, name_en),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        compare_price = COALESCE(?, compare_price),
        cost = COALESCE(?, cost),
        stock = COALESCE(?, stock),
        weight_grams = COALESCE(?, weight_grams),
        category_id = COALESCE(?, category_id),
        images = COALESCE(?, images),
        colors = COALESCE(?, colors),
        sizes = COALESCE(?, sizes),
        is_active = COALESCE(?, is_active),
        is_featured = COALESCE(?, is_featured),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      sku, slug, nameFa, nameEn, description, price, comparePrice, cost,
      stock, weightGrams, categoryId,
      images ? JSON.stringify(images) : null,
      colors ? JSON.stringify(colors) : null,
      sizes ? JSON.stringify(sizes) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
      id
    );

    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, data: formatProduct(row) });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'SKU یا اسلاگ قبلاً استفاده شده است' });
    }
    throw err;
  }
});

// Admin: delete product
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ success: false, message: 'محصول یافت نشد' });
  }
  res.json({ success: true, message: 'محصول حذف شد' });
});

// Categories
router.get('/categories/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all();
  res.json({ success: true, data: rows });
});

module.exports = router;
