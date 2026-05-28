const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const adminProductsController = require('../controllers/admin/adminProducts.controller');
const adminOrdersController = require('../controllers/admin/adminOrders.controller');
const adminUsersController = require('../controllers/admin/adminUsers.controller');
const adminStatsController = require('../controllers/admin/adminStats.controller');
const adminCategoriesController = require('../controllers/admin/adminCategories.controller');
const adminImagesController = require('../controllers/admin/adminImages.controller');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

const productCreateRules = [
  body('name').trim().notEmpty().withMessage('Nom requis.'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide.'),
  body('stock').isInt({ min: 0 }).withMessage('Stock invalide.'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Poids invalide.'),
  body('categoryId').optional({ nullable: true }).isInt().withMessage('Catégorie invalide.'),
];

const productUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Nom invalide.'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Prix invalide.'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock invalide.'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Poids invalide.'),
  body('categoryId').optional({ nullable: true }).isInt().withMessage('Catégorie invalide.'),
];

const VALID_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const orderStatusRules = [
  body('status').isIn(VALID_STATUSES).withMessage('Statut de commande invalide.'),
];

const categoryRules = [
  body('name').trim().notEmpty().withMessage('Nom de catégorie requis.'),
];

// Stats
router.get('/stats', adminStatsController.getStats);

// Produits
router.get('/products', adminProductsController.getAll);
router.post('/products', productCreateRules, adminProductsController.create);
router.put('/products/:id', productUpdateRules, adminProductsController.update);
router.delete('/products/:id', adminProductsController.remove);
router.patch('/products/:id/featured', adminProductsController.toggleFeatured);

// Commandes
router.get('/orders', adminOrdersController.getAll);
router.get('/orders/:id', adminOrdersController.getOne);
router.put('/orders/:id/status', orderStatusRules, adminOrdersController.updateStatus);
router.put('/orders/:id/tracking', [
  body('trackingNumber').trim().notEmpty().withMessage('Numéro de suivi requis.'),
], adminOrdersController.updateTracking);

// Utilisateurs
router.get('/users', adminUsersController.getAll);
router.put('/users/:id/role', [
  body('role').isIn(['customer', 'admin']).withMessage('Rôle invalide.'),
], adminUsersController.updateRole);

// Images produits
router.get('/products/:id/images', adminImagesController.getImages);
router.post('/products/:id/images', upload.single('image'), adminImagesController.upload);
router.delete('/products/:id/images/:imageId', adminImagesController.remove);
router.put('/products/:id/images/:imageId/primary', adminImagesController.setPrimary);

// Catégories
router.get('/categories', adminCategoriesController.getAll);
router.post('/categories', categoryRules, adminCategoriesController.create);
router.put('/categories/:id', adminCategoriesController.update);
router.delete('/categories/:id', adminCategoriesController.remove);

module.exports = router;
