const db = require('../db');

function getSetting(key, defaultValue) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : defaultValue;
}

function calculateShipping(province, city, weightGrams = 0, subtotal = 0) {
  const baseCost = parseInt(getSetting('shipping.base_cost', '65000'), 10);
  const freeThreshold = parseInt(getSetting('shipping.free_threshold', '1500000'), 10);

  // Free shipping for orders above threshold
  if (subtotal >= freeThreshold) {
    return { cost: 0, free: true, baseCost, freeThreshold };
  }

  // Weight surcharge: every 500g above 1kg adds base cost * 0.3
  let weightSurcharge = 0;
  if (weightGrams > 1000) {
    const extraHalfKgs = Math.ceil((weightGrams - 1000) / 500);
    weightSurcharge = extraHalfKgs * Math.round(baseCost * 0.3);
  }

  // Tehran/tehran discount
  const isTehran = province?.toLowerCase().includes('تهران') || city?.toLowerCase().includes('تهران');
  const regionDiscount = isTehran ? Math.round(baseCost * 0.2) : 0;

  const cost = Math.max(0, baseCost + weightSurcharge - regionDiscount);
  return { cost, free: false, baseCost, freeThreshold, weightSurcharge, regionDiscount };
}

module.exports = { calculateShipping, getSetting };
