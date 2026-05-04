import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Phone,
  BarChart3,
  Building2,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: FileText, label: 'Requests', badge: 12 },
  { to: '/call-logs', icon: Phone, label: 'Call Logs' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics & Reports' },
  { to: '/departments', icon: Building2, label: 'Departments' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon" style={{ padding: 0, overflow: 'hidden' }}>
          <img src=""/logo.jpg"" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <h1>MDRRMO</h1>
          <span>Disaster Response</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="nav-icon" size={20} />
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout}>
          <LogOut className="nav-icon" size={20} />
          Logout
        </button>
        <div className="sidebar-user">
          <div className="avatar">AD</div>
          <div className="user-info">
            <div className="user-name">Admin User</div>
            <div className="user-role">MDRRMO Dispatcher</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
