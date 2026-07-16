const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('ایمیل نامعتبر است'),
  body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, firstName, lastName, phone } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'این ایمیل قبلاً ثبت شده است' });
  }

  if (phone) {
    const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'این شماره موبایل قبلاً ثبت شده است' });
    }
  }

  const hash = bcrypt.hashSync(password, 10);
  let result;
  try {
    result = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, hash, firstName || '', lastName || '', phone || null);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'این ایمیل یا شماره موبایل قبلاً ثبت شده است' });
    }
    throw err;
  }

  const user = db.prepare('SELECT id, email, phone, first_name, last_name, is_admin FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'ثبت‌نام با موفقیت انجام شد',
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: !!user.is_admin
    }
  });
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: 'ایمیل یا رمز عبور اشتباه است' });
  }
  if (!user.is_active) {
    return res.status(401).json({ success: false, message: 'حساب کاربری غیرفعال است' });
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: !!user.is_admin
    }
  });
});

// Me
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      isAdmin: req.user.isAdmin
    }
  });
});

// Update profile
router.put('/me', authenticate, [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim()
], (req, res) => {
  const { firstName, lastName, phone } = req.body;
  db.prepare(`
    UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(firstName || req.user.first_name, lastName || req.user.last_name, phone || req.user.phone, req.user.id);
  res.json({ success: true, message: 'پروفایل بروزرسانی شد' });
});

// Change password
router.put('/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ success: false, message: 'رمز عبور فعلی اشتباه است' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ success: true, message: 'رمز عبور تغییر کرد' });
});

module.exports = router;
