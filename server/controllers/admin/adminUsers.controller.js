const { validationResult } = require('express-validator');
const userRepository = require('../../repositories/user.repository');

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || null;
    const { data, total } = await userRepository.findAll({ page, limit, search });
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const userId = parseInt(req.params.id);
    const { role } = req.body;

    // Empêcher un admin de se rétrograder lui-même
    if (userId === req.user.id) {
      return res.status(403).json({ error: 'Vous ne pouvez pas modifier votre propre rôle.' });
    }

    await userRepository.updateRole(userId, role);
    res.json({ message: 'Rôle mis à jour.' });
  } catch (err) {
    next(err);
  }
};
