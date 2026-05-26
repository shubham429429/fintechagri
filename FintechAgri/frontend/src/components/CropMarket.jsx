import { useState, useEffect } from 'react';
import { marketAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MarketTable from './MarketTable';

export default function CropMarket() {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Onion');
  const [prices, setPrices] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cropsData, pricesData, historyData, summaryData] = await Promise.all([
        marketAPI.getCrops(), marketAPI.getPrices(selectedCrop),
        marketAPI.getPriceHistory(selectedCrop, 30), marketAPI.getCropSummary(selectedCrop),
      ]);
      setCrops(cropsData); setPrices(pricesData); setHistory(historyData); setSummary(summaryData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedCrop]);

  const chartData = (() => {
    const byDate = {};
    history.forEach((item) => {
      if (!byDate[item.date]) byDate[item.date] = { prices: [], arrivals: [] };
      byDate[item.date].prices.push(item.price_close);
    });
    return Object.entries(byDate).map(([d, v]) => ({
      date: new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      rawDate: d,
      price: Math.round(v.prices.reduce((a, b) => a + b, 0) / v.prices.length),
    })).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  })();

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading market data...</p></div>;
  if (error) return <div className="page-error"><p>⚠️ {error}</p><button className="btn btn-primary" onClick={fetchData}>Retry</button></div>;

  return (
    <div className="page active" style={{ display: 'block', animation: 'fadeSlide 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏪 Crop Market Prices</h1>
          <p className="page-subtitle">Real-time mandi prices across India</p>
        </div>
      </div>

      {/* Crop Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {crops.map((crop) => (
          <button key={crop} onClick={() => setSelectedCrop(crop)}
            className={`btn btn-sm ${selectedCrop === crop ? 'btn-primary' : 'btn-ghost'}`}>
            {crop}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Latest Price</div>
            <div className="kpi-value" style={{ color: 'var(--c-primary)' }}>₹{Math.round(summary.latest_price || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">7-Day Average</div>
            <div className="kpi-value" style={{ color: 'var(--c-primary)' }}>₹{Math.round(summary.avg_price_7d || 0).toLocaleString('en-IN')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Price Change</div>
            <div className="kpi-value" style={{ color: (summary.price_change_pct || 0) >= 0 ? 'var(--c-up)' : 'var(--c-down)' }}>
              {(summary.price_change_pct || 0) >= 0 ? '+' : ''}{(summary.price_change_pct || 0).toFixed(1)}%
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Today's Arrivals</div>
            <div className="kpi-value" style={{ color: 'var(--c-primary)' }}>{Math.round(summary.total_arrivals_today || 0).toLocaleString('en-IN')} q</div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">📈 {selectedCrop} — 30-Day Price Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--c-text-lt)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--c-text-lt)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="price" stroke="var(--c-primary)" strokeWidth={2.5} dot={false} name="Price (₹/q)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Market Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mandi-wise Prices — {selectedCrop}</h3>
        </div>
        <MarketTable data={prices} />
      </div>
    </div>
  );
}
