import { useState, useEffect, useRef, useCallback } from 'react';
import { dashboardAPI, marketAPI, predictionsAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import KpiCard from './KpiCard';
import MarketTable from './MarketTable';
import { formatPrice, unitLabel, UnitToggle } from '../utils/priceUtils';

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

export default function Dashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [prices, setPrices] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Onion');
  const [crops, setCrops] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState('quintal');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const intervalRef = useRef(null);

  const totalArrivals = summary?.total_arrivals_today
    ? Object.values(summary.total_arrivals_today).reduce((a, b) => a + b, 0)
    : 0;

  const fetchData = useCallback(async () => {
    setLoading((prev) => !summary ? true : prev); // Only show loader on first load
    setError(null);
    try {
      const [summaryData, cropsData, alertsData] = await Promise.all([
        dashboardAPI.getSummary(),
        marketAPI.getCrops(),
        marketAPI.getAlerts(),
      ]);
      setSummary(summaryData);
      setCrops(cropsData);
      setAlerts(alertsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [summary]);

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

  /* Auto-refresh toggle */
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchData();
        fetchPrices();
      }, AUTO_REFRESH_INTERVAL);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, selectedCrop]);

  /* Alert severity icon */
  const alertIcon = (type, severity) => {
    if (type === 'oversupply') return severity === 'high' ? '🔴' : '🟡';
    return severity === 'high' ? '📈' : '📊';
  };

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
        <div className="page-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Auto-refresh toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            background: autoRefresh ? '#e8f5e9' : 'var(--c-cream)',
            border: `1px solid ${autoRefresh ? '#a5d6a7' : 'var(--c-border)'}`,
            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <span style={{
              display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
              background: autoRefresh ? '#43a047' : '#bdbdbd',
              animation: autoRefresh ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }} />
            {autoRefresh ? 'Live' : 'Auto-refresh off'}
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '0.72rem', color: 'var(--c-text-lt)' }}>
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <UnitToggle unit={unit} setUnit={setUnit} />
        </div>
      </div>

      {/* Market Alerts Banner */}
      {alerts.length > 0 && !alertsDismissed && (
        <div style={{
          background: 'linear-gradient(135deg, #fff8e1, #fff3e0)',
          border: '1px solid #ffe082',
          borderRadius: 'var(--radius)',
          padding: '14px 20px',
          marginBottom: '20px',
          animation: 'fadeSlide 0.4s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <strong style={{ color: '#e65100', fontSize: '0.92rem' }}>Market Alerts ({alerts.length})</strong>
            </div>
            <button
              onClick={() => setAlertsDismissed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bf360c', fontSize: '1.1rem' }}
            >✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {alerts.slice(0, 3).map((alert, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: alert.type === 'oversupply' ? 'rgba(255,152,0,0.08)' : 'rgba(76,175,80,0.08)',
                fontSize: '0.85rem',
              }}>
                <span>{alertIcon(alert.type, alert.severity)}</span>
                <span style={{ color: 'var(--c-text)', flex: 1 }}>{alert.message}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
                  background: alert.severity === 'high' ? '#ffcdd2' : '#fff9c4',
                  color: alert.severity === 'high' ? '#c62828' : '#f57f17',
                }}>{alert.severity}</span>
              </div>
            ))}
            {alerts.length > 3 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--c-text-lt)', margin: '4px 0 0', paddingLeft: '30px' }}>
                + {alerts.length - 3} more alerts
              </p>
            )}
          </div>
        </div>
      )}

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
          value={summary?.best_price_today ? formatPrice(summary.best_price_today.price, unit) : 'N/A'}
          delta={summary?.best_price_today ? `${summary.best_price_today.crop} @ ${summary.best_price_today.mandi} (${unitLabel(unit)})` : null}
          deltaType="up"
        />
        <KpiCard
          label="Market Trend"
          value={summary?.market_trend === 'up' ? '📈 Rising' : summary?.market_trend === 'down' ? '📉 Falling' : '➡️ Stable'}
          delta="7-day comparison"
          deltaType={summary?.market_trend === 'up' ? 'up' : summary?.market_trend === 'down' ? 'down' : null}
        />
        <KpiCard
          label="Active Alerts"
          value={alerts.length > 0 ? `${alerts.length}` : '0'}
          delta={alerts.length > 0 ? `${alerts.filter((a) => a.type === 'oversupply').length} oversupply, ${alerts.filter((a) => a.type === 'shortage').length} shortage` : 'No active alerts'}
          deltaType={alerts.length > 0 ? 'down' : 'up'}
        />
        <KpiCard
          label="Today's Arrivals"
          value={`${totalArrivals.toLocaleString('en-IN')} q`}
          delta="For your tracked crops"
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
          <MarketTable data={prices} unit={unit} />
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

      {/* Nearby Market Produce */}
      {summary?.nearby_produce_summary && summary.nearby_produce_summary.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">Nearby Market Produce (100km)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {summary.nearby_produce_summary.map(mandi => (
              <div key={mandi.mandi} className="accent-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: 'var(--c-primary)' }}>{mandi.mandi}</h4>
                  <span className="badge">{mandi.distance_km} km</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--c-text-mid)' }}>
                  Total Produce: <strong>{mandi.total_quintals.toLocaleString('en-IN')} q</strong>
                </div>
                <ul style={{ paddingLeft: '20px', marginTop: '10px', marginBottom: 0, fontSize: '0.85rem' }}>
                  {mandi.produce.slice(0, 3).map(p => (
                    <li key={p.crop}>
                      {p.crop}: {p.quantity_quintals.toLocaleString('en-IN')} q
                      {p.latest_price ? ` @ ${formatPrice(p.latest_price, unit)}` : ''}
                    </li>
                  ))}
                  {mandi.produce.length > 3 && (
                    <li style={{ listStyle: 'none', color: 'var(--c-text-lt)', marginTop: '5px' }}>
                      + {mandi.produce.length - 3} more crops
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
