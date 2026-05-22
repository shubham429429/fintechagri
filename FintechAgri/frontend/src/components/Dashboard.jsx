import React from 'react';
import KpiCard from './KpiCard';
import MarketTable from './MarketTable';

const mockMarketData = [
  ['Lasalgaon MH', 1340, '1,100 – 1,580', '4,200 q', '22 km', 'HOLD'],
  ['Pune APMC MH', 1420, '1,200 – 1,620', '2,800 q', '168 km', 'SELL 30%']
];

const Dashboard = ({ user, onLogout }) => {
  return (
    <section className="page active" id="page-dashboard" data-testid="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good morning, <span id="dashboardName">{user?.name}</span> 👋</h1>
          <p className="page-subtitle">Your AgroMind market dashboard is ready.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={onLogout} data-testid="btn-logout">Logout</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Estimated Crop Value" value="₹3,42,000" delta="↑ 12% vs last season" deltaType="up" />
        <KpiCard label="Monthly Savings Target" value="₹8,200" delta="₹5,576 saved (68%)" />
      </div>

      <div className="dashboard-grid">
        <div className="card market-table-card">
          <div className="card-header">
            <h3 className="card-title">Live Mandi Prices</h3>
          </div>
          <MarketTable data={mockMarketData} />
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
