import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Briefcase, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  X 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import initScrollReveal from '../utils/scrollReveal';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize scroll‑reveal once
  useEffect(() => {
    initScrollReveal();
  }, []);

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Employees', path: '/admin/employees', icon: <Users size={20} /> },
    { name: 'Projects', path: '/admin/projects', icon: <Briefcase size={20} /> },
  ];

  const employeeLinks = [
    { name: 'Dashboard', path: '/employee', icon: <LayoutDashboard size={20} /> },
    { name: 'My Projects', path: '/employee/projects', icon: <Briefcase size={20} /> },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <div className="layout-container glass-body">
      {/* Mobile Topbar */}
      <div className="mobile-topbar glass-panel">
        <div className="logo-mobile">
          <img src="/shatechx-mini.png" alt="Logo" className="mini-logo-nav" />
          <span>SHATECHX</span>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="icon-btn">
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/shatechx-mini.png" alt="Logo" className="mini-logo-nav" />
            <span className="brand-name">SHATECHX</span>
          </div>
          <button className="mobile-close icon-btn" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {links.map((link) => (
              <li key={link.name}>
                <Link 
                  to={link.path} 
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{user.email.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
