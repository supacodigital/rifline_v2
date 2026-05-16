const express = require('express');
const ordersController = require('../controllers/orders.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, ordersController.getUserOrders);
router.get('/:id', optionalAuth, ordersController.getOrderById);

module.exports = router;
