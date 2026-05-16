require('dotenv').config();
const request = require('supertest');
const app = require('../../index');
const { cleanDb, seedDb, closeDb, pool } = require('./setup');
const bcrypt = require('bcrypt');

let adminToken;
let customerToken;

beforeAll(async () => {
  await cleanDb();
  await seedDb();

  // Créer un admin directement en base
  const hash = await bcrypt.hash('admin123456', 12);
  await pool.query(
    "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ('admin@rifline.com', ?, 'Admin', 'Rifline', 'admin')",
    [hash]
  );

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@rifline.com', password: 'admin123456' });
  adminToken = adminLogin.body.accessToken;

  // Créer un client normal
  const customerLogin = await request(app)
    .post('/api/auth/register')
    .send({ email: 'client@rifline.com', password: 'motdepasse123', firstName: 'Client', lastName: 'Test' });
  customerToken = customerLogin.body.accessToken;
});

afterAll(async () => {
  await cleanDb();
  await closeDb();
});

describe('GET /api/admin/products', () => {
  it('retourne tous les produits (admin)', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('retourne 403 pour un utilisateur non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/orders/:id/status', () => {
  let orderId;

  beforeAll(async () => {
    const [result] = await pool.query(
      `INSERT INTO orders (user_id, status, total_amount, shipping_amount,
        shipping_first_name, shipping_last_name, shipping_address,
        shipping_city, shipping_postal_code, shipping_country, shipping_email)
       VALUES (NULL, 'pending', 29.99, 0, 'Test', 'Client', '1 rue Admin',
        'Paris', '75000', 'FR', 'client@rifline.com')`
    );
    orderId = result.insertId;
  });

  it('met à jour le statut d\'une commande (admin)', async () => {
    const res = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'paid' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Statut mis à jour.');
  });

  it('retourne 422 pour un statut invalide', async () => {
    const res = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'statut_inexistant' });

    expect(res.status).toBe(422);
  });

  it('retourne 403 pour un non-admin', async () => {
    const res = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'paid' });

    expect(res.status).toBe(403);
  });
});
