import { api } from './api';

/* ── Produits ── */
export const adminGetProducts = async ({ page = 1, limit = 20, search, category, status, stock } = {}) => {
  const params = new URLSearchParams({ page, limit, includeInactive: true });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (status) params.set('status', status);
  if (stock) params.set('stock', stock);
  const res = await api.get(`/admin/products?${params}`);
  return res.json();
};

export const adminCreateProduct = async (data) => {
  const res = await api.post('/admin/products', data);
  return res.json();
};

export const adminUpdateProduct = async (id, data) => {
  const res = await api.put(`/admin/products/${id}`, data);
  return res.json();
};

export const adminDeleteProduct = async (id) => {
  const res = await api.delete(`/admin/products/${id}`);
  return res.json();
};

export const adminToggleFeatured = async (id) => {
  const res = await api.patch(`/admin/products/${id}/featured`);
  return res.json();
};

/* ── Commandes ── */
export const adminGetOrders = async ({ page = 1, limit = 20, status, search } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  const res = await api.get(`/admin/orders?${params}`);
  return res.json();
};

export const adminGetOrder = async (id) => {
  const res = await api.get(`/admin/orders/${id}`);
  return res.json();
};

export const adminUpdateOrderStatus = async (id, status) => {
  const res = await api.put(`/admin/orders/${id}/status`, { status });
  return res.json();
};

export const adminUpdateOrderTracking = async (id, trackingNumber) => {
  const res = await api.put(`/admin/orders/${id}/tracking`, { trackingNumber });
  return res.json();
};

/* ── Utilisateurs ── */
export const adminGetUsers = async ({ page = 1, limit = 20, search } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  const res = await api.get(`/admin/users?${params}`);
  return res.json();
};

export const adminUpdateUserRole = async (id, role) => {
  const res = await api.put(`/admin/users/${id}/role`, { role });
  return res.json();
};

/* ── Stats dashboard ── */
export const adminGetStats = async () => {
  const res = await api.get('/admin/stats');
  return res.json();
};

/* ── Images produits ── */
export const adminGetProductImages = async (productId) => {
  const res = await api.get(`/admin/products/${productId}/images`);
  return res.json();
};

export const adminUploadProductImage = async (productId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.upload(`/admin/products/${productId}/images`, formData);
  return res.json();
};

export const adminDeleteProductImage = async (productId, imageId) => {
  const res = await api.delete(`/admin/products/${productId}/images/${imageId}`);
  return res.json();
};

export const adminSetPrimaryImage = async (productId, imageId) => {
  const res = await api.put(`/admin/products/${productId}/images/${imageId}/primary`, {});
  return res.json();
};

/* ── Catégories ── */
export const adminGetCategories = async () => {
  const res = await api.get('/admin/categories');
  return res.json();
};

export const adminCreateCategory = async (data) => {
  const res = await api.post('/admin/categories', data);
  return res.json();
};

export const adminUpdateCategory = async (id, data) => {
  const res = await api.put(`/admin/categories/${id}`, data);
  return res.json();
};

export const adminDeleteCategory = async (id) => {
  const res = await api.delete(`/admin/categories/${id}`);
  return res.json();
};
