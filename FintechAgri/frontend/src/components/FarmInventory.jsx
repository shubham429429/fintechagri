import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/* Freshness badge color mapping */
const freshnessStyle = (pct) => {
  if (pct >= 70) return { bg: '#e8f5e9', color: '#2e7d32', label: '🟢 Fresh' };
  if (pct >= 40) return { bg: '#fff3e0', color: '#e65100', label: '🟡 Aging' };
  return { bg: '#ffebee', color: '#c62828', label: '🔴 Critical' };
};

export default function FarmInventory() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [freshness, setFreshness] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    crop: '', quantity_quintals: '', grade: 'A',
    storage_location: 'On Farm', harvest_date: '', estimated_value: '',
  });

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [itemsData, summaryData, freshnessData] = await Promise.all([
        inventoryAPI.getAll(),
        inventoryAPI.getSummary(),
        inventoryAPI.getFreshness(),
      ]);
      setItems(itemsData);
      setSummary(summaryData);
      setFreshness(freshnessData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const data = await inventoryAPI.getHistory();
      setHistory(data);
      setShowHistory(true);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  /* Freshness lookup by item id */
  const freshnessMap = {};
  freshness.forEach((f) => { freshnessMap[f.inventory_id] = f; });

  const resetForm = () => {
    setForm({ crop: '', quantity_quintals: '', grade: 'A', storage_location: 'On Farm', harvest_date: '', estimated_value: '' });
    setEditingItem(null);
  };

  const openEdit = (item) => {
    setForm({
      crop: item.crop,
      quantity_quintals: String(item.quantity_quintals),
      grade: item.grade || 'A',
      storage_location: item.storage_location || 'On Farm',
      harvest_date: item.harvest_date || '',
      estimated_value: String(item.estimated_value || ''),
    });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      crop: form.crop,
      quantity_quintals: parseFloat(form.quantity_quintals),
      grade: form.grade,
      storage_location: form.storage_location,
      ...(form.harvest_date && { harvest_date: form.harvest_date }),
      ...(form.estimated_value && { estimated_value: parseFloat(form.estimated_value) }),
    };
    try {
      if (editingItem) await inventoryAPI.update(editingItem.id, payload);
      else await inventoryAPI.create(payload);
      setShowModal(false); resetForm(); fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this inventory item?')) return;
    try { await inventoryAPI.delete(id); fetchData(); } catch (err) { alert(err.message); }
  };

  /* Stock history chart data */
  const historyChartData = history.slice(0, 20).reverse().map((h) => ({
    label: `${h.crop} ${new Date(h.changed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
    before: h.quantity_before || 0,
    after: h.quantity_after || 0,
    change: (h.quantity_after || 0) - (h.quantity_before || 0),
  }));

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading inventory...</p></div>;
  if (error) return <div className="page-error"><p>⚠️ {error}</p><button className="btn btn-primary" onClick={fetchData}>Retry</button></div>;

  return (
    <div className="page active" style={{ display: 'block', animation: 'fadeSlide 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Farm Inventory</h1>
          <p className="page-subtitle">Manage your crop stock, freshness, and storage</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchHistory}>📜 Stock History</button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Add Item</button>
        </div>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-label">Total Items</div><div className="kpi-value">{summary.total_items}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total Stock</div><div className="kpi-value">{summary.total_quantity.toLocaleString('en-IN')} <span>q</span></div></div>
          <div className="kpi-card accent-card"><div className="kpi-label">Total Value</div><div className="kpi-value">₹{summary.total_value.toLocaleString('en-IN')}</div></div>
          <div className="kpi-card">
            <div className="kpi-label">Freshness Alert</div>
            <div className="kpi-value" style={{ color: freshness.some((f) => f.freshness_pct < 40) ? 'var(--c-down)' : 'var(--c-up)' }}>
              {freshness.filter((f) => f.freshness_pct < 40).length > 0
                ? `⚠️ ${freshness.filter((f) => f.freshness_pct < 40).length} item(s)`
                : '✅ All Good'}
            </div>
          </div>
        </div>
      )}

      {/* Freshness Alert Banner */}
      {freshness.filter((f) => f.freshness_pct < 30).length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3e0, #ffebee)',
          border: '1px solid #ffcc80',
          borderRadius: 'var(--radius)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div>
            <strong style={{ color: '#e65100' }}>Spoilage Risk!</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#bf360c' }}>
              {freshness.filter((f) => f.freshness_pct < 30).map((f) => f.crop).join(', ')} — freshness is critically low. Consider selling soon.
            </p>
          </div>
        </div>
      )}

      {/* Inventory Cards */}
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '2rem', marginBottom: '10px' }}>📦</p>
          <p style={{ color: 'var(--c-text-lt)' }}>No inventory items yet. Click "Add Item" to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {items.map((item) => {
            const f = freshnessMap[item.id];
            const fs = f ? freshnessStyle(f.freshness_pct) : null;

            return (
              <div key={item.id} className="card" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--c-primary)' }}>{item.crop}</h3>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {/* Freshness Badge */}
                    {fs && (
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: fs.bg,
                        color: fs.color,
                        whiteSpace: 'nowrap',
                      }}>
                        {fs.label} {Math.round(f.freshness_pct)}%
                      </span>
                    )}
                    <span className={`grade-badge grade-${(item.grade || 'C').toLowerCase()}`}>Grade {item.grade || 'N/A'}</span>
                  </div>
                </div>

                {/* Freshness Progress Bar */}
                {f && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--c-text-lt)', marginBottom: '4px' }}>
                      <span>Freshness</span>
                      <span>{f.days_remaining != null ? `${f.days_remaining}d remaining` : '—'}</span>
                    </div>
                    <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, f.freshness_pct))}%`,
                        borderRadius: '3px',
                        background: f.freshness_pct >= 70
                          ? 'linear-gradient(90deg, #66bb6a, #43a047)'
                          : f.freshness_pct >= 40
                            ? 'linear-gradient(90deg, #ffa726, #fb8c00)'
                            : 'linear-gradient(90deg, #ef5350, #c62828)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )}

                <div className="inv-row"><span>Quantity</span><strong>{item.quantity_quintals} quintals</strong></div>
                <div className="inv-row"><span>Storage</span><strong>{item.storage_location}</strong></div>
                {item.harvest_date && <div className="inv-row"><span>Harvest</span><strong>{new Date(item.harvest_date).toLocaleDateString('en-IN')}</strong></div>}
                {item.estimated_value && <div className="inv-row"><span>Value</span><strong style={{ color: 'var(--c-primary)' }}>₹{item.estimated_value.toLocaleString('en-IN')}</strong></div>}

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--c-border)' }}>
                  <button onClick={() => openEdit(item)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>✏️ Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--c-red)' }}>🗑️ Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>📜 Stock Change History</h2>
              <button className="modal-close" onClick={() => setShowHistory(false)}>✕</button>
            </div>

            {/* History Chart */}
            {historyChartData.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={historyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: '8px', fontSize: '0.85rem' }} />
                    <Bar dataKey="after" fill="var(--c-primary)" radius={[4, 4, 0, 0]} name="Qty After" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* History Table */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--c-text-lt)', padding: '30px 0' }}>No stock changes recorded yet.</p>
              ) : (
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Crop</th>
                      <th>Type</th>
                      <th>Before</th>
                      <th>After</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td><strong>{h.crop}</strong></td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: h.change_type === 'created' ? '#e8f5e9' : h.change_type === 'sold' ? '#ffebee' : '#e3f2fd',
                            color: h.change_type === 'created' ? '#2e7d32' : h.change_type === 'sold' ? '#c62828' : '#1565c0',
                          }}>
                            {h.change_type}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{h.quantity_before} q</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{h.quantity_after} q</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--c-text-lt)' }}>
                          {new Date(h.changed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>
            <div className="form-row"><label>Crop *</label><input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="e.g., Onion" /></div>
            <div className="form-row"><label>Quantity (quintals) *</label><input type="number" step="0.5" value={form.quantity_quintals} onChange={(e) => setForm({ ...form, quantity_quintals: e.target.value })} /></div>
            <div className="form-grid-2">
              <div className="form-row"><label>Grade</label><select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}><option>A</option><option>B</option><option>C</option></select></div>
              <div className="form-row"><label>Storage</label><select value={form.storage_location} onChange={(e) => setForm({ ...form, storage_location: e.target.value })}><option>On Farm</option><option>Cold Storage</option><option>Warehouse</option></select></div>
            </div>
            <div className="form-row"><label>Harvest Date</label><input type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} /></div>
            <div className="form-row"><label>Estimated Value (₹)</label><input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} /></div>
            <div className="modal-actions">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-ghost">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={!form.crop || !form.quantity_quintals}>{editingItem ? 'Update' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
