import { useState, useEffect } from 'react';
import { marketAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TIMEFRAMES = [{ label: '30D', days: 30 }, { label: '90D', days: 90 }, { label: '1Y', days: 365 }];

export default function PriceForecast() {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Onion');
  const [selectedDays, setSelectedDays] = useState(30);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [cropsData, historyData] = await Promise.all([
        marketAPI.getCrops(), marketAPI.getPriceHistory(selectedCrop, selectedDays),
      ]);
      setCrops(cropsData); setHistory(historyData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedCrop, selectedDays]);

  const prices = history.map((h) => h.price_close).filter(Boolean);
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const volatility = prices.length > 1
    ? ((Math.sqrt(prices.map((p) => (p - avgPrice) ** 2).reduce((a, b) => a + b, 0) / prices.length) / avgPrice) * 100) : 0;

  const chartData = (() => {
    const byDate = {};
    history.forEach((item) => {
      if (!byDate[item.date]) byDate[item.date] = [];
      byDate[item.date].push(item.price_close);
    });
    return Object.entries(byDate).map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      rawDate: date,
      price: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    })).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  })();

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading forecast...</p></div>;
  if (error) return <div className="page-error"><p>⚠️ {error}</p><button className="btn btn-primary" onClick={fetchData}>Retry</button></div>;

  return (
    <div className="page active" style={{ display: 'block', animation: 'fadeSlide 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Price Trends & Analysis</h1>
          <p className="page-subtitle">Historical price data and market insights</p>
        </div>
        <div className="page-actions">
          <select className="btn btn-ghost" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            {crops.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="chart-tabs">
            {TIMEFRAMES.map(({ label, days }) => (
              <button key={days} onClick={() => setSelectedDays(days)}
                className={`chart-tab ${selectedDays === days ? 'active' : ''}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Highest</div><div className="kpi-value" style={{ color: 'var(--c-up)' }}>₹{Math.round(maxPrice).toLocaleString('en-IN')}</div></div>
        <div className="kpi-card"><div className="kpi-label">Lowest</div><div className="kpi-value" style={{ color: 'var(--c-down)' }}>₹{Math.round(minPrice).toLocaleString('en-IN')}</div></div>
        <div className="kpi-card"><div className="kpi-label">Average</div><div className="kpi-value">₹{Math.round(avgPrice).toLocaleString('en-IN')}</div></div>
        <div className="kpi-card"><div className="kpi-label">Volatility</div><div className="kpi-value" style={{ color: volatility > 15 ? 'var(--c-down)' : 'var(--c-up)' }}>±{volatility.toFixed(1)}%</div></div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">{selectedCrop} — {TIMEFRAMES.find((t) => t.days === selectedDays)?.label} Price History</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--c-text-lt)', fontSize: 11 }} interval={Math.floor(chartData.length / 8)} />
              <YAxis tick={{ fill: 'var(--c-text-lt)', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="price" stroke="var(--c-primary)" strokeWidth={2.5} dot={false} name="Avg Price (₹/q)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insights */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">💡 Market Insights</h3></div>
        <ul style={{ color: 'var(--c-text-mid)', fontSize: '0.9rem', lineHeight: 2, paddingLeft: '1.25rem' }}>
          <li>Price range: <strong style={{ color: 'var(--c-primary)' }}>₹{Math.round(minPrice).toLocaleString('en-IN')} – ₹{Math.round(maxPrice).toLocaleString('en-IN')}</strong> over {selectedDays} days</li>
          <li>Volatility at <strong style={{ color: volatility > 15 ? 'var(--c-down)' : 'var(--c-up)' }}>{volatility.toFixed(1)}%</strong> — {volatility > 15 ? 'High risk, consider holding' : 'Relatively stable market'}</li>
          <li>Current price is {prices.length > 0 && prices[prices.length - 1] > avgPrice ? 'above' : 'below'} the period average</li>
          <li>Monitor arrivals data for supply-side pressure signals</li>
        </ul>
      </div>
    </div>
  );
}
