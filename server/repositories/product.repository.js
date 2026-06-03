const pool = require('../config/db');
const { toAbsoluteUrl } = require('../utils/urls');

const SORT_MAP = {
  'newest':     'p.created_at DESC',
  'price_asc':  'p.price ASC',
  'price_desc': 'p.price DESC',
};

exports.findAll = async ({ page, limit, category, search, sort = 'newest', minPrice, maxPrice, inStock, includeInactive = false, status = null, stock = null }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (!includeInactive) {
    conditions.push('p.is_active = TRUE');
  }
  // Filtre statut admin (active / inactive)
  if (includeInactive && status === 'active') {
    conditions.push('p.is_active = TRUE');
  } else if (includeInactive && status === 'inactive') {
    conditions.push('p.is_active = FALSE');
  }
  // Filtre stock épuisé admin
  if (stock === 'out') {
    conditions.push('p.stock = 0');
  } else if (stock === 'low') {
    conditions.push('p.stock > 0 AND p.stock <= 5');
  }
  if (category) {
    // On filtre sur la catégorie sélectionnée ET ses sous-catégories : un produit
    // rangé dans une sous-catégorie (ex. « Parfums hommes ») doit apparaître quand on
    // clique sur la catégorie parente (ex. « Parfums »). `category` peut arriver en
    // slug ou en id ; on résout d'abord l'id de la catégorie sélectionnée, puis on
    // inclut les produits dont la catégorie est cette catégorie ou un de ses enfants.
    conditions.push(`(
      p.category_id IN (
        SELECT sel.id FROM categories sel WHERE sel.slug = ? OR sel.id = ?
      )
      OR p.category_id IN (
        SELECT child.id FROM categories child
        WHERE child.parent_id IN (
          SELECT sel2.id FROM categories sel2 WHERE sel2.slug = ? OR sel2.id = ?
        )
      )
    )`);
    params.push(category, category, category, category);
  }
  if (search) {
    conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (minPrice !== undefined && minPrice !== null) {
    conditions.push('p.price >= ?');
    params.push(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    conditions.push('p.price <= ?');
    params.push(maxPrice);
  }
  if (inStock) {
    conditions.push('p.stock > 0');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = SORT_MAP[sort] || SORT_MAP['newest'];

  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_price, p.stock, p.weight, p.sku, p.is_active, p.is_featured,
            c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS image_url
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${where}`,
    params
  );

  return { data: rows.map((r) => ({ ...r, image_url: toAbsoluteUrl(r.image_url) })), total };
};

exports.findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, name, slug, description, price, compare_price, stock, weight, sku, category_id, is_active, is_featured
     FROM products WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.findBySlug = async (slug) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_price, p.stock, p.weight, p.sku,
            c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? AND p.is_active = TRUE`,
    [slug]
  );
  if (!rows[0]) return null;

  const product = rows[0];
  const [images] = await pool.query(
    'SELECT id, url, alt, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    [product.id]
  );
  product.images = images.map((img) => ({ ...img, url: toAbsoluteUrl(img.url) }));
  return product;
};

exports.create = async ({ name, slug, description, price, comparePrice, stock, weight, sku, categoryId }) => {
  const [result] = await pool.query(
    `INSERT INTO products (name, slug, description, price, compare_price, stock, weight, sku, category_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, slug, description || null, price, comparePrice || null, stock || 0, weight || 0, sku || null, categoryId || null]
  );
  return result.insertId;
};

exports.update = async (id, fields) => {
  const allowed = ['name', 'slug', 'description', 'price', 'compare_price', 'stock', 'weight', 'sku', 'category_id', 'is_active', 'is_featured'];
  const updates = [];
  const params = [];

  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(val);
    }
  }

  if (!updates.length) return;
  params.push(id);
  await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
};

exports.findFeatured = async () => {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.stock, p.is_featured,
            c.name AS category_name, c.slug AS category_slug,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS image_url
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = TRUE AND p.is_featured = TRUE
     ORDER BY p.updated_at DESC`
  );
  return rows.map((r) => ({ ...r, image_url: toAbsoluteUrl(r.image_url) }));
};

exports.remove = async (id) => {
  await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
};
