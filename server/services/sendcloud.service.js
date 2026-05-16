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

const createParcel = async ({ order, shippingMethodId }) => {
  const response = await fetch('https://panel.sendcloud.sc/api/v2/parcels', {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parcel: {
        name: `${order.shipping_first_name} ${order.shipping_last_name}`,
        address: order.shipping_address,
        city: order.shipping_city,
        postal_code: order.shipping_postal_code,
        country: order.shipping_country,
        email: order.shipping_email,
        telephone: order.shipping_phone,
        order_number: `ORDER-${order.id}`,
        weight: order.total_weight,
        shipment: { id: shippingMethodId },
        request_label: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Sendcloud parcel échoué (${response.status}): ${JSON.stringify(error)}`);
  }

  return response.json();
};

module.exports = { getShippingMethods, createParcel };
