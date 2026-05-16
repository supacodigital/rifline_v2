const { getShippingMethods, createParcel } = require('../../services/sendcloud.service');

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SENDCLOUD_PUBLIC_KEY = 'pub_key';
  process.env.SENDCLOUD_SECRET_KEY = 'sec_key';
});

describe('sendcloud.service — getShippingMethods', () => {
  it('retourne les méthodes d\'expédition en cas de succès', async () => {
    const mockData = { shipping_methods: [{ id: 8, name: 'Colissimo' }] };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const result = await getShippingMethods({ weight: 0.5, toCountry: 'FR' });

    expect(result).toEqual(mockData);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('to_country=FR');
    expect(url).toContain('weight=0.5');
    expect(options.headers.Authorization).toMatch(/^Basic /);
  });

  it('lève une erreur si la réponse HTTP n\'est pas ok', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(getShippingMethods({ weight: 1, toCountry: 'FR' }))
      .rejects.toThrow('Sendcloud shipping_methods échoué (403)');
  });
});

describe('sendcloud.service — createParcel', () => {
  const mockOrder = {
    id: 42,
    shipping_first_name: 'Jean',
    shipping_last_name: 'Dupont',
    shipping_address: '12 rue de la Paix',
    shipping_city: 'Paris',
    shipping_postal_code: '75001',
    shipping_country: 'FR',
    shipping_email: 'jean@test.com',
    shipping_phone: '0601020304',
    total_weight: 1.2,
  };

  it('crée un colis et retourne la réponse Sendcloud', async () => {
    const mockData = { parcel: { id: 99, tracking_number: 'ABC123', label: { label_printer: 'https://label.url' } } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const result = await createParcel({ order: mockOrder, shippingMethodId: 8 });

    expect(result).toEqual(mockData);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://panel.sendcloud.sc/api/v2/parcels');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.parcel.name).toBe('Jean Dupont');
    expect(body.parcel.order_number).toBe('ORDER-42');
    expect(body.parcel.shipment.id).toBe(8);
    expect(body.parcel.request_label).toBe(true);
  });

  it('lève une erreur si la réponse HTTP n\'est pas ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({ error: { message: 'Adresse invalide' } }),
    });

    await expect(createParcel({ order: mockOrder, shippingMethodId: 8 }))
      .rejects.toThrow('Sendcloud parcel échoué (400)');
  });
});
