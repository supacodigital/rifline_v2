const getAuthHeader = () => {
  const credentials = Buffer.from(
    `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
  ).toString('base64');
  return `Basic ${credentials}`;
};

const getShippingMethods = async ({ weight, toCountry }) => {
  const params = new URLSearchParams({ to_country: toCountry, weight });
  const response = await fetch(
    `https://panel.sendcloud.sc/api/v2/shipping_methods?${params}`,
    { headers: { Authorization: getAuthHeader() } }
  );

  if (!response.ok) {
    throw new Error(`Sendcloud shipping_methods échoué (${response.status})`);
  }

  return response.json();
};

// Note : la création de colis / génération d'étiquette via l'API Sendcloud
// (POST /parcels) n'est pas utilisée — le client ne souscrit pas à l'abonnement
// permettant la génération automatique des bordereaux. Sendcloud sert uniquement
// à afficher les transporteurs et tarifs disponibles (getShippingMethods).
// L'expédition et la saisie du numéro de suivi sont gérées manuellement par l'admin.

module.exports = { getShippingMethods };
