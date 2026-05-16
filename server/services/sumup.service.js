const createCheckout = async ({ orderId, amount, currency, customerEmail }) => {
  const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checkout_reference: `ORDER-${orderId}`,
      amount,
      currency: currency || 'EUR',
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description: `Commande #${orderId}`,
      return_url: `${process.env.APP_URL}/commande/confirmation?order=${orderId}`,
      hosted_checkout: { enabled: true },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`SumUp checkout échoué (${response.status}): ${error.message || 'erreur inconnue'}`);
  }

  return response.json();
};

module.exports = { createCheckout };
