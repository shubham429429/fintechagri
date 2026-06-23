import { useState, useEffect } from 'react';
import { marketAPI, predictionsAPI } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { formatPrice, unitLabel, convertPrice, UnitToggle } from '../utils/priceUtils';

const TIMEFRAMES = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function PriceForecast() {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('Onion');
  const [selectedDays, setSelectedDays] = useState(30);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [volatility, setVolatility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState('quintal');
  const [selectedMandi, setSelectedMandi] = useState('Pune');

  const mandis = ['Pune', 'Lasalgaon', 'Nashik', 'Azadpur', 'Vashi'];

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [cropsData, historyData] = await Promise.all([
        marketAPI.getCrops(),
        marketAPI.getPriceHistory(selectedCrop, selectedDays),
      ]);
      setCrops(cropsData);
      setHistory(historyData);

      // Fetch forecast and volatility in parallel
      const [forecastData, volData] = await Promise.all([
        predictionsAPI.getCropForecast(selectedMandi, selectedCrop, 7).catch(() => null),
        marketAPI.getVolatility(selectedCrop, selectedMandi, 7).catch(() => null),
      ]);
      setForecast(forecastData?.forecasts || []);
      setVolatility(volData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedCrop, selectedDays, selectedMandi]);

  /* Historical chart data */
  const prices = history.map((h) => h.price_close).filter(Boolean);
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const vol = prices.length > 1
    ? ((Math.sqrt(prices.map((p) => (p - avgPrice) ** 2).reduce((a, b) => a + b, 0) / prices.length) / avgPrice) * 100)
    : 0;

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
      type: 'historical',
    })).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  })();

  /* Forecast chart data (appended to historical) */
  const forecastChartData = forecast.map((f) => ({
    date: new Date(f.forecast_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    rawDate: f.forecast_date,
    forecastPrice: Math.round(f.predicted_price_modal),
    forecastMin: Math.round(f.predicted_price_min),
    forecastMax: Math.round(f.predicted_price_max),
    confidence: f.confidence_score,
    type: 'forecast',
  }));

  const combinedChartData = [
    ...chartData.map((d) => ({
      ...d,
      price: convertPrice(d.price, unit),
    })),
    ...forecastChartData.map((d) => ({
      ...d,
      forecastPrice: convertPrice(d.forecastPrice, unit),
      forecastMin: convertPrice(d.forecastMin, unit),
      forecastMax: convertPrice(d.forecastMax, unit),
    })),
  ];

  /* Price direction */
  const priceDirection = volatility?.trend || (
    prices.length >= 2 && prices[prices.length - 1] > prices[0] ? 'up' : prices.length >= 2 ? 'down' : 'stable'
  );

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading forecast...</p></div>;
  if (error) return <div className="page-error"><p>⚠️ {error}</p><button className="btn btn-primary" onClick={fetchData}>Retry</button></div>;

  return (
    <div className="page active" style={{ display: 'block', animation: 'fadeSlide 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Price Trends & Forecast</h1>
          <p className="page-subtitle">Historical prices, AI predictions, and market analysis</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <UnitToggle unit={unit} setUnit={setUnit} />
          <select className="btn btn-ghost" value={selectedMandi} onChange={(e) => setSelectedMandi(e.target.value)}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            {mandis.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
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

      {/* Stats KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Highest</div>
          <div className="kpi-value" style={{ color: 'var(--c-up)' }}>{formatPrice(maxPrice, unit)}</div>
          <div className="kpi-sub">{unitLabel(unit)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Lowest</div>
          <div className="kpi-value" style={{ color: 'var(--c-down)' }}>{formatPrice(minPrice, unit)}</div>
          <div className="kpi-sub">{unitLabel(unit)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average</div>
          <div className="kpi-value">{formatPrice(avgPrice, unit)}</div>
          <div className="kpi-sub">{unitLabel(unit)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Volatility</div>
          <div className="kpi-value" style={{ color: vol > 15 ? 'var(--c-down)' : 'var(--c-up)' }}>±{vol.toFixed(1)}%</div>
          <div className="kpi-sub">{vol > 15 ? 'High risk' : 'Moderate'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Trend</div>
          <div className="kpi-value" style={{ color: priceDirection === 'up' ? 'var(--c-up)' : priceDirection === 'down' ? 'var(--c-down)' : 'var(--c-text-mid)' }}>
            {priceDirection === 'up' ? '📈 Rising' : priceDirection === 'down' ? '📉 Falling' : '➡️ Stable'}
          </div>
          <div className="kpi-sub">{selectedMandi}</div>
        </div>
      </div>

      {/* 7-Day Forecast Card */}
      {forecast.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #e8f5e9, #e3f2fd)',
          border: '1px solid #a5d6a7',
          borderRadius: 'var(--radius)',
          padding: '18px 22px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.3rem' }}>🤖</span>
            <strong style={{ color: '#1b5e20', fontSize: '0.95rem' }}>AI Price Forecast — {selectedCrop} @ {selectedMandi}</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
            {forecast.slice(0, 7).map((f, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                textAlign: 'center',
                border: '1px solid #c8e6c9',
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--c-text-lt)', fontWeight: 600, marginBottom: '4px' }}>
                  {new Date(f.forecast_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--c-primary)', fontFamily: 'var(--font-display)' }}>
                  {formatPrice(f.predicted_price_modal, unit)}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--c-text-lt)', marginTop: '3px' }}>
                  {formatPrice(f.predicted_price_min, unit)} – {formatPrice(f.predicted_price_max, unit)}
                </div>
                <div style={{
                  marginTop: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: f.confidence_score >= 0.7 ? '#2e7d32' : '#e65100',
                }}>
                  {Math.round(f.confidence_score * 100)}% conf.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combined Chart (History + Forecast) */}
      {combinedChartData.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">
              {selectedCrop} — {TIMEFRAMES.find((t) => t.days === selectedDays)?.label} History
              {forecast.length > 0 ? ' + 7D Forecast' : ''}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={combinedChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--c-text-lt)', fontSize: 11 }}
                interval={Math.max(0, Math.floor(combinedChartData.length / 8))} />
              <YAxis
                tick={{ fill: 'var(--c-text-lt)', fontSize: 11 }}
                domain={['auto', 'auto']}
                label={{ value: unitLabel(unit), angle: -90, position: 'insideLeft', style: { fill: 'var(--c-text-lt)', fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: '8px' }}
                formatter={(value, name) => [
                  `${formatPrice(unit === 'kg' ? value * 100 : value, unit)}`,
                  name === 'price' ? 'Historical' : name === 'forecastPrice' ? 'Predicted' : name,
                ]}
              />
              {/* Forecast confidence band */}
              <Area type="monotone" dataKey="forecastMax" stroke="none" fill="#c8e6c9" fillOpacity={0.3} name="Upper Bound" />
              <Area type="monotone" dataKey="forecastMin" stroke="none" fill="#c8e6c9" fillOpacity={0.3} name="Lower Bound" />
              {/* Historical price line */}
              <Line type="monotone" dataKey="price" stroke="var(--c-primary)" strokeWidth={2.5} dot={false} name="price" />
              {/* Forecast line (dashed) */}
              <Line type="monotone" dataKey="forecastPrice" stroke="#43a047" strokeWidth={2.5}
                strokeDasharray="6 3" dot={{ r: 3, fill: '#43a047' }} name="forecastPrice" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px', fontSize: '0.78rem', color: 'var(--c-text-lt)' }}>
            <span>━━ Historical</span>
            <span>┅┅ Predicted</span>
            <span style={{ background: '#c8e6c9', padding: '1px 10px', borderRadius: '3px' }}>Confidence Band</span>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">💡 Market Insights</h3></div>
        <ul style={{ color: 'var(--c-text-mid)', fontSize: '0.9rem', lineHeight: 2, paddingLeft: '1.25rem' }}>
          <li>Price range: <strong style={{ color: 'var(--c-primary)' }}>{formatPrice(minPrice, unit)} – {formatPrice(maxPrice, unit)}</strong> over {selectedDays} days</li>
          <li>Volatility at <strong style={{ color: vol > 15 ? 'var(--c-down)' : 'var(--c-up)' }}>{vol.toFixed(1)}%</strong> — {vol > 15 ? 'High risk, consider holding' : 'Relatively stable market'}</li>
          <li>Current price is {prices.length > 0 && prices[prices.length - 1] > avgPrice ? 'above' : 'below'} the period average</li>
          {forecast.length > 0 && (
            <li>
              AI predicts <strong style={{ color: forecast[6]?.predicted_price_modal > (prices[prices.length - 1] || 0) ? 'var(--c-up)' : 'var(--c-down)' }}>
                {formatPrice(forecast[6]?.predicted_price_modal || 0, unit)}
              </strong> in 7 days ({Math.round((forecast[6]?.confidence_score || 0) * 100)}% confidence)
            </li>
          )}
          <li>Monitor arrivals data for supply-side pressure signals</li>
        </ul>
      </div>
    </div>
  );
}
