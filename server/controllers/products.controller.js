const { validationResult } = require('express-validator');
const productRepository = require('../repositories/product.repository');

exports.getAll = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const category = req.query.category || null;
    const search = req.query.q || null;
    const sort = req.query.sort || 'newest';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const inStock = req.query.inStock === 'true';

    const { data, total } = await productRepository.findAll({ page, limit, category, search, sort, minPrice, maxPrice, inStock });

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getFeatured = async (req, res, next) => {
  try {
    const data = await productRepository.findFeatured();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const product = await productRepository.findBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};
