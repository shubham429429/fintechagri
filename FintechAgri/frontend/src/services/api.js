const API_URL = import.meta.env.VITE_API_URL || '';

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
  if (res.status === 204) return null;
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
  getVolatility: (crop, mandi, days = 7) => {
    const params = new URLSearchParams({ days: String(days) });
    if (mandi) params.append('mandi', mandi);
    return apiFetch(`/api/market/volatility/${crop}?${params}`);
  },
  getAlerts: () => apiFetch('/api/market/alerts'),
  getTrend: (crop, days = 7, mandi) => {
    const params = new URLSearchParams({ days: String(days) });
    if (mandi) params.append('mandi', mandi);
    return apiFetch(`/api/market/trend/${crop}?${params}`);
  },
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
  getHistory: () => apiFetch('/api/inventory/history'),
  getItemHistory: (itemId) => apiFetch(`/api/inventory/history/${itemId}`),
  getFreshness: () => apiFetch('/api/inventory/freshness'),
  getDepletion: () => apiFetch('/api/inventory/depletion'),
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
  updateLocation: (lat, lng) =>
    apiFetch(`/api/users/location?lat=${lat}&lng=${lng}`, { method: 'POST' }),
  uploadPhoto: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/users/photo`, {
      method: 'POST',
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
};

export const nearbyAPI = {
  getMarkets: (lat, lng, radiusKm = 100) =>
    apiFetch(`/api/market/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),
};

export const predictionsAPI = {
  getMandiForecasts: (mandi) => apiFetch(`/api/predictions/${mandi}`),
  getCropForecast: (mandi, crop, days = 7) =>
    apiFetch(`/api/predictions/${mandi}/${crop}?days=${days}`),
  getRecommendation: (farmerId) => apiFetch(`/api/predictions/recommendation/${farmerId}`),
};

export const clusterAPI = {
  getNearbyFarmers: (lat, lng, radiusKm = 100) =>
    apiFetch(`/api/cluster/nearby?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`),
  getClusters: (nClusters = 5) => apiFetch(`/api/cluster/clusters?n_clusters=${nClusters}`),
  getClusterStock: (clusterId) => apiFetch(`/api/cluster/clusters/${clusterId}/stock`),
  getMandiRanking: () => apiFetch('/api/cluster/mandi-ranking'),
};

export default apiFetch;
