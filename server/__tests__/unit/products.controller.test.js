jest.mock('../../repositories/product.repository');

const productsController = require('../../controllers/products.controller');
const productRepository = require('../../repositories/product.repository');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('productsController.getAll', () => {
  it('retourne les produits paginés', async () => {
    const req = { query: { page: '1', limit: '24' } };
    const res = mockRes();

    productRepository.findAll.mockResolvedValueOnce({
      data: [{ id: 1, name: 'Produit test', slug: 'produit-test', price: 19.99 }],
      total: 1,
    });

    await productsController.getAll(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      data: expect.any(Array),
      pagination: { page: 1, limit: 24, total: 1, totalPages: 1 },
    });
  });

  it('utilise les valeurs par défaut si page/limit absents', async () => {
    const req = { query: {} };
    const res = mockRes();

    productRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

    await productsController.getAll(req, res, mockNext);

    expect(productRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 24 })
    );
  });

  it('calcule correctement totalPages', async () => {
    const req = { query: { page: '2', limit: '10' } };
    const res = mockRes();

    productRepository.findAll.mockResolvedValueOnce({ data: [], total: 45 });

    await productsController.getAll(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ pagination: expect.objectContaining({ totalPages: 5 }) })
    );
  });

  it('appelle next() en cas d\'erreur', async () => {
    const req = { query: {} };
    const res = mockRes();
    const error = new Error('DB error');

    productRepository.findAll.mockRejectedValueOnce(error);

    await productsController.getAll(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});

describe('productsController.getBySlug', () => {
  it('retourne le produit si trouvé', async () => {
    const req = { params: { slug: 'produit-test' } };
    const res = mockRes();

    const product = { id: 1, name: 'Produit test', slug: 'produit-test', price: 19.99, images: [] };
    productRepository.findBySlug.mockResolvedValueOnce(product);

    await productsController.getBySlug(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(product);
  });

  it('retourne 404 si le produit n\'existe pas', async () => {
    const req = { params: { slug: 'inexistant' } };
    const res = mockRes();

    productRepository.findBySlug.mockResolvedValueOnce(null);

    await productsController.getBySlug(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Produit introuvable.' });
  });
});
