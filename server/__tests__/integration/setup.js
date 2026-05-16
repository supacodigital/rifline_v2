require('dotenv').config();
const pool = require('../../config/db');

// Nettoie les tables de test dans l'ordre (contraintes FK)
const cleanDb = async () => {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE order_items');
  await pool.query('TRUNCATE TABLE orders');
  await pool.query('TRUNCATE TABLE refresh_tokens');
  await pool.query('TRUNCATE TABLE product_images');
  await pool.query('TRUNCATE TABLE products');
  await pool.query('TRUNCATE TABLE categories');
  await pool.query('TRUNCATE TABLE users');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
};

// Insère des données de base réutilisables
const seedDb = async () => {
  const [catResult] = await pool.query(
    "INSERT INTO categories (name, slug) VALUES ('Électronique', 'electronique')"
  );

  const [prodResult] = await pool.query(
    `INSERT INTO products (name, slug, description, price, stock, weight, sku, category_id, is_active)
     VALUES ('Casque Audio', 'casque-audio', 'Un bon casque', 49.99, 10, 0.3, 'SKU-001', ?, TRUE)`,
    [catResult.insertId]
  );

  await pool.query(
    `INSERT INTO product_images (product_id, url, alt, is_primary) VALUES (?, '/images/casque.jpg', 'Casque Audio', TRUE)`,
    [prodResult.insertId]
  );

  return { categoryId: catResult.insertId, productId: prodResult.insertId };
};

const closeDb = async () => {
  await pool.end();
};

module.exports = { cleanDb, seedDb, closeDb, pool };
