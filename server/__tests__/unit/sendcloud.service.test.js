const { getShippingMethods } = require('../../services/sendcloud.service');

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
