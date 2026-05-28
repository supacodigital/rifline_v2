const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sumupService = require('../services/sumup.service');
const emailService = require('../services/email.service');
const orderRepository = require('../repositories/order.repository');
const productRepository = require('../repositories/product.repository');

exports.createCheckout = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { items, shippingAddress, shippingMethodId, shippingAmount, customerEmail } = req.body;
    const userId = req.user?.id || null;

    // Vérification du stock et calcul du total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await productRepository.findById(item.productId);
      if (!product || !product.is_active) {
        return res.status(400).json({ error: `Le produit "${item.name}" n'est plus disponible.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuffisant pour "${product.name}".` });
      }
      totalAmount += parseFloat(product.price) * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
        quantity: item.quantity,
        weight: product.weight,
      });
    }

    totalAmount += parseFloat(shippingAmount || 0);

    // Création de la commande en base (statut pending)
    const { orderId, guestToken } = await orderRepository.create({
      userId,
      items: orderItems,
      shippingAddress,
      totalAmount,
      shippingAmount: shippingAmount || 0,
      shippingMethodId: shippingMethodId || null,
    });

    // Création du checkout SumUp
    const checkout = await sumupService.createCheckout({
      orderId,
      amount: totalAmount,
      currency: 'EUR',
      customerEmail: customerEmail || shippingAddress.email,
    });

    await orderRepository.updateCheckoutId(orderId, checkout.id);

    res.json({ checkoutUrl: checkout.hosted_checkout_url, ...(guestToken && { guestToken }) });
  } catch (err) {
    next(err);
  }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['sumup-signature'];
    const rawBody = req.body;

    // Vérification obligatoire de la signature webhook
    if (!process.env.SUMUP_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Configuration webhook manquante.' });
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.SUMUP_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== `sha256=${expectedSig}`) {
      return res.status(401).json({ error: 'Signature webhook invalide.' });
    }

    const event = Buffer.isBuffer(rawBody) || typeof rawBody === 'string'
      ? JSON.parse(rawBody)
      : rawBody;

    if (event.event_type === 'CHECKOUT_COMPLETED') {
      const checkoutId = event.payload?.id;
      const transactionId = event.payload?.transaction_id;

      const order = await orderRepository.findByCheckoutId(checkoutId);
      if (!order) {
        return res.status(404).json({ error: 'Commande introuvable.' });
      }

      // Idempotence : SumUp peut rejouer le webhook. On ne traite que les commandes
      // encore en 'pending' pour ne pas décrémenter le stock ni renvoyer l'email deux fois.
      if (order.status !== 'pending') {
        return res.json({ received: true });
      }

      // Décrémentation du stock à la confirmation du paiement (pas à la création de la
      // commande, pour ne pas bloquer le stock sur les paniers abandonnés).
      const { insufficient } = await orderRepository.decrementStock(order.id);
      if (insufficient.length && process.env.NODE_ENV !== 'production') {
        console.error(
          `[Stock] Commande #${order.id} payée mais stock insuffisant pour : ` +
          insufficient.map((p) => `${p.productName} (x${p.quantity})`).join(', ')
        );
      }

      // Paiement confirmé → commande à préparer.
      // L'étiquette/bordereau n'est pas générée automatiquement (pas d'abonnement Sendcloud) :
      // l'expédition et la saisie du numéro de suivi sont gérées manuellement par l'admin.
      await orderRepository.updateStatus(order.id, 'processing', { transactionId, paidAt: new Date() });

      // Email de confirmation en arrière-plan
      const paidOrder = await orderRepository.findById(order.id);
      emailService.sendOrderConfirmation({ order: paidOrder }).catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`[Email] Erreur confirmation commande #${order.id}:`, err.message);
        }
      });
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
