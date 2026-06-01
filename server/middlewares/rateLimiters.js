const rateLimit = require('express-rate-limit');

// Limiteur strict pour les routes d'authentification sensibles (anti brute-force).
// 10 tentatives par fenêtre de 15 min et par IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
});

// Limiteur global plus permissif pour l'ensemble de l'API (anti-abus).
// 300 requêtes par fenêtre de 15 min et par IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
});

module.exports = { authLimiter, apiLimiter };
