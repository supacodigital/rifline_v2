const { validationResult } = require('express-validator');
const orderRepository = require('../../repositories/order.repository');
const emailService = require('../../services/email.service');

const VALID_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

exports.getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || null;
    const search = req.query.search || null;
    const { data, total } = await orderRepository.findAll({ page, limit, status, search });
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.updateTracking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const order = await orderRepository.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    await orderRepository.updateTracking(order.id, req.body.trackingNumber);

    // Email de notification d'expédition
    emailService.sendShippingNotification({ order, trackingNumber: req.body.trackingNumber }).catch(() => {});

    res.json({ message: 'Numéro de suivi enregistré.' });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    await orderRepository.updateStatus(req.params.id, req.body.status);
    res.json({ message: 'Statut mis à jour.' });
  } catch (err) {
    next(err);
  }
};
