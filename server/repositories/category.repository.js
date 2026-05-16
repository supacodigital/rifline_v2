const pool = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.query(
    `SELECT id, name, slug, parent_id, description
     FROM categories
     ORDER BY parent_id ASC, name ASC`
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, name, slug, parent_id, description FROM categories WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

exports.findBySlug = async (slug) => {
  const [rows] = await pool.query(
    'SELECT id FROM categories WHERE slug = ?',
    [slug]
  );
  return rows[0] || null;
};

exports.create = async ({ name, slug, description, parentId }) => {
  const [result] = await pool.query(
    'INSERT INTO categories (name, slug, description, parent_id) VALUES (?, ?, ?, ?)',
    [name, slug, description || null, parentId || null]
  );
  return result.insertId;
};

exports.update = async (id, { name, slug, description, parentId }) => {
  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (slug !== undefined) { fields.push('slug = ?'); params.push(slug); }
  if (description !== undefined) { fields.push('description = ?'); params.push(description || null); }
  if (parentId !== undefined) { fields.push('parent_id = ?'); params.push(parentId || null); }
  if (!fields.length) return;
  params.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, params);
};

exports.remove = async (id) => {
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
};

exports.countProducts = async (id) => {
  const [[{ n }]] = await pool.query(
    'SELECT COUNT(*) AS n FROM products WHERE category_id = ?',
    [id]
  );
  return n;
};
