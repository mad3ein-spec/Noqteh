const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

function formatAddress(row) {
  return {
    id: row.id,
    title: row.title,
    recipientName: row.recipient_name,
    phone: row.phone,
    province: row.province,
    city: row.city,
    district: row.district,
    postalCode: row.postal_code,
    address: row.address,
    isDefault: !!row.is_default
  };
}

// Get user addresses
router.get('/', authenticate, (req, res) => {
  const rows = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
  res.json({ success: true, data: rows.map(formatAddress) });
});

// Create address
router.post('/', authenticate, [
  body('recipientName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('province').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('address').notEmpty().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { title, recipientName, phone, province, city, district, postalCode, address, isDefault } = req.body;

  db.transaction(() => {
    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    const result = db.prepare(`
      INSERT INTO addresses (user_id, title, recipient_name, phone, province, city, district, postal_code, address, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title || '', recipientName, phone, province, city, district || '', postalCode || '', address, isDefault ? 1 : 0);

    const row = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: formatAddress(row) });
  })();
});

// Update address
router.put('/:id', authenticate, (req, res) => {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!address) return res.status(404).json({ success: false, message: 'آدرس یافت نشد' });

  const { title, recipientName, phone, province, city, district, postalCode, address: addr, isDefault } = req.body;

  db.transaction(() => {
    if (isDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }
    db.prepare(`
      UPDATE addresses SET
        title = COALESCE(?, title),
        recipient_name = COALESCE(?, recipient_name),
        phone = COALESCE(?, phone),
        province = COALESCE(?, province),
        city = COALESCE(?, city),
        district = COALESCE(?, district),
        postal_code = COALESCE(?, postal_code),
        address = COALESCE(?, address),
        is_default = COALESCE(?, is_default)
      WHERE id = ?
    `).run(title, recipientName, phone, province, city, district, postalCode, addr, isDefault !== undefined ? (isDefault ? 1 : 0) : null, req.params.id);

    const row = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: formatAddress(row) });
  })();
});

// Delete address
router.delete('/:id', authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: 'آدرس یافت نشد' });
  res.json({ success: true, message: 'آدرس حذف شد' });
});

module.exports = router;
