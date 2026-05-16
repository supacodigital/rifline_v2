import { api } from './api';

export const getShippingMethods = async ({ weight, country = 'FR' }) => {
  const params = new URLSearchParams({ weight, country });
  const res = await api.get(`/shipping/methods?${params}`);
  return res.json();
};
