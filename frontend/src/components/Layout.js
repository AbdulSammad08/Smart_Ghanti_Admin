import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Layout = ({ children, title }) => {
  const [isDark, setIsDark] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', newTheme);
  };

  const navItems = [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/subscription-plans', icon: 'fas fa-money-bill-wave', label: 'Subscription Plans' },
    { path: '/homeowners', icon: 'fas fa-users', label: 'Homeowners' },
    { path: '/active-subscriptions', icon: 'fas fa-id-card', label: 'Active Subscriptions' },
    { path: '/transfer-requests', icon: 'fas fa-exchange-alt', label: 'Transfer Requests' },
    { path: '/payment-proofs', icon: 'fas fa-receipt', label: 'Payment Proofs' },
    { path: '/admin-management', icon: 'fas fa-user-shield', label: 'Admin Management' }
  ];

  return (
    <div className="admin-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.svg" alt="Logo" className="logo" />
          <div className="brand">
            <h3>Smart Doorbell</h3>
            <p>Admin Portal</p>
          </div>
        </div>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
              <Link to={item.path} className="nav-link">
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          <li className="nav-item">
            <button onClick={logout} className="nav-link" style={{background: 'none', border: 'none', width: '100%', textAlign: 'left'}}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>
      
      <main className="main-content">
        <header className="content-header">
          <h2>{title}</h2>
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              <i className={isDark ? 'fas fa-sun' : 'fas fa-moon'}></i>
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="user-info">
              <span>Welcome, Admin</span>
            </div>
          </div>
        </header>
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;