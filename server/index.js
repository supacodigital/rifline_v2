require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiters');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');
const cartRoutes = require('./routes/cart.routes');
const paymentRoutes = require('./routes/payment.routes');
const shippingRoutes = require('./routes/shipping.routes');
const categoryRoutes = require('./routes/categories.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Derrière le reverse proxy O2switch (Nginx/Passenger) : nécessaire pour que
// le rate-limiter et les cookies secure voient la vraie IP / le bon protocole.
app.set('trust proxy', 1);

// En-têtes de sécurité HTTP (XSS, clickjacking, sniffing…).
app.use(helmet());

const allowedOrigins = [process.env.APP_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les requêtes sans origin (curl, Postman, Supertest)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS non autorisé'));
  },
  credentials: true,
}));

// Le webhook SumUp doit recevoir le corps brut (Buffer) pour vérifier la signature HMAC.
// On exclut donc cette route du parser JSON global (sinon req.body serait un objet déjà
// parsé et la vérification de signature échouerait). Le corps brut est parsé localement
// via express.raw() dans payment.routes.js.
const jsonParser = express.json();
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') return next();
  return jsonParser(req, res, next);
});
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Rate-limit global anti-abus, sauf le webhook SumUp (rafales légitimes possibles).
app.use('/api', (req, res, next) => {
  if (req.path === '/payment/webhook') return next();
  return apiLimiter(req, res, next);
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;

// On démarre le serveur sauf en environnement de test (Supertest importe l'app
// sans la faire écouter). Sous Phusion Passenger (O2switch), le fichier est chargé
// via require() et non exécuté directement, donc `require.main === module` serait
// faux : il faut quand même appeler app.listen() pour que Passenger récupère l'app.
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  const ENV = process.env.NODE_ENV || 'development';

  const pool = require('./config/db');

  const line  = '─'.repeat(52);
  const dim   = (s) => `\x1b[2m${s}\x1b[0m`;
  const bold  = (s) => `\x1b[1m${s}\x1b[0m`;
  const green = (s) => `\x1b[32m${s}\x1b[0m`;
  const cyan  = (s) => `\x1b[36m${s}\x1b[0m`;
  const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
  const red   = (s) => `\x1b[31m${s}\x1b[0m`;
  const row   = (label, value) => `  ${dim(label.padEnd(18))} ${value}`;

  app.listen(PORT, async () => {
    // En production, démarrage silencieux (un seul log informatif) — pas de banner verbeux.
    if (ENV === 'production') {
      console.log(`RifLine API démarrée sur le port ${PORT} (production).`);
      return;
    }

    console.log('');
    console.log(bold(cyan('  ╔══════════════════════════════════════════════════════╗')));
    console.log(bold(cyan('  ║          RifLine API — Serveur démarré               ║')));
    console.log(bold(cyan('  ╚══════════════════════════════════════════════════════╝')));
    console.log('');

    // Infos serveur
    console.log(row('Environnement',  ENV === 'production' ? yellow('production') : green('development')));
    console.log(row('Port',           bold(String(PORT))));
    console.log(row('URL locale',     cyan(`http://localhost:${PORT}`)));
    console.log(row('URL publique',   process.env.APP_URL ? cyan(process.env.APP_URL) : dim('non définie')));
    console.log(row('CORS origines',  allowedOrigins.join(', ')));
    console.log('');

    // Routes enregistrées
    console.log(dim(`  ${line}`));
    console.log(dim('  Routes API'));
    console.log(dim(`  ${line}`));
    const routes = [
      ['POST/GET', '/api/auth/*'],
      ['GET',      '/api/products'],
      ['GET',      '/api/categories'],
      ['POST/GET', '/api/orders/*'],
      ['POST/GET', '/api/cart/*'],
      ['POST',     '/api/payment/*'],
      ['GET',      '/api/shipping/*'],
      ['*',        '/api/admin/*'],
    ];
    routes.forEach(([method, path]) => {
      console.log(`  ${green(method.padEnd(10))} ${path}`);
    });
    console.log('');

    // Test connexion DB
    console.log(dim(`  ${line}`));
    console.log(dim('  Base de données'));
    console.log(dim(`  ${line}`));
    console.log(row('Hôte',    `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`));
    console.log(row('Base',    process.env.DB_NAME || dim('non définie')));
    try {
      const conn = await pool.getConnection();
      const [[{ version }]] = await conn.query('SELECT VERSION() AS version');
      conn.release();
      console.log(row('MySQL',   green(`✓ connecté (${version})`)));
    } catch (err) {
      console.log(row('MySQL',   red(`✗ échec — ${err.message}`)));
    }

    // Services tiers
    console.log('');
    console.log(dim(`  ${line}`));
    console.log(dim('  Services'));
    console.log(dim(`  ${line}`));
    console.log(row('SMTP',      process.env.SMTP_HOST ? green(`✓ ${process.env.SMTP_HOST}`) : yellow('⚠ non configuré')));
    console.log(row('SumUp',     process.env.SUMUP_API_KEY ? green('✓ clé présente') : yellow('⚠ non configuré')));
    console.log(row('Sendcloud', process.env.SENDCLOUD_PUBLIC_KEY ? green('✓ clé présente') : yellow('⚠ non configuré')));
    console.log('');
    console.log(dim(`  ${line}`));
    console.log('');
  });
}
