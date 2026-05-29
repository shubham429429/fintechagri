import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const CROPS = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Soybean', 'Rice'];
const MANDIS = ['Lasalgaon', 'Azadpur', 'Vashi', 'Pune', 'Nashik'];

const CROP_EMOJI = {
  Onion: '🧅', Tomato: '🍅', Potato: '🥔',
  Wheat: '🌾', Soybean: '🫘', Rice: '🍚',
};

export default function Register() {
  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    farm_location: '', pin_code: '', crops: [],
    farm_size_acres: '', preferred_mandi: '', storage_capacity_quintals: '',
  });
  const [errors, setErrors] = useState({});
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const toggleCrop = (crop) => {
    setForm((prev) => ({
      ...prev,
      crops: prev.crops.includes(crop)
        ? prev.crops.filter((c) => c !== crop)
        : [...prev.crops, crop],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Enter valid 10-digit phone';
    if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (form.pin_code && !/^\d{6}$/.test(form.pin_code)) errs.pin_code = 'Enter valid 6-digit pin code';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    const payload = {
      name: form.name, phone: form.phone, password: form.password,
      ...(form.farm_location && { farm_location: form.farm_location }),
      ...(form.pin_code && { pin_code: form.pin_code }),
      ...(form.crops.length > 0 && { crops: form.crops }),
      ...(form.farm_size_acres && { farm_size_acres: parseFloat(form.farm_size_acres) }),
      ...(form.preferred_mandi && { preferred_mandi: form.preferred_mandi }),
      ...(form.storage_capacity_quintals && { storage_capacity_quintals: parseFloat(form.storage_capacity_quintals) }),
    };
    try {
      await register(payload);
      navigate('/dashboard');
    } catch { /* error in store */ }
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
          <div className="auth-visual__icon">🌱</div>
          <h1 className="auth-visual__brand">Join AgroMind</h1>
          <p className="auth-visual__tagline">Start your smart farming journey</p>

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

        <div className="auth-visual__wheat">
          {'🌾'.repeat(12)}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="auth-form-panel auth-form-panel--register">
        <div className="auth-form-wrapper auth-form-wrapper--register">
          <div className="auth-form-header">
            <h2 className="auth-form-header__title">Create Account</h2>
            <p className="auth-form-header__sub">Fill in your details to get started</p>
          </div>

          {error && <div className="alert-banner error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* ── Account Details ── */}
            <div className="auth-section-label">Account Details</div>
            <div className="auth-form-grid">
              <div className="auth-input-group">
                <span className="auth-input-group__icon">👤</span>
                <input
                  placeholder="Full Name *"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="auth-input-group">
                <span className="auth-input-group__icon">📱</span>
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
              <div className="auth-input-group">
                <span className="auth-input-group__icon">🔒</span>
                <input
                  type="password"
                  placeholder="Password *"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <div className="auth-input-group">
                <span className="auth-input-group__icon">🔑</span>
                <input
                  type="password"
                  placeholder="Confirm Password *"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* ── Farm Details ── */}
            <div className="auth-section-label">Farm Details</div>
            <div className="auth-form-grid">
              <div className="auth-input-group">
                <span className="auth-input-group__icon">📍</span>
                <input
                  placeholder="Farm Location"
                  value={form.farm_location}
                  onChange={(e) => updateField('farm_location', e.target.value)}
                />
              </div>
              <div className="auth-input-group">
                <span className="auth-input-group__icon">📮</span>
                <input
                  placeholder="Pin Code"
                  maxLength={6}
                  value={form.pin_code}
                  onChange={(e) => updateField('pin_code', e.target.value)}
                />
                {errors.pin_code && <span className="field-error">{errors.pin_code}</span>}
              </div>
            </div>

            {/* ── Crops ── */}
            <div className="auth-section-label">Crops You Grow</div>
            <div className="auth-crop-grid">
              {CROPS.map((crop) => (
                <button
                  key={crop}
                  type="button"
                  className={`auth-crop-chip ${form.crops.includes(crop) ? 'auth-crop-chip--active' : ''}`}
                  onClick={() => toggleCrop(crop)}
                >
                  <span>{CROP_EMOJI[crop]}</span>
                  <span>{crop}</span>
                </button>
              ))}
            </div>

            {/* ── Operations ── */}
            <div className="auth-section-label">Operations</div>
            <div className="auth-form-grid auth-form-grid--3">
              <div className="auth-input-group">
                <span className="auth-input-group__icon">📐</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Farm Size (acres)"
                  value={form.farm_size_acres}
                  onChange={(e) => updateField('farm_size_acres', e.target.value)}
                />
              </div>
              <div className="auth-input-group auth-input-group--select">
                <span className="auth-input-group__icon">🏪</span>
                <select
                  value={form.preferred_mandi}
                  onChange={(e) => updateField('preferred_mandi', e.target.value)}
                >
                  <option value="">Preferred Mandi</option>
                  {MANDIS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="auth-input-group">
                <span className="auth-input-group__icon">🏗️</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Storage (quintals)"
                  value={form.storage_capacity_quintals}
                  onChange={(e) => updateField('storage_capacity_quintals', e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-submit-btn__loading">
                  <span className="auth-submit-btn__spinner" />
                  Creating Account…
                </span>
              ) : (
                '🌱 Create Account'
              )}
            </button>
          </form>

          <p className="auth-switch-link">
            Already have an account?{' '}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
