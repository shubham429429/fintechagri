import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!phone || !key) {
      setError('Please enter both mobile number and farm key.');
      return;
    }
    // Simulate login success
    onLogin({ name: 'Ramesh Singh', phone });
  };

  return (
    <section className="page active" id="page-login" data-testid="login-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome to AgroMind</h1>
          <p className="page-subtitle">Sign in to access your personal market dashboard and selling recommendations.</p>
        </div>
      </div>
      <div className="login-grid">
        <div className="login-card card">
          <h3 className="card-title">Farmer Login</h3>
          {error && <div style={{color: 'red', marginBottom: '10px'}} data-testid="login-error">{error}</div>}
          <div className="form-row">
            <label htmlFor="loginPhone">Mobile Number</label>
            <input 
              id="loginPhone" 
              type="tel" 
              placeholder="Enter mobile number" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-phone"
            />
          </div>
          <div className="form-row">
            <label htmlFor="loginFarmKey">Farm Key</label>
            <input 
              id="loginFarmKey" 
              type="password" 
              placeholder="Enter farm key" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              data-testid="input-key"
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleLogin} type="button" data-testid="btn-login">Sign In</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
