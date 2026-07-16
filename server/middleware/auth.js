const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'noqteh-dev-secret-change-in-production';

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, isAdmin: !!user.is_admin },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'احراز هویت لازم است' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, phone, first_name, last_name, is_admin, is_active FROM users WHERE id = ?').get(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'کاربر غیرفعال است' });
    }
    req.user = { ...user, isAdmin: !!user.is_admin };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'توکن نامعتبر است' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'دسترسی مدیریت لازم است' });
  }
  next();
}

module.exports = { generateToken, authenticate, requireAdmin, JWT_SECRET };
