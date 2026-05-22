import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="layout" data-testid="layout-container">
      <aside className="sidebar" data-testid="sidebar">
        <div className="sidebar-brand">AgroMind</div>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Crop Market</li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar" data-testid="topbar">
          <div className="breadcrumb">Dashboard</div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
