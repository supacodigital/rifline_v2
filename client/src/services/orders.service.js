import { api } from './api';

export const getMyOrders = async () => {
  const res = await api.get('/orders');
  return res.json();
};

export const getOrderById = async (id, guestToken) => {
  const url = guestToken ? `/orders/${id}?token=${encodeURIComponent(guestToken)}` : `/orders/${id}`;
  const res = await api.get(url);
  return res.json();
};

export const createCheckout = async (payload) => {
  const res = await api.post('/payment/create-checkout', payload);
  return res.json();
};
