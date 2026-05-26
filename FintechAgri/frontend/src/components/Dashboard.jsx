import { useState, useEffect } from 'react';
import { dashboardAPI, marketAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import KpiCard from './KpiCard';
import MarketTable from './MarketTable';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [prices, setPrices] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Onion');
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, cropsData] = await Promise.all([
        dashboardAPI.getSummary(),
        marketAPI.getCrops(),
      ]);
      setSummary(summaryData);
      setCrops(cropsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const data = await marketAPI.getPrices(selectedCrop);
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchPrices(); }, [selectedCrop]);

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading dashboard...</p></div>;
  if (error) return <div className="page-error"><p>⚠️ {error}</p><button className="btn btn-primary" onClick={fetchData}>Retry</button></div>;

  return (
    <div className="page active" style={{ display: 'block', animation: 'fadeSlide 0.3s ease' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name || 'Farmer'} <span className="wave">👋</span></h1>
          <p className="page-subtitle">{user?.farm_location ? `📍 ${user.farm_location}` : 'Your agricultural intelligence dashboard'}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total Stock Value"
          value={`₹${(summary?.total_stock_value || 0).toLocaleString('en-IN')}`}
        >
          <span className="kpi-sub">From your inventory</span>
        </KpiCard>
        <KpiCard
          label="Best Price Today"
          value={summary?.best_price_today ? `₹${Math.round(summary.best_price_today.price).toLocaleString('en-IN')}` : 'N/A'}
          delta={summary?.best_price_today ? `${summary.best_price_today.crop} @ ${summary.best_price_today.mandi}` : null}
          deltaType="up"
        />
        <KpiCard
          label="Market Trend"
          value={summary?.market_trend === 'up' ? '📈 Rising' : summary?.market_trend === 'down' ? '📉 Falling' : '➡️ Stable'}
          delta="7-day comparison"
          deltaType={summary?.market_trend === 'up' ? 'up' : summary?.market_trend === 'down' ? 'down' : null}
        />
        <KpiCard
          label="Crops Tracked"
          value={summary?.crops_tracked || 0}
          delta="Active monitoring"
        />
      </div>

      {/* AI Recommendation */}
      {summary?.recommendation && (
        <div className="ai-insight-banner">
          <span className="insight-icon">🤖</span>
          <div className="insight-content">
            <span className="insight-tag">AI Insight</span>
            {summary.recommendation}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Market Prices Card */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title">Latest Market Prices</h3>
            <select
              className="chart-select"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-border)', fontSize: '0.85rem', background: '#fff' }}
            >
              {crops.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <MarketTable data={prices} />
        </div>

        {/* Quick Actions Card */}
        <div className="card actions-card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a href="/market" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>🏪 View All Prices</a>
            <a href="/inventory" className="btn btn-amber" style={{ textDecoration: 'none', textAlign: 'center' }}>📦 Manage Inventory</a>
            <a href="/forecast" className="btn btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>📈 Price Trends</a>
            <a href="/social" className="btn btn-ghost" style={{ textDecoration: 'none', textAlign: 'center' }}>👥 Community Hub</a>
          </div>

          {/* Tracked Crops */}
          {user?.crops && user.crops.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 className="card-title" style={{ marginBottom: '10px' }}>Your Crops</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {user.crops.map((c) => (
                  <span key={c} className="card-tag">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
