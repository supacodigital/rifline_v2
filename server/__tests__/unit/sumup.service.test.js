const { createCheckout } = require('../../services/sumup.service');

// Mock global fetch
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SUMUP_API_KEY = 'sk_test_fake';
  process.env.SUMUP_MERCHANT_CODE = 'MERCHANT123';
  process.env.APP_URL = 'http://localhost:5173';
});

describe('sumup.service — createCheckout', () => {
  it('retourne les données du checkout en cas de succès', async () => {
    const mockResponse = {
      id: 'checkout_abc123',
      hosted_checkout_url: 'https://checkout.sumup.com/abc123',
      status: 'PENDING',
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const result = await createCheckout({
      orderId: 1,
      amount: 49.99,
      currency: 'EUR',
      customerEmail: 'client@test.com',
    });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.sumup.com/v0.1/checkouts');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer sk_test_fake');

    const body = JSON.parse(options.body);
    expect(body.checkout_reference).toBe('ORDER-1');
    expect(body.amount).toBe(49.99);
    expect(body.currency).toBe('EUR');
    expect(body.hosted_checkout.enabled).toBe(true);
  });

  it('utilise EUR par défaut si currency non fourni', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ id: 'abc', hosted_checkout_url: 'https://x.com' }),
    });

    await createCheckout({ orderId: 2, amount: 20, customerEmail: 'x@x.com' });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.currency).toBe('EUR');
  });

  it('lève une erreur si la réponse HTTP n\'est pas ok', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValueOnce({ message: 'Unauthorized' }),
    });

    await expect(createCheckout({ orderId: 3, amount: 10, customerEmail: 'x@x.com' }))
      .rejects.toThrow('SumUp checkout échoué (401): Unauthorized');
  });

  it('gère un body non-JSON lors d\'une erreur HTTP', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValueOnce(new Error('not json')),
    });

    await expect(createCheckout({ orderId: 4, amount: 10, customerEmail: 'x@x.com' }))
      .rejects.toThrow('SumUp checkout échoué (500): erreur inconnue');
  });
});
