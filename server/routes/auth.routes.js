const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.post('/register', authLimiter, [
  body('email').isEmail().withMessage('Adresse email invalide.'),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis.'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis.'),
], authController.register);

router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Adresse email invalide.'),
  body('password').notEmpty().withMessage('Le mot de passe est requis.'),
], authController.login);

router.post('/forgot-password', authLimiter, [
  body('email').isEmail().withMessage('Adresse email invalide.'),
], authController.forgotPassword);

router.post('/reset-password', authLimiter, [
  body('token').notEmpty().withMessage('Token requis.'),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
], authController.resetPassword);

router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);

router.get('/me', authMiddleware, authController.me);

router.put('/profile', authMiddleware, [
  body('email').isEmail().withMessage('Adresse email invalide.'),
  body('firstName').trim().notEmpty().withMessage('Le prénom est requis.'),
  body('lastName').trim().notEmpty().withMessage('Le nom est requis.'),
], authController.updateProfile);

router.put('/password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis.'),
  body('newPassword').isLength({ min: 8 }).withMessage('Minimum 8 caractères.'),
], authController.updatePassword);

module.exports = router;
