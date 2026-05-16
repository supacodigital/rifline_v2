const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

router.post('/create-checkout', [
  body('items').isArray({ min: 1 }).withMessage('Le panier est vide.'),
  body('shippingAddress').notEmpty().withMessage("L'adresse de livraison est requise."),
  body('shippingMethodId').optional({ nullable: true }).isInt().withMessage('La méthode de livraison est invalide.'),
], paymentController.createCheckout);

// Pas de validation express-validator sur le webhook — la signature est vérifiée manuellement
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
