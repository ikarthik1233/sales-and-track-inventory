import React, { useState } from 'react';
import { Menu, X, Store, LayoutDashboard, ShoppingCart, ShoppingBag, History, FileBarChart2, Sun, Moon, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import Products from './components/Products.jsx';
import SalesPOS from './components/SalesPOS.jsx';
import SalesHistory from './components/SalesHistory.jsx';
import DailyReport from './components/DailyReport.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import ResetPassword from './components/ResetPassword.jsx';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState('login');
  const [resetToken, setResetToken] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Check URL parameters for reset password token on mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) {
      setResetToken(t);
      setAuthMode('reset-password');
      // Clean query parameters from URL path so reloading doesn't trap the user
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Apply dark theme attributes to document element
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      setToken(null);
      setResetSuccessMessage('');
      setAuthMode('login');
      setActiveTab('dashboard');
    }
  };

  if (!token) {
    if (authMode === 'reset-password') {
      return (
        <ResetPassword 
          token={resetToken} 
          onResetSuccess={(msg) => {
            setResetSuccessMessage(msg);
            setAuthMode('login');
          }}
        />
      );
    }
    
    if (authMode === 'register') {
      return (
        <Register 
          onRegisterSuccess={handleLoginSuccess} 
          switchToLogin={() => setAuthMode('login')} 
        />
      );
    }
    
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        switchToRegister={() => setAuthMode('register')} 
        successMessage={resetSuccessMessage}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'pos':
        return <SalesPOS />;
      case 'history':
        return <SalesHistory />;
      case 'reports':
        return <DailyReport />;
      default:
        return <Dashboard />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'products', label: 'Products Catalog', icon: <ShoppingBag size={20} /> },
    { id: 'pos', label: 'Sales POS Checkout', icon: <ShoppingCart size={20} /> },
    { id: 'history', label: 'Sales History', icon: <History size={20} /> },
    { id: 'reports', label: 'Daily Reports', icon: <FileBarChart2 size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Semi-transparent dark overlay behind drawer */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Navigation Sidebar/Drawer */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--text-main)', /* Blend badge with sage/cream theme */
            color: '#fff',
            borderRadius: 'var(--radius-sm)'
          }}>
            <Store size={20} />
          </div>
          <span className="sidebar-title">Track & Sell</span>

          {/* Close button (X) inside sidebar header on mobile */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="mobile-only-close"
            title="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Email Row (Mobile-only stacked row) */}
        <div className="mobile-drawer-user">
          <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Active User
          </span>
          <span style={{ color: '#fff', fontWeight: 500, wordBreak: 'break-all' }}>
            {localStorage.getItem('userEmail')}
          </span>
        </div>

        {/* Navigation Links */}
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

        {/* Theme and Logout stacked rows */}
        <div className="sidebar-footer">
          <button 
            onClick={toggleTheme} 
            className="sidebar-footer-btn theme-toggle-row"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="footer-btn-text">Theme Mode</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="sidebar-footer-btn logout-row"
            title="Logout"
          >
            <LogOut size={20} />
            <span className="footer-btn-text">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="top-header no-print">
          {/* Mobile Hamburger menu on the left */}
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="btn btn-secondary btn-icon"
            style={{ display: 'none' }}
            id="mobile-nav-toggle"
            title="Open Menu"
          >
            <Menu size={24} />
          </button>

          {/* Mobile centered/left app name branding */}
          <span className="mobile-only-brand">Track & Sell</span>
          
          {/* Desktop-only Page Title */}
          <h2 className="page-title desktop-only-title" style={{ marginRight: 'auto' }}>
            {menuItems.find(item => item.id === activeTab)?.label}
          </h2>
        </header>

        <main className="content-body">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
