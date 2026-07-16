const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticate, requireAdmin, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE payment_status = 'paid'").get().sum;
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get().count;
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_admin = 0").get().count;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;

  const recentOrders = db.prepare(`
    SELECT o.*, u.email as user_email FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  res.json({
    success: true,
    data: {
      stats: { totalOrders, totalRevenue, totalProducts, totalUsers, pendingOrders },
      recentOrders
    }
  });
});

// Users list
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, email, phone, first_name, last_name, is_admin, is_active, created_at FROM users ORDER BY id DESC').all();
  res.json({ success: true, data: rows });
});

// Update user active/admin status
router.put('/users/:id', authenticate, requireAdmin, [
  body('isAdmin').optional().isBoolean(),
  body('isActive').optional().isBoolean()
], (req, res) => {
  const { isAdmin, isActive } = req.body;
  db.prepare('UPDATE users SET is_admin = COALESCE(?, is_admin), is_active = COALESCE(?, is_active) WHERE id = ?')
    .run(isAdmin !== undefined ? (isAdmin ? 1 : 0) : null, isActive !== undefined ? (isActive ? 1 : 0) : null, req.params.id);
  res.json({ success: true, message: 'کاربر بروزرسانی شد' });
});

// Settings
router.get('/settings', authenticate, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json({ success: true, data: settings });
});

router.put('/settings', authenticate, requireAdmin, (req, res) => {
  const updates = req.body;
  const stmt = db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');
  db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, String(value));
    }
  })();
  res.json({ success: true, message: 'تنظیمات ذخیره شد' });
});

module.exports = router;
