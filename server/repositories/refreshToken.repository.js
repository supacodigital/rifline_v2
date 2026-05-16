const pool = require('../config/db');

exports.create = async ({ userId, token, expiresAt }) => {
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
};

exports.findByToken = async (token) => {
  const [rows] = await pool.query(
    'SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = ?',
    [token]
  );
  return rows[0] || null;
};

exports.deleteByToken = async (token) => {
  await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
};

exports.deleteByUserId = async (userId) => {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};
