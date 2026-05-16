const orderRepository = require('../repositories/order.repository');

exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderRepository.findByUserId(req.user.id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderRepository.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }

    // Commande invité → vérifier le token d'accès
    if (order.user_id === null) {
      const token = req.query.token;
      if (!token || token !== order.guest_token) {
        return res.status(403).json({ error: 'Accès non autorisé.' });
      }
      const { guest_token: _, ...orderData } = order;
      return res.json(orderData);
    }

    // Commande utilisateur → vérifier l'identité
    if (!req.user || (order.user_id !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Accès non autorisé.' });
    }

    const { guest_token: _, ...orderData } = order;
    res.json(orderData);
  } catch (err) {
    next(err);
  }
};
