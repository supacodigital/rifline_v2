import { api } from './api';

export const getProducts = async ({ page = 1, limit = 24, category, search, sort, minPrice, maxPrice, inStock } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (category) params.set('category', category);
  if (search) params.set('q', search);
  if (sort) params.set('sort', sort);
  if (minPrice !== undefined && minPrice !== null) params.set('minPrice', minPrice);
  if (maxPrice !== undefined && maxPrice !== null) params.set('maxPrice', maxPrice);
  if (inStock) params.set('inStock', 'true');
  const res = await api.get(`/products?${params}`);
  return res.json();
};

export const getProductBySlug = async (slug) => {
  const res = await api.get(`/products/${slug}`);
  return res.json();
};

export const getCategories = async () => {
  const res = await api.get('/categories');
  return res.json();
};

export const getFeaturedProducts = async () => {
  const res = await api.get('/products/featured');
  return res.json();
};
