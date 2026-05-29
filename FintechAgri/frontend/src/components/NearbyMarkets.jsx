import { useState, useEffect, useCallback } from 'react';
import { nearbyAPI } from '../services/api';

const RADIUS_OPTIONS = [50, 60, 100];

/* Known farm locations → coordinates mapping */
const LOCATION_COORDS = {
  'Nashik':    { lat: 19.9975, lng: 73.7898 },
  'Pune':      { lat: 18.5204, lng: 73.8567 },
  'Mumbai':    { lat: 19.0760, lng: 72.8777 },
  'Lasalgaon': { lat: 20.1879, lng: 74.2407 },
  'Delhi':     { lat: 28.7041, lng: 77.1025 },
  'Vashi':     { lat: 19.0771, lng: 73.0091 },
};

/* Default demo location: Nashik */
const DEFAULT_LOCATION = { lat: 19.9975, lng: 73.7898, name: 'Nashik' };

function getUserLocation() {
  try {
    const raw = localStorage.getItem('agromind_token');
    if (!raw) return DEFAULT_LOCATION;
    const payload = JSON.parse(atob(raw.split('.')[1]));
    const loc = payload?.farm_location;
    if (loc && LOCATION_COORDS[loc]) {
      return { ...LOCATION_COORDS[loc], name: loc };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCATION;
}

export default function NearbyMarkets() {
  const [radius, setRadius] = useState(100);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userLoc = getUserLocation();

  const fetchMarkets = useCallback(async (r) => {
    setLoading(true);
    setError(null);
    try {
      const data = await nearbyAPI.getMarkets(userLoc.lat, userLoc.lng, r);
      setMarkets(data);
    } catch (err) {
      setError(err.message || 'Failed to load nearby markets');
    } finally {
      setLoading(false);
    }
  }, [userLoc.lat, userLoc.lng]);

  useEffect(() => {
    fetchMarkets(radius);
  }, [radius, fetchMarkets]);

  const handleRadius = (r) => {
    setRadius(r);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📍 Nearby Markets</h1>
          <p className="page-subtitle">
            Produce availability from mandis near {userLoc.name} ({userLoc.lat}°N, {userLoc.lng}°E)
          </p>
        </div>
        <div className="page-actions">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              className={`btn ${radius === r ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleRadius(r)}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="loading-spinner" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: 'var(--c-text-mid)', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchMarkets(radius)}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && markets.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗺️</div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--c-primary)',
            marginBottom: '8px',
          }}>
            No Markets Within {radius} km
          </h3>
          <p style={{ color: 'var(--c-text-lt)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Try increasing the search radius to find more mandis.
          </p>
          {radius < 100 && (
            <button className="btn btn-primary" onClick={() => handleRadius(100)}>
              Expand to 100 km
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && !error && markets.length > 0 && (
        <>
          {/* Summary KPI strip */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card">
              <div className="kpi-label">Markets Found</div>
              <div className="kpi-value">{markets.length}</div>
              <div className="kpi-sub">within {radius} km radius</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Produce</div>
              <div className="kpi-value">
                {markets.reduce((sum, m) => sum + (m.total_quintals || 0), 0).toLocaleString()}
                <span> qtl</span>
              </div>
              <div className="kpi-sub">across all mandis</div>
            </div>
            <div className="kpi-card accent-card">
              <div className="kpi-label">Nearest Mandi</div>
              <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
                {markets[0]?.mandi}
              </div>
              <div className="kpi-sub">{markets[0]?.distance_km} km away</div>
            </div>
          </div>

          {/* Market Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px',
          }}>
            {markets.map((market) => (
              <div className="card" key={market.mandi}>
                {/* Card Header */}
                <div className="card-header">
                  <div>
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🏪 {market.mandi}
                    </div>
                    {market.state && (
                      <div className="card-sub">{market.state}</div>
                    )}
                  </div>
                  <span className="card-tag">
                    📍 {market.distance_km} km away
                  </span>
                </div>

                {/* Produce list */}
                {market.produce && market.produce.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Table header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'var(--c-cream)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--c-text-lt)',
                    }}>
                      <span>Crop</span>
                      <span style={{ textAlign: 'right' }}>Quantity</span>
                      <span style={{ textAlign: 'right' }}>Price</span>
                    </div>
                    {/* Produce rows */}
                    {market.produce.map((p) => (
                      <div key={p.crop} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '8px',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--c-border)',
                        fontSize: '0.88rem',
                      }}>
                        <span style={{ fontWeight: '600', color: 'var(--c-text)' }}>
                          {p.crop}
                        </span>
                        <span style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--c-text-mid)',
                          fontSize: '0.82rem',
                        }}>
                          {(p.quantity_quintals || 0).toLocaleString()} qtl
                        </span>
                        <span style={{
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--c-primary)',
                          fontWeight: '600',
                          fontSize: '0.82rem',
                        }}>
                          {p.latest_price != null ? `₹${p.latest_price.toLocaleString()}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{
                    color: 'var(--c-text-lt)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    padding: '12px 0',
                  }}>
                    No produce data available today
                  </p>
                )}

                {/* Total footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--c-border)',
                }}>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    color: 'var(--c-text-lt)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Total Produce
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: 'var(--c-primary)',
                  }}>
                    {(market.total_quintals || 0).toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>quintals</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
