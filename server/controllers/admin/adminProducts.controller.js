const { validationResult } = require('express-validator');
const productRepository = require('../../repositories/product.repository');

const toSlug = (str) =>
  str.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueSlug = async (base) => {
  let slug = base;
  let i = 1;
  while (await productRepository.findBySlug(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || null;
    const category = req.query.category || null;
    const status = req.query.status || null;       // 'active' | 'inactive'
    const stock = req.query.stock || null;          // 'out'
    const { data, total } = await productRepository.findAll({
      page, limit, includeInactive: true, search, category, status, stock,
    });
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, description, price, comparePrice, stock, weight, sku, categoryId } = req.body;
    const slug = await uniqueSlug(toSlug(name));
    const id = await productRepository.create({ name, slug, description, price, comparePrice, stock, weight, sku, categoryId });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, description, price, comparePrice, stock, weight, sku, categoryId, isActive } = req.body;
    const fields = {};
    if (name !== undefined) fields.name = name;
    if (description !== undefined) fields.description = description;
    if (price !== undefined) fields.price = price;
    if (comparePrice !== undefined) fields.compare_price = comparePrice;
    if (stock !== undefined) fields.stock = stock;
    if (weight !== undefined) fields.weight = weight;
    if (sku !== undefined) fields.sku = sku;
    if (categoryId !== undefined) fields.category_id = categoryId;
    if (isActive !== undefined) fields.is_active = isActive;
    await productRepository.update(req.params.id, fields);
    res.json({ message: 'Produit mis à jour.' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await productRepository.remove(req.params.id);
    res.json({ message: 'Produit supprimé.' });
  } catch (err) {
    next(err);
  }
};

exports.toggleFeatured = async (req, res, next) => {
  try {
    const product = await productRepository.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
    await productRepository.update(req.params.id, { is_featured: !product.is_featured });
    res.json({ is_featured: !product.is_featured });
  } catch (err) {
    next(err);
  }
};
