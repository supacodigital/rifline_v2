const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  });
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ email, passwordHash, firstName, lastName, phone });

    const { accessToken, refreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await refreshTokenRepository.create({ userId: user.id, token: refreshToken, expiresAt });

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    // Rotation complète : supprime les anciens refresh tokens de l'utilisateur
    await refreshTokenRepository.deleteByUserId(user.id);

    const { accessToken, refreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await refreshTokenRepository.create({ userId: user.id, token: refreshToken, expiresAt });

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    }

    const stored = await refreshTokenRepository.findByToken(token);
    if (!stored || new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable.' });
    }

    await refreshTokenRepository.deleteByToken(token);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await refreshTokenRepository.create({ userId: user.id, token: newRefreshToken, expiresAt });

    setRefreshCookie(res, newRefreshToken);
    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await refreshTokenRepository.deleteByToken(token);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { firstName, lastName, email, phone } = req.body;

    const existing = await userRepository.findByEmail(email);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ error: 'Cette adresse email est déjà utilisée.' });
    }

    await userRepository.updateProfile(req.user.id, { firstName, lastName, email, phone });
    res.json({ message: 'Profil mis à jour.' });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.updatePassword(req.user.id, passwordHash);
    res.json({ message: 'Mot de passe modifié.' });
  } catch (err) {
    next(err);
  }
};
