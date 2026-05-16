// Mock des dépendances avant tout require
jest.mock('../../repositories/user.repository');
jest.mock('../../repositories/refreshToken.repository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const authController = require('../../controllers/auth.controller');
const userRepository = require('../../repositories/user.repository');
const refreshTokenRepository = require('../../repositories/refreshToken.repository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
});

describe('authController.register', () => {
  it('crée un utilisateur et retourne un access token', async () => {
    const req = {
      body: { email: 'test@test.com', password: 'motdepasse123', firstName: 'Jean', lastName: 'Dupont', phone: '' },
    };
    const res = mockRes();

    // express-validator mock via req
    req.body._validationErrors = [];

    userRepository.findByEmail.mockResolvedValueOnce(null);
    bcrypt.hash.mockResolvedValueOnce('hashed_password');
    userRepository.create.mockResolvedValueOnce({ id: 1, email: 'test@test.com', firstName: 'Jean', lastName: 'Dupont', role: 'customer' });
    jwt.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');
    refreshTokenRepository.create.mockResolvedValueOnce();

    // Simuler validationResult vide
    jest.mock('express-validator', () => ({
      validationResult: jest.fn().mockReturnValue({ isEmpty: () => true, array: () => [] }),
      body: jest.fn().mockReturnValue({ isEmail: jest.fn().mockReturnThis(), withMessage: jest.fn().mockReturnThis() }),
    }));

    await authController.register(req, res, mockNext);

    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('motdepasse123', 12);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: expect.any(String) }));
  });

  it('retourne 409 si l\'email est déjà utilisé', async () => {
    const req = {
      body: { email: 'existant@test.com', password: 'motdepasse123', firstName: 'Jean', lastName: 'Dupont' },
    };
    const res = mockRes();

    userRepository.findByEmail.mockResolvedValueOnce({ id: 1, email: 'existant@test.com' });

    await authController.register(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cette adresse email est déjà utilisée.' });
  });

  it('appelle next() en cas d\'erreur inattendue', async () => {
    const req = {
      body: { email: 'test@test.com', password: 'motdepasse123', firstName: 'Jean', lastName: 'Dupont' },
    };
    const res = mockRes();
    const error = new Error('DB down');

    userRepository.findByEmail.mockRejectedValueOnce(error);

    await authController.register(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});

describe('authController.login', () => {
  it('retourne 401 si l\'email n\'existe pas', async () => {
    const req = { body: { email: 'inconnu@test.com', password: 'motdepasse123' } };
    const res = mockRes();

    userRepository.findByEmail.mockResolvedValueOnce(null);

    await authController.login(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email ou mot de passe incorrect.' });
  });

  it('retourne 401 si le mot de passe est invalide', async () => {
    const req = { body: { email: 'test@test.com', password: 'mauvais_mdp' } };
    const res = mockRes();

    userRepository.findByEmail.mockResolvedValueOnce({ id: 1, email: 'test@test.com', password_hash: 'hashed', role: 'customer' });
    bcrypt.compare.mockResolvedValueOnce(false);

    await authController.login(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email ou mot de passe incorrect.' });
  });

  it('retourne un access token si les credentials sont corrects', async () => {
    const req = { body: { email: 'test@test.com', password: 'bon_mdp' } };
    const res = mockRes();

    userRepository.findByEmail.mockResolvedValueOnce({ id: 1, email: 'test@test.com', password_hash: 'hashed', first_name: 'Jean', last_name: 'Dupont', role: 'customer' });
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');
    refreshTokenRepository.create.mockResolvedValueOnce();

    await authController.login(req, res, mockNext);

    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh_token', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'access_token' }));
  });
});

describe('authController.logout', () => {
  it('supprime le refresh token et vide le cookie', async () => {
    const req = { cookies: { refreshToken: 'old_token' } };
    const res = mockRes();

    refreshTokenRepository.deleteByToken.mockResolvedValueOnce();

    await authController.logout(req, res, mockNext);

    expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith('old_token');
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(res.json).toHaveBeenCalledWith({ message: 'Déconnexion réussie.' });
  });
});
