const pool = require('../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT id, email, password_hash, first_name, last_name, phone, role FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

exports.findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

exports.create = async ({ email, passwordHash, firstName, lastName, phone }) => {
  const [result] = await pool.query(
    'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
    [email, passwordHash, firstName, lastName, phone || null]
  );
  return { id: result.insertId, email, firstName, lastName, role: 'customer' };
};

exports.updateProfile = async (id, { firstName, lastName, email, phone }) => {
  await pool.query(
    'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?',
    [firstName, lastName, email, phone || null, id]
  );
};

exports.updatePassword = async (id, passwordHash) => {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
};

exports.updateRole = async (id, role) => {
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
};

exports.findAll = async ({ page, limit, search }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, \' \', last_name) LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT id, email, first_name, last_name, phone, role, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  return { data: rows, total };
};
