require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');
const cartRoutes = require('./routes/cart.routes');
const paymentRoutes = require('./routes/payment.routes');
const shippingRoutes = require('./routes/shipping.routes');
const categoryRoutes = require('./routes/categories.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

const allowedOrigins = [process.env.APP_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les requêtes sans origin (curl, Postman, Supertest)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS non autorisé'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}
