import React, { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Products from './components/Products.jsx';
import SalesPOS from './components/SalesPOS.jsx';
import SalesHistory from './components/SalesHistory.jsx';
import DailyReport from './components/DailyReport.jsx';

import { 
  Store, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  FileBarChart2, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync theme attribute to HTML tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken('');
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  // Guard routing
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Active module page selection mapping
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'products':
        return <Products />;
      case 'sales':
        return <SalesPOS />;
      case 'history':
        return <SalesHistory />;
      case 'reports':
        return <DailyReport />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'sales', label: 'POS Checkout', icon: <ShoppingCart size={20} /> },
    { id: 'products', label: 'Products CRUD', icon: <Package size={20} /> },
    { id: 'history', label: 'Sales History', icon: <History size={20} /> },
    { id: 'reports', label: 'Daily Reports', icon: <FileBarChart2 size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)'
          }}>
            <Store size={20} />
          </div>
          <span className="sidebar-title">Track & Sell</span>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li key={item.id}>
              <button 
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={toggleTheme} 
              className="btn btn-secondary btn-icon"
              title="Toggle Light/Dark Theme"
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            <button 
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', color: 'var(--danger)' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content wrapper */}
      <div className="main-wrapper">
        <header className="top-header no-print">
          <h2 className="page-title">
            {menuItems.find(item => item.id === activeTab)?.label}
          </h2>

          <div className="header-actions">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {localStorage.getItem('userEmail')}
            </span>
            
            {/* Mobile Header utilities */}
            <button 
              onClick={toggleTheme} 
              className="btn btn-secondary btn-icon"
              style={{ display: 'none', padding: '8px' }} // media queries in css show this on mobile
              id="mobile-theme-btn"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button 
              onClick={handleLogout}
              className="btn btn-danger btn-icon"
              style={{ display: 'none', padding: '8px' }} // media queries show on mobile
              id="mobile-logout-btn"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="content-body">
          {renderContent()}
        </main>
      </div>

      {/* Add inline CSS for mobile layout specific handles */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-theme-btn, #mobile-logout-btn {
            display: inline-flex !important;
          }
          .sidebar {
            display: ${sidebarOpen ? 'flex' : 'none'} !important;
            position: fixed;
            top: 70px;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100% !important;
            height: calc(100vh - 70px);
            background-color: var(--bg-sidebar);
          }
          .sidebar-menu {
            flex-direction: column !important;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}
