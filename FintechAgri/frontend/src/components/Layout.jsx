import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/market', label: 'Crop Market', icon: '🏪' },
  { path: '/forecast', label: 'Price Trends', icon: '📈' },
  { path: '/inventory', label: 'Inventory', icon: '📦' },
  { path: '/social', label: 'Community', icon: '👥' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><span style={{ fontSize: '1.5rem' }}>🌾</span></div>
          <div>
            <div className="brand-name">AgroMind</div>
            <div className="brand-tag">Agricultural Intelligence</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <i className="nav-icon">{icon}</i>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="farmer-card">
              <div className="farmer-avatar">{user.name?.[0] || 'F'}</div>
              <div>
                <div className="farmer-name">{user.name}</div>
                <div className="farmer-location">{user.farm_location || user.phone}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-ghost btn-full" style={{ color: 'rgba(255,255,255,0.7)' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div style={{ padding: '28px 28px 40px', flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
