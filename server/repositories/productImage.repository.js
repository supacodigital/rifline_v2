const pool = require('../config/db');
const { toAbsoluteUrl } = require('../utils/urls');

exports.findByProductId = async (productId) => {
  const [rows] = await pool.query(
    'SELECT id, url, alt, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC',
    [productId]
  );
  return rows.map((r) => ({ ...r, url: toAbsoluteUrl(r.url) }));
};

exports.create = async ({ productId, url, alt, isPrimary, sortOrder }) => {
  const [result] = await pool.query(
    'INSERT INTO product_images (product_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
    [productId, url, alt || null, isPrimary ? 1 : 0, sortOrder || 0]
  );
  return result.insertId;
};

exports.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, product_id, url, is_primary FROM product_images WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

exports.remove = async (id) => {
  await pool.query('DELETE FROM product_images WHERE id = ?', [id]);
};

exports.clearPrimary = async (productId) => {
  await pool.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = ?', [productId]);
};

exports.setPrimary = async (id) => {
  await pool.query('UPDATE product_images SET is_primary = TRUE WHERE id = ?', [id]);
};

exports.countByProductId = async (productId) => {
  const [[{ n }]] = await pool.query(
    'SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?',
    [productId]
  );
  return n;
};
