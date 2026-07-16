const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');
const { calculateShipping } = require('../utils/shipping');

const router = express.Router();

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `NOQ-${date}-${random}`;
}

function formatOrder(row, items = []) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentStatus: row.payment_status,
    shippingStatus: row.shipping_status,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    discountAmount: row.discount_amount,
    taxAmount: row.tax_amount,
    total: row.total,
    note: row.note,
    trackingCode: row.tracking_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items
  };
}

// Calculate cart totals (used before creating order)
router.post('/calculate', authenticate, [
  body('items').isArray({ min: 1 }),
  body('addressId').isInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { items, addressId } = req.body;
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(addressId, req.user.id);
  if (!address) return res.status(404).json({ success: false, message: 'آدرس یافت نشد' });

  let subtotal = 0;
  let totalWeight = 0;
  const orderItems = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `محصول ${item.productId} یافت نشد` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `موجودی ${product.name_fa} کافی نیست` });
    }
    const total = product.price * item.quantity;
    subtotal += total;
    totalWeight += (product.weight_grams || 0) * item.quantity;
    orderItems.push({
      productId: product.id,
      productName: product.name_fa,
      productSku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      color: item.color,
      size: item.size,
      totalPrice: total
    });
  }

  const shipping = calculateShipping(address.province, address.city, totalWeight, subtotal);
  const total = subtotal + shipping.cost;

  res.json({
    success: true,
    data: {
      items: orderItems,
      subtotal,
      shippingCost: shipping.cost,
      total,
      shippingDetails: shipping
    }
  });
});

// Create order
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }),
  body('addressId').isInt(),
  body('note').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { items, addressId, note } = req.body;
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(addressId, req.user.id);
  if (!address) return res.status(404).json({ success: false, message: 'آدرس یافت نشد' });

  let subtotal = 0;
  let totalWeight = 0;
  const orderItems = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.productId);
    if (!product) return res.status(400).json({ success: false, message: `محصول ${item.productId} یافت نشد` });
    if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `موجودی ${product.name_fa} کافی نیست` });

    const total = product.price * item.quantity;
    subtotal += total;
    totalWeight += (product.weight_grams || 0) * item.quantity;
    orderItems.push({
      productId: product.id,
      productName: product.name_fa,
      productSku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      color: item.color,
      size: item.size,
      totalPrice: total
    });
  }

  const shipping = calculateShipping(address.province, address.city, totalWeight, subtotal);
  const total = subtotal + shipping.cost;
  const orderNumber = generateOrderNumber();

  const result = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (order_number, user_id, address_id, subtotal, shipping_cost, total, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderNumber, req.user.id, address.id, subtotal, shipping.cost, total, note || '');

    const orderId = orderResult.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, color, size, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of orderItems) {
      insertItem.run(orderId, item.productId, item.productName, item.productSku, item.quantity, item.unitPrice, item.color || '', item.size || '', item.totalPrice);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.productId);
    }

    return orderId;
  })();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result);
  const savedItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(result);

  res.status(201).json({ success: true, data: formatOrder(order, savedItems) });
});

// User order history
router.get('/my', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const data = rows.map(row => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row.id);
    return formatOrder(row, items);
  });
  res.json({ success: true, data });
});

// Get single order (user or admin)
router.get('/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });
  if (!req.user.isAdmin && order.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(order.address_id);
  res.json({ success: true, data: { ...formatOrder(order, items), address: address ? {
    title: address.title,
    recipientName: address.recipient_name,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    postalCode: address.postal_code,
    address: address.address
  } : null }});
});

// Admin: list all orders
router.get('/', authenticate, requireAdmin, (req, res) => {
  const { status, paymentStatus, search } = req.query;
  let where = ['1=1'];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (paymentStatus) { where.push('payment_status = ?'); params.push(paymentStatus); }
  if (search) {
    where.push('(order_number LIKE ? OR id LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like);
  }

  const rows = db.prepare(`
    SELECT o.*, u.email as user_email, u.first_name, u.last_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE ${where.join(' AND ')}
    ORDER BY o.created_at DESC
  `).all(...params);

  const data = rows.map(row => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(row.id);
    return {
      ...formatOrder(row, items),
      user: row.user_id ? { id: row.user_id, email: row.user_email, name: `${row.first_name} ${row.last_name}`.trim() } : null
    };
  });
  res.json({ success: true, data });
});

// Admin: update order status
router.put('/:id/status', authenticate, requireAdmin, [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
  body('paymentStatus').optional().isIn(['unpaid', 'paid', 'refunded', 'failed']),
  body('shippingStatus').optional().isIn(['pending', 'ready', 'shipped', 'delivered']),
  body('trackingCode').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { status, paymentStatus, shippingStatus, trackingCode } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });

  let shippedAt = order.shipped_at;
  let deliveredAt = order.delivered_at;
  if (shippingStatus === 'shipped' && order.shipping_status !== 'shipped') shippedAt = new Date().toISOString();
  if (shippingStatus === 'delivered' && order.shipping_status !== 'delivered') deliveredAt = new Date().toISOString();

  db.prepare(`
    UPDATE orders SET
      status = COALESCE(?, status),
      payment_status = COALESCE(?, payment_status),
      shipping_status = COALESCE(?, shipping_status),
      tracking_code = COALESCE(?, tracking_code),
      shipped_at = COALESCE(?, shipped_at),
      delivered_at = COALESCE(?, delivered_at),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, paymentStatus, shippingStatus, trackingCode, shippedAt, deliveredAt, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(updated.id);
  res.json({ success: true, data: formatOrder(updated, items) });
});

module.exports = router;
