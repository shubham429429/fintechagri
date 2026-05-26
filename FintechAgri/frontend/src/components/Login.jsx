import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await login(phone, password);
      navigate('/dashboard');
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-card">
        <div className="login-header">
          <div className="login-logo">🌾</div>
          <h1 className="login-title">AgroMind</h1>
          <p className="login-subtitle">Agricultural Intelligence Platform</p>
        </div>

        {error && (
          <div className="alert-banner error">⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={10}
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>
        </form>

        <p className="login-note" style={{ textAlign: 'center', marginTop: '1rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>Register here</Link>
        </p>

        <div className="demo-credentials">
          <strong>Demo:</strong> Phone: 9999999999 &nbsp;|&nbsp; Password: demo123
        </div>
      </div>
    </div>
  );
}
