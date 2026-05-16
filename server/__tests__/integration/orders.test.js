require('dotenv').config();
const request = require('supertest');
const app = require('../../index');
const { cleanDb, seedDb, closeDb, pool } = require('./setup');

let accessToken;
let userId;

beforeAll(async () => {
  await cleanDb();
  await seedDb();

  // Créer un compte et se connecter pour obtenir un token
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'commande@rifline.com', password: 'motdepasse123', firstName: 'Alice', lastName: 'Martin' });

  accessToken = registerRes.body.accessToken;
  userId = registerRes.body.user.id;
});

afterAll(async () => {
  await cleanDb();
  await closeDb();
});

describe('GET /api/orders', () => {
  it('retourne les commandes de l\'utilisateur connecté', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders/:id', () => {
  let orderId;

  beforeAll(async () => {
    // Insérer une commande de test directement en base
    const [result] = await pool.query(
      `INSERT INTO orders (user_id, status, total_amount, shipping_amount,
        shipping_first_name, shipping_last_name, shipping_address,
        shipping_city, shipping_postal_code, shipping_country, shipping_email)
       VALUES (?, 'pending', 59.99, 5.00, 'Alice', 'Martin', '1 rue Test',
        'Lyon', '69001', 'FR', 'commande@rifline.com')`,
      [userId]
    );
    orderId = result.insertId;
  });

  it('retourne le détail d\'une commande appartenant à l\'utilisateur', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('retourne 404 pour une commande inexistante', async () => {
    const res = await request(app)
      .get('/api/orders/99999')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it('retourne 403 si la commande appartient à un autre utilisateur', async () => {
    // Créer un second utilisateur
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'autre@rifline.com', password: 'motdepasse123', firstName: 'Bob', lastName: 'Dupont' });

    const otherToken = res2.body.accessToken;

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});
