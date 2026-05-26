import { create } from 'zustand';

const API_URL = '';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('agromind_token') || null,
  isAuthenticated: !!localStorage.getItem('agromind_token'),
  loading: false,
  error: null,

  login: async (phone, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('agromind_token', data.access_token);
      set({ token: data.access_token, isAuthenticated: true, loading: false });
      await get().fetchUser();
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }
      const data = await res.json();
      localStorage.setItem('agromind_token', data.access_token);
      set({ token: data.access_token, isAuthenticated: true, loading: false });
      await get().fetchUser();
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const user = await res.json();
      set({ user, isAuthenticated: true });
    } catch (err) {
      get().logout();
    }
  },

  logout: () => {
    localStorage.removeItem('agromind_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
