const express = require('express');
const { query } = require('express-validator');
const shippingController = require('../controllers/shipping.controller');

const router = express.Router();

router.get('/methods', [
  query('weight').notEmpty().isFloat({ min: 0 }).withMessage('Poids invalide.'),
  query('country').notEmpty().isLength({ min: 2, max: 2 }).withMessage('Code pays invalide (ex: FR).'),
], shippingController.getMethods);

module.exports = router;
