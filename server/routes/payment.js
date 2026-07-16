const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const ZARINPAL_API = 'https://api.zarinpal.com/pg/v4/payment';
const ZARINPAL_SANDBOX_API = 'https://sandbox.zarinpal.com/pg/v4/payment';

function getMerchantId() {
  return process.env.ZARINPAL_MERCHANT_ID || db.prepare("SELECT value FROM settings WHERE key = 'zarinpal.merchant_id'").get()?.value || '';
}

function isSandbox() {
  const env = process.env.ZARINPAL_SANDBOX;
  if (env !== undefined) return env === 'true';
  const row = db.prepare("SELECT value FROM settings WHERE key = 'zarinpal.sandbox'").get();
  return row?.value === 'true';
}

// Request payment
router.post('/request', authenticate, [
  body('orderId').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { orderId } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.user.id);
  if (!order) return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });
  if (order.payment_status === 'paid') return res.status(400).json({ success: false, message: 'سفارش قبلاً پرداخت شده است' });

  const merchantId = getMerchantId();
  if (!merchantId || merchantId.includes('xxxx')) {
    return res.status(400).json({ success: false, message: 'کد مرچنت زرین‌پال تنظیم نشده است' });
  }

  const amount = order.total; // Toman / Rial based on merchant config
  const description = `پرداخت سفارش ${order.order_number}`;
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 9000}`;
  const callbackUrl = `${frontendUrl}/api/payment/verify`;

  const baseUrl = isSandbox() ? ZARINPAL_SANDBOX_API : ZARINPAL_API;

  try {
    const response = await fetch(`${baseUrl}/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount,
        description,
        callback_url: callbackUrl,
        metadata: { order_id: order.id, user_id: req.user.id }
      })
    });
    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return res.status(400).json({ success: false, message: 'خطا در اتصال به زرین‌پال', errors: data.errors });
    }

    const authority = data.data.authority;
    db.prepare(`
      INSERT INTO payments (order_id, authority, amount, gateway, status)
      VALUES (?, ?, ?, 'zarinpal', 'pending')
    `).run(order.id, authority, amount);

    const gatewayUrl = isSandbox()
      ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
      : `https://www.zarinpal.com/pg/StartPay/${authority}`;

    res.json({ success: true, data: { authority, gatewayUrl, amount } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطا در ارتباط با درگاه پرداخت', error: err.message });
  }
});

// Verify payment (callback)
router.get('/verify', async (req, res) => {
  const { Authority, Status } = req.query;
  if (!Authority || Status !== 'OK') {
    return res.redirect('/payment-failed.html');
  }

  const payment = db.prepare('SELECT * FROM payments WHERE authority = ?').get(Authority);
  if (!payment) return res.redirect('/payment-failed.html');

  const merchantId = getMerchantId();
  const baseUrl = isSandbox() ? ZARINPAL_SANDBOX_API : ZARINPAL_API;

  try {
    const response = await fetch(`${baseUrl}/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: payment.amount,
        authority: Authority
      })
    });
    const data = await response.json();

    const refId = data.data?.ref_id;
    const cardPan = data.data?.card_pan;
    const cardHash = data.data?.card_hash;
    const fee = data.data?.fee;

    if (data.errors && Object.keys(data.errors).length > 0) {
      db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
      return res.redirect(`/payment-failed.html?authority=${Authority}`);
    }

    if (refId) {
      db.prepare(`
        UPDATE payments SET status = 'verified', ref_id = ?, card_pan = ?, card_hash = ?, fee = ?, verified_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(String(refId), cardPan || '', cardHash || '', fee || 0, payment.id);

      db.prepare(`
        UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(payment.order_id);

      return res.redirect(`/payment-success.html?order=${payment.order_id}&ref=${refId}`);
    }

    db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
    return res.redirect(`/payment-failed.html?authority=${Authority}`);
  } catch (err) {
    return res.redirect(`/payment-failed.html?authority=${Authority}`);
  }
});

module.exports = router;
