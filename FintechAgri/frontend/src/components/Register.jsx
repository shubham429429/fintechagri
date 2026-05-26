import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const CROPS = ['Onion', 'Tomato', 'Potato', 'Wheat', 'Soybean', 'Rice'];
const MANDIS = ['Lasalgaon', 'Azadpur', 'Vashi', 'Pune', 'Nashik'];

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
      crops: prev.crops.includes(crop) ? prev.crops.filter((c) => c !== crop) : [...prev.crops, crop],
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
    <div className="login-page">
      <div className="login-page-card" style={{ maxWidth: '580px' }}>
        <div className="login-header">
          <div className="login-logo">🌱</div>
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">Join AgroMind — Smart Farming Starts Here</p>
        </div>

        {error && <div className="alert-banner error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-row">
              <label>Full Name *</label>
              <input placeholder="Your name" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-row">
              <label>Phone Number *</label>
              <input type="tel" placeholder="10-digit number" maxLength={10} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label>Password *</label>
              <input type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => updateField('password', e.target.value)} />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <div className="form-row">
              <label>Confirm Password *</label>
              <input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-row">
              <label>Farm Location</label>
              <input placeholder="e.g., Nashik, Maharashtra" value={form.farm_location} onChange={(e) => updateField('farm_location', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Pin Code</label>
              <input placeholder="6-digit pin" maxLength={6} value={form.pin_code} onChange={(e) => updateField('pin_code', e.target.value)} />
              {errors.pin_code && <span className="field-error">{errors.pin_code}</span>}
            </div>
          </div>

          <div className="form-row">
            <label>Crops You Grow</label>
            <div className="crop-selector">
              {CROPS.map((crop) => (
                <label key={crop} className={`crop-chip ${form.crops.includes(crop) ? 'selected' : ''}`} onClick={() => toggleCrop(crop)}>
                  <input type="checkbox" checked={form.crops.includes(crop)} readOnly />
                  {crop}
                </label>
              ))}
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-row">
              <label>Farm Size (acres)</label>
              <input type="number" step="0.5" min="0" placeholder="e.g., 5" value={form.farm_size_acres} onChange={(e) => updateField('farm_size_acres', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Preferred Mandi</label>
              <select value={form.preferred_mandi} onChange={(e) => updateField('preferred_mandi', e.target.value)}>
                <option value="">Select mandi</option>
                {MANDIS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Storage (quintals)</label>
              <input type="number" min="0" placeholder="e.g., 50" value={form.storage_capacity_quintals} onChange={(e) => updateField('storage_capacity_quintals', e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🌱 Create Account'}
          </button>
        </form>

        <p className="login-note" style={{ textAlign: 'center', marginTop: '1rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
