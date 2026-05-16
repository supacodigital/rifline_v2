const { validationResult } = require('express-validator');
const orderRepository = require('../../repositories/order.repository');
const sendcloudService = require('../../services/sendcloud.service');
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

exports.createParcel = async (req, res, next) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    if (order.sendcloud_parcel_id) {
      return res.status(409).json({ error: 'Un bordereau existe déjà pour cette commande.' });
    }

    // Utiliser la méthode choisie par le client, ou celle passée manuellement par l'admin
    const shippingMethodId = req.body.shippingMethodId || order.shipping_method_id;
    if (!shippingMethodId) {
      return res.status(422).json({ error: 'Méthode de livraison requise.' });
    }

    // Calcul du poids total depuis les articles
    const totalWeight = (order.items || []).reduce(
      (acc, item) => acc + (parseFloat(item.weight) || 0) * item.quantity,
      0
    ) || 0.5; // minimum 500g si non renseigné

    const result = await sendcloudService.createParcel({
      order: { ...order, total_weight: totalWeight },
      shippingMethodId,
    });

    const parcel = result.parcel;
    await orderRepository.updateShipping(order.id, {
      trackingNumber: parcel.tracking_number || null,
      labelUrl: parcel.label?.label_printer || parcel.label?.normal_printer?.[0] || null,
      sendcloudParcelId: parcel.id,
      status: 'processing',
    });

    // Notification d'expédition par email
    if (parcel.tracking_number) {
      emailService.sendShippingNotification({ order, trackingNumber: parcel.tracking_number }).catch(() => {});
    }

    res.json({
      message: 'Bordereau créé avec succès.',
      trackingNumber: parcel.tracking_number,
      labelUrl: parcel.label?.label_printer || parcel.label?.normal_printer?.[0] || null,
      parcelId: parcel.id,
    });
  } catch (err) {
    next(err);
  }
};

exports.getShippingMethods = async (req, res, next) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

    const totalWeight = (order.items || []).reduce(
      (acc, item) => acc + (parseFloat(item.weight) || 0) * item.quantity,
      0
    ) || 0.5;

    const result = await sendcloudService.getShippingMethods({
      weight: totalWeight,
      toCountry: order.shipping_country || 'FR',
    });

    res.json({ methods: result.shipping_methods || [], weight: totalWeight });
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
