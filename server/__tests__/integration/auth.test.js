require('dotenv').config();
const request = require('supertest');
const app = require('../../index');
const { cleanDb, closeDb } = require('./setup');

beforeAll(async () => { await cleanDb(); });
afterAll(async () => { await cleanDb(); await closeDb(); });

describe('POST /api/auth/register', () => {
  it('crée un compte et retourne un access token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@rifline.com', password: 'motdepasse123', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toMatchObject({ email: 'test@rifline.com', role: 'customer' });
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('retourne 422 si l\'email est invalide', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'pas_un_email', password: 'motdepasse123', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  it('retourne 422 si le mot de passe est trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'autre@rifline.com', password: '123', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(422);
  });

  it('retourne 409 si l\'email est déjà utilisé', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@rifline.com', password: 'motdepasse123', firstName: 'Jean', lastName: 'Dupont' });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('déjà utilisée');
  });
});

describe('POST /api/auth/login', () => {
  it('retourne un access token avec des credentials valides', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@rifline.com', password: 'motdepasse123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('retourne 401 avec un mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@rifline.com', password: 'mauvais_mdp' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou mot de passe incorrect.');
  });

  it('retourne 401 si l\'email n\'existe pas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@rifline.com', password: 'motdepasse123' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('retourne un nouvel access token avec un refresh token valide', async () => {
    // Connexion pour obtenir le cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@rifline.com', password: 'motdepasse123' });

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('retourne 401 sans refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('déconnecte l\'utilisateur et vide le cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@rifline.com', password: 'motdepasse123' });

    const rawCookies = loginRes.headers['set-cookie'];
    const token = loginRes.body.accessToken;

    // supertest retourne un tableau de cookies — on le joint pour le header
    const cookieHeader = Array.isArray(rawCookies) ? rawCookies.join('; ') : rawCookies;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', cookieHeader);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Déconnexion réussie.');
  });
});
