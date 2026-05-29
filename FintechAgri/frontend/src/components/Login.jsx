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
    <div className="auth-split">
      {/* ── LEFT VISUAL PANEL ── */}
      <div className="auth-visual">
        <div className="auth-visual__bg-shapes">
          <div className="auth-visual__circle auth-visual__circle--1" />
          <div className="auth-visual__circle auth-visual__circle--2" />
          <div className="auth-visual__circle auth-visual__circle--3" />
        </div>

        <div className="auth-visual__content">
          <div className="auth-visual__icon">🌾</div>
          <h1 className="auth-visual__brand">AgroMind</h1>
          <p className="auth-visual__tagline">Smart Farming. Better Returns.</p>

          <div className="auth-visual__stats">
            <div className="auth-stat-card">
              <span className="auth-stat-card__icon">🌿</span>
              <span className="auth-stat-card__value">6+</span>
              <span className="auth-stat-card__label">Crops Tracked</span>
            </div>
            <div className="auth-stat-card">
              <span className="auth-stat-card__icon">🏪</span>
              <span className="auth-stat-card__value">5</span>
              <span className="auth-stat-card__label">Mandis Connected</span>
            </div>
            <div className="auth-stat-card">
              <span className="auth-stat-card__icon">📊</span>
              <span className="auth-stat-card__value">900+</span>
              <span className="auth-stat-card__label">Price Records</span>
            </div>
          </div>
        </div>

        {/* decorative wheat rows */}
        <div className="auth-visual__wheat">
          {'🌾'.repeat(12)}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2 className="auth-form-header__title">Welcome Back</h2>
            <p className="auth-form-header__sub">Sign in to your account</p>
          </div>

          {error && (
            <div className="alert-banner error">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <span className="auth-input-group__icon">📱</span>
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={10}
              />
            </div>

            <div className="auth-input-group">
              <span className="auth-input-group__icon">🔒</span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-submit-btn__loading">
                  <span className="auth-submit-btn__spinner" />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="auth-switch-link">
            Don't have an account?{' '}
            <Link to="/register">Register</Link>
          </p>

          <div className="auth-demo-box">
            <span className="auth-demo-box__label">Demo Credentials</span>
            <span className="auth-demo-box__creds">
              <span>📱 9999999999</span>
              <span className="auth-demo-box__divider">|</span>
              <span>🔒 demo123</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
