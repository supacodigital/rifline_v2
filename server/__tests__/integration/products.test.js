require('dotenv').config();
const request = require('supertest');
const app = require('../../index');
const { cleanDb, seedDb, closeDb } = require('./setup');

let productSlug;

beforeAll(async () => {
  await cleanDb();
  await seedDb();
  productSlug = 'casque-audio';
});

afterAll(async () => {
  await cleanDb();
  await closeDb();
});

describe('GET /api/products', () => {
  it('retourne la liste paginée des produits actifs', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 24 });
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('respecte les paramètres page et limit', async () => {
    const res = await request(app).get('/api/products?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.page).toBe(1);
  });

  it('retourne 422 si page est invalide', async () => {
    const res = await request(app).get('/api/products?page=abc');
    expect(res.status).toBe(422);
  });

  it('filtre par catégorie', async () => {
    const res = await request(app).get('/api/products?category=electronique');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('retourne un tableau vide pour une catégorie inexistante', async () => {
    const res = await request(app).get('/api/products?category=inexistante');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });
});

describe('GET /api/products/:slug', () => {
  it('retourne le détail d\'un produit avec ses images', async () => {
    const res = await request(app).get(`/api/products/${productSlug}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      slug: productSlug,
      name: 'Casque Audio',
      price: '49.99',
    });
    expect(Array.isArray(res.body.images)).toBe(true);
    expect(res.body.images.length).toBeGreaterThan(0);
  });

  it('retourne 404 pour un slug inexistant', async () => {
    const res = await request(app).get('/api/products/produit-inexistant');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Produit introuvable.');
  });
});
