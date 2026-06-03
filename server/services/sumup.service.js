const SUMUP_API_BASE = 'https://api.sumup.com/v0.1';

const createCheckout = async ({ orderId, amount, currency, customerEmail }) => {
  // SumUp impose que checkout_reference soit unique. On suffixe l'orderId d'un
  // horodatage pour qu'une nouvelle tentative de paiement (reprise après échec)
  // ne déclenche pas un conflit 409 « reference already exists ».
  const checkoutReference = `ORDER-${orderId}-${Date.now()}`;

  const response = await fetch(`${SUMUP_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checkout_reference: checkoutReference,
      amount,
      currency: currency || 'EUR',
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description: `Commande #${orderId}`,
      // SumUp envoie la notification de changement de statut en POST serveur sur
      // cette URL. Elle doit donc pointer vers l'API (le webhook backend), et NON
      // vers la page de confirmation du front. La redirection visuelle du client
      // vers le front est gérée séparément (redirect_url du Hosted Checkout).
      return_url: `${process.env.SERVER_URL}/api/payment/webhook`,
      hosted_checkout: {
        enabled: true,
        // Page vers laquelle le navigateur du client est redirigé après paiement.
        redirect_url: `${process.env.APP_URL}/commande/confirmation?order=${orderId}`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`SumUp checkout échoué (${response.status}): ${error.message || 'erreur inconnue'}`);
  }

  return response.json();
};

// Récupère l'état réel d'un checkout auprès de SumUp. C'est la source de vérité :
// le webhook ne fait que signaler un changement de statut (sans signature), on doit
// donc toujours reconfirmer le statut « PAID » via cet appel authentifié avant de
// traiter la commande (modèle de vérification recommandé par SumUp).
const getCheckout = async (checkoutId) => {
  const response = await fetch(`${SUMUP_API_BASE}/checkouts/${checkoutId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`SumUp get checkout échoué (${response.status}): ${error.message || 'erreur inconnue'}`);
  }

  return response.json();
};

module.exports = { createCheckout, getCheckout };
