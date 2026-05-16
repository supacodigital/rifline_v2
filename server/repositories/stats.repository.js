const pool = require('../config/db');

exports.getStats = async () => {
  const [[{ revenue30d }]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue30d
     FROM orders
     WHERE status NOT IN ('cancelled', 'refunded')
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
  );

  const [[{ totalOrders }]] = await pool.query(
    "SELECT COUNT(*) AS totalOrders FROM orders WHERE status != 'cancelled'"
  );

  const [[{ activeProducts }]] = await pool.query(
    'SELECT COUNT(*) AS activeProducts FROM products WHERE is_active = 1'
  );

  const [[{ totalUsers }]] = await pool.query(
    "SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'customer'"
  );

  return { revenue30d, totalOrders, activeProducts, totalUsers };
};
