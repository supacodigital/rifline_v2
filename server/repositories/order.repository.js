const pool = require('../config/db');
const crypto = require('crypto');

exports.findByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, status, total_amount, shipping_amount, tracking_number, created_at, paid_at, shipped_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, user_id, guest_token, status, total_amount, shipping_amount, shipping_method_id,
            shipping_first_name, shipping_last_name, shipping_address, shipping_city,
            shipping_postal_code, shipping_country, shipping_email, shipping_phone,
            sumup_checkout_id, tracking_number, label_url, sendcloud_parcel_id,
            created_at, paid_at, shipped_at
     FROM orders WHERE id = ?`,
    [id]
  );
  if (!rows[0]) return null;

  const order = rows[0];
  const [items] = await pool.query(
    `SELECT id, product_id, product_name, product_sku, unit_price, quantity, weight
     FROM order_items WHERE order_id = ?`,
    [id]
  );
  order.items = items;
  return order;
};

exports.findByCheckoutId = async (checkoutId) => {
  const [rows] = await pool.query(
    'SELECT id, user_id, status, shipping_method_id FROM orders WHERE sumup_checkout_id = ?',
    [checkoutId]
  );
  return rows[0] || null;
};

exports.findAll = async ({ page, limit, status, search }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(shipping_first_name LIKE ? OR shipping_last_name LIKE ? OR shipping_email LIKE ? OR CONCAT(shipping_first_name, \' \', shipping_last_name) LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT id, user_id, status, total_amount, shipping_amount,
            shipping_first_name, shipping_last_name, shipping_email, tracking_number, created_at
     FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders ${where}`, params);
  return { data: rows, total };
};

exports.create = async ({ userId, items, shippingAddress, totalAmount, shippingAmount, shippingMethodId }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Token de vérification pour les commandes invités
    const guestToken = userId ? null : crypto.randomBytes(32).toString('hex');

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, guest_token, status, total_amount, shipping_amount, shipping_method_id,
        shipping_first_name, shipping_last_name, shipping_address, shipping_city,
        shipping_postal_code, shipping_country, shipping_email, shipping_phone)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        guestToken,
        totalAmount,
        shippingAmount,
        shippingMethodId || null,
        shippingAddress.firstName,
        shippingAddress.lastName,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.postalCode,
        shippingAddress.country || 'FR',
        shippingAddress.email,
        shippingAddress.phone || null,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.productSku || null, item.unitPrice, item.quantity, item.weight || 0]
      );
      // Décrémenter le stock
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.productId]);
    }

    await conn.commit();
    return { orderId, guestToken };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.updateCheckoutId = async (orderId, checkoutId) => {
  await pool.query('UPDATE orders SET sumup_checkout_id = ? WHERE id = ?', [checkoutId, orderId]);
};

exports.updateStatus = async (orderId, status, extra = {}) => {
  const updates = ['status = ?'];
  const params = [status];

  if (extra.transactionId) {
    updates.push('sumup_transaction_id = ?');
    params.push(extra.transactionId);
  }
  if (extra.paidAt) {
    updates.push('paid_at = ?');
    params.push(extra.paidAt);
  }
  if (extra.shippedAt) {
    updates.push('shipped_at = ?');
    params.push(extra.shippedAt);
  }

  params.push(orderId);
  await pool.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
};

exports.updateTracking = async (orderId, trackingNumber) => {
  await pool.query(
    `UPDATE orders SET tracking_number = ?, status = 'shipped', shipped_at = NOW() WHERE id = ?`,
    [trackingNumber, orderId]
  );
};

exports.updateShipping = async (orderId, { trackingNumber, labelUrl, sendcloudParcelId, status }) => {
  await pool.query(
    `UPDATE orders SET tracking_number = ?, label_url = ?, sendcloud_parcel_id = ?, status = ?, shipped_at = NOW()
     WHERE id = ?`,
    [trackingNumber, labelUrl, sendcloudParcelId, status, orderId]
  );
};
