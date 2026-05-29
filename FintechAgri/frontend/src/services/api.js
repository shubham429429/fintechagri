const API_URL = '';

const getToken = () => localStorage.getItem('agromind_token');

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };
  const res = await fetch(`${API_URL}${endpoint}`, config);
  if (res.status === 401) {
    localStorage.removeItem('agromind_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
};

export const marketAPI = {
  getPrices: (crop, mandi) => {
    const params = new URLSearchParams();
    if (crop) params.append('crop', crop);
    if (mandi) params.append('mandi', mandi);
    return apiFetch(`/api/market/prices?${params}`);
  },
  getPriceHistory: (crop, days = 30, mandi) => {
    const params = new URLSearchParams({ crop, days: String(days) });
    if (mandi) params.append('mandi', mandi);
    return apiFetch(`/api/market/prices/history?${params}`);
  },
  getCrops: () => apiFetch('/api/market/crops'),
  getCropSummary: (crop) => apiFetch(`/api/market/summary/${crop}`),
};

export const dashboardAPI = {
  getSummary: () => apiFetch('/api/dashboard/summary'),
};

export const inventoryAPI = {
  getAll: () => apiFetch('/api/inventory'),
  create: (data) => apiFetch('/api/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/api/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/api/inventory/${id}`, { method: 'DELETE' }),
  getSummary: () => apiFetch('/api/inventory/summary'),
};

export const postsAPI = {
  getAll: (category, skip = 0, limit = 20) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (category && category !== 'all') params.append('category', category);
    return apiFetch(`/api/posts?${params}`);
  },
  create: (content, category = 'general') =>
    apiFetch('/api/posts', { method: 'POST', body: JSON.stringify({ content, category }) }),
  like: (postId) => apiFetch(`/api/posts/${postId}/like`, { method: 'POST' }),
  getComments: (postId) => apiFetch(`/api/posts/${postId}/comments`),
  addComment: (postId, content) =>
    apiFetch(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
};

export const userAPI = {
  getProfile: () => apiFetch('/api/users/profile'),
  updateProfile: (data) => apiFetch('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const nearbyAPI = {
  getMarkets: (lat, lng, radiusKm = 100) =>
    apiFetch(`/api/market/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),
};

export default apiFetch;
