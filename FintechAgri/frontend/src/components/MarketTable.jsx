export default function MarketTable({ data }) {
  if (!data || data.length === 0) {
    return <p className="empty-msg">No market data available</p>;
  }

  const latestByMandi = {};
  data.forEach((item) => {
    const key = item.mandi;
    if (!latestByMandi[key] || new Date(item.date) > new Date(latestByMandi[key].date)) {
      latestByMandi[key] = item;
    }
  });
  const rows = Object.values(latestByMandi);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Mandi</th>
            <th>Price (₹/q)</th>
            <th>Min</th>
            <th>Max</th>
            <th>Arrivals (q)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, i) => (
            <tr key={item.id || i}>
              <td>
                <strong>{item.mandi}</strong>
                {item.state && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--c-text-lt)' }}>{item.state}</span>}
              </td>
              <td style={{ fontWeight: 700, color: 'var(--c-primary)' }}>
                ₹{Math.round(item.price_close).toLocaleString('en-IN')}
              </td>
              <td style={{ color: 'var(--c-text-lt)' }}>₹{Math.round(item.price_min).toLocaleString('en-IN')}</td>
              <td style={{ color: 'var(--c-text-lt)' }}>₹{Math.round(item.price_max).toLocaleString('en-IN')}</td>
              <td>{Math.round(item.arrivals_quintals).toLocaleString('en-IN')}</td>
              <td style={{ fontSize: '0.82rem', color: 'var(--c-text-lt)' }}>
                {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
