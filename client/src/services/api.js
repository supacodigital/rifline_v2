const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let accessToken = null;

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => { accessToken = null; };

const request = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json', ...options.headers };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Tentative de refresh automatique si 401
  if (res.status === 401 && endpoint !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      return fetch(`${BASE_URL}${endpoint}`, { ...options, headers, credentials: 'include' });
    }
  }

  return res;
};

const tryRefresh = async () => {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.accessToken);
      return true;
    }
  } catch {
    // refresh échoué
  }
  clearAccessToken();
  return false;
};

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
};
