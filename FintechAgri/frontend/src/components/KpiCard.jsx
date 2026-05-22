import React from 'react';

const KpiCard = ({ label, value, delta, deltaType, children }) => {
  return (
    <div className="kpi-card" data-testid="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta && (
        <div className={`kpi-delta ${deltaType || ''}`}>{delta}</div>
      )}
      {children && <div className="kpi-extra">{children}</div>}
    </div>
  );
};

export default KpiCard;
