const { cleanDb, seedDb, closeDb, pool } = require('./setup');
const orderRepository = require('../../repositories/order.repository');

// Crée une commande 'pending' avec une ligne pour un produit donné, et renvoie son id.
const createPendingOrder = async ({ productId, productName, quantity }) => {
  const [orderResult] = await pool.query(
    `INSERT INTO orders (status, total_amount, shipping_amount, shipping_first_name, shipping_last_name,
       shipping_address, shipping_city, shipping_postal_code, shipping_country, shipping_email)
     VALUES ('pending', 0, 0, 'Jean', 'Dupont', '12 rue Test', 'Paris', '75001', 'FR', 'jean@test.com')`
  );
  const orderId = orderResult.insertId;
  await pool.query(
    `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, weight)
     VALUES (?, ?, ?, 49.99, ?, 0.3)`,
    [orderId, productId, productName, quantity]
  );
  return orderId;
};

const getStock = async (productId) => {
  const [[row]] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
  return row.stock;
};

describe('order.repository — decrementStock', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('décrémente le stock du produit commandé', async () => {
    const { productId } = await seedDb(); // stock initial = 10
    const orderId = await createPendingOrder({ productId, productName: 'Casque Audio', quantity: 3 });

    const { insufficient } = await orderRepository.decrementStock(orderId);

    expect(insufficient).toHaveLength(0);
    expect(await getStock(productId)).toBe(7);
  });

  it('ne décrémente pas et signale le produit si le stock est insuffisant', async () => {
    const { productId } = await seedDb(); // stock initial = 10
    const orderId = await createPendingOrder({ productId, productName: 'Casque Audio', quantity: 15 });

    const { insufficient } = await orderRepository.decrementStock(orderId);

    expect(insufficient).toHaveLength(1);
    expect(insufficient[0]).toMatchObject({ productId, quantity: 15 });
    // Stock inchangé (décrémentation atomique : WHERE stock >= quantity)
    expect(await getStock(productId)).toBe(10);
  });

  it('ignore les lignes dont le produit a été supprimé (product_id NULL)', async () => {
    await seedDb();
    const [orderResult] = await pool.query(
      `INSERT INTO orders (status, total_amount, shipping_amount, shipping_first_name, shipping_last_name,
         shipping_address, shipping_city, shipping_postal_code, shipping_country, shipping_email)
       VALUES ('pending', 0, 0, 'Jean', 'Dupont', '12 rue Test', 'Paris', '75001', 'FR', 'jean@test.com')`
    );
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, weight)
       VALUES (?, NULL, 'Produit supprimé', 49.99, 2, 0.3)`,
      [orderResult.insertId]
    );

    const { insufficient } = await orderRepository.decrementStock(orderResult.insertId);

    expect(insufficient).toHaveLength(0);
  });
});
