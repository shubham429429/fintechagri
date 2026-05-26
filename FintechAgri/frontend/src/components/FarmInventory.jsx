import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

export default function FarmInventory() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ crop: '', quantity_quintals: '', grade: 'A', storage_location: 'On Farm', harvest_date: '', estimated_value: '' });

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [itemsData, summaryData] = await Promise.all([inventoryAPI.getAll(), inventoryAPI.getSummary()]);
      setItems(itemsData); setSummary(summaryData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ crop: '', quantity_quintals: '', grade: 'A', storage_location: 'On Farm', harvest_date: '', estimated_value: '' }); setEditingItem(null); };

  const openEdit = (item) => {
    setForm({ crop: item.crop, quantity_quintals: String(item.quantity_quintals), grade: item.grade || 'A', storage_location: item.storage_location || 'On Farm', harvest_date: item.harvest_date || '', estimated_value: String(item.estimated_value || '') });
    setEditingItem(item); setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      crop: form.crop, quantity_quintals: parseFloat(form.quantity_quintals), grade: form.grade, storage_location: form.storage_location,
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

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading inventory...</p></div>;
  if (error) return <div className="page-error"><p>⚠️ {error}</p><button className="btn btn-primary" onClick={fetchData}>Retry</button></div>;

  return (
    <div className="page active" style={{ display: 'block', animation: 'fadeSlide 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Farm Inventory</h1>
          <p className="page-subtitle">Manage your crop stock and storage</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Add Item</button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-label">Total Items</div><div className="kpi-value">{summary.total_items}</div></div>
          <div className="kpi-card"><div className="kpi-label">Total Stock</div><div className="kpi-value">{summary.total_quantity.toLocaleString('en-IN')} <span>q</span></div></div>
          <div className="kpi-card accent-card"><div className="kpi-label">Total Value</div><div className="kpi-value">₹{summary.total_value.toLocaleString('en-IN')}</div></div>
          <div className="kpi-card"><div className="kpi-label">Crops Stored</div><div className="kpi-value">{Object.keys(summary.items_by_crop).length}</div></div>
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '2rem', marginBottom: '10px' }}>📦</p>
          <p style={{ color: 'var(--c-text-lt)' }}>No inventory items yet. Click "Add Item" to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ transition: 'transform 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--c-primary)' }}>{item.crop}</h3>
                <span className={`grade-badge grade-${(item.grade || 'C').toLowerCase()}`}>Grade {item.grade || 'N/A'}</span>
              </div>
              <div className="inv-row"><span>Quantity</span><strong>{item.quantity_quintals} quintals</strong></div>
              <div className="inv-row"><span>Storage</span><strong>{item.storage_location}</strong></div>
              {item.harvest_date && <div className="inv-row"><span>Harvest</span><strong>{new Date(item.harvest_date).toLocaleDateString('en-IN')}</strong></div>}
              {item.estimated_value && <div className="inv-row"><span>Value</span><strong style={{ color: 'var(--c-primary)' }}>₹{item.estimated_value.toLocaleString('en-IN')}</strong></div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--c-border)' }}>
                <button onClick={() => openEdit(item)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>✏️ Edit</button>
                <button onClick={() => handleDelete(item.id)} className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--c-red)' }}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
