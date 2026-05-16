import { api } from './api';

export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.json();
};

export const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.json();
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.json();
};

export const refreshToken = async () => {
  const res = await api.post('/auth/refresh');
  return res.json();
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.json();
};
