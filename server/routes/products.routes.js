const express = require('express');
const { query } = require('express-validator');
const productsController = require('../controllers/products.controller');

const router = express.Router();

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide.'),
  query('category').optional().isString(),
  query('q').optional().isString().trim().isLength({ max: 100 }),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('inStock').optional().isBoolean(),
], productsController.getAll);

router.get('/featured', productsController.getFeatured);

router.get('/:slug', productsController.getBySlug);

module.exports = router;
