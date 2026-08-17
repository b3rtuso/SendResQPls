import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Phone,
  BarChart3, Building2, Settings, LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/requests',    icon: FileText,         label: 'Requests'    },
  { to: '/call-logs',   icon: Phone,            label: 'Call Logs'   },
  { to: '/analytics',  icon: BarChart3,         label: 'Analytics'   },
  { to: '/departments', icon: Building2,        label: 'Departments' },
  { to: '/settings',   icon: Settings,          label: 'Settings'    },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'MDRRMO Admin');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');

  useEffect(() => {
    const syncUser = () => {
      setUserName(localStorage.getItem('userName') || 'MDRRMO Admin');
      setUserEmail(localStorage.getItem('userEmail') || '');
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  const handleLogout = () => {
    ['token', 'userId', 'userName', 'userEmail', 'userRole'].forEach(k => localStorage.removeItem(k));
    navigate('/admin/login');
  };

  return (
    <aside className="app-sidebar">
      <style>{`
        .app-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 260px;
          background: linear-gradient(180deg, #0F2942 0%, #153454 50%, #1B3C62 100%);
          display: flex;
          flex-direction: column;
          z-index: 50;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          font-family: 'Geist', 'Inter', system-ui, sans-serif;
          user-select: none;
        }

        .sb-brand {
          padding: 24px 20px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sb-logo-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        }

        .sb-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sb-brand-title {
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.3px;
          line-height: 1.15;
        }

        .sb-brand-sub {
          color: rgba(255, 255, 255, 0.45);
          font-size: 11px;
          font-weight: 500;
          margin-top: 3px;
          letter-spacing: 0.01em;
        }

        .sb-section-label {
          font-size: 10.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 20px 16px 8px;
        }

        .sb-nav-container {
          flex: 1;
          padding: 6px 12px;
          overflow-y: auto;
        }

        .sb-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 4px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          position: relative;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sb-nav-item:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #FFFFFF;
          transform: translateX(2px);
        }

        .sb-nav-item.active {
          background: rgba(37, 99, 235, 0.24);
          color: #FFFFFF;
          font-weight: 700;
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.28);
        }

        .sb-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 18%;
          bottom: 18%;
          width: 3.5px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #60A5FA, #2563EB);
        }

        .sb-nav-icon-box {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sb-nav-item.active .sb-nav-icon-box {
          background: rgba(37, 99, 235, 0.4);
          border-color: rgba(96, 165, 250, 0.45);
          color: #93C5FD;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .sb-footer {
          padding: 14px 14px 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.12);
        }

        .sb-signout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .sb-signout-btn:hover {
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.3);
          color: #FCA5A5;
        }

        .sb-user-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sb-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1D4ED8, #2563EB);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: #FFFFFF;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .sb-user-name {
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sb-user-email {
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      {/* Brand Header */}
      <div className="sb-brand">
        <div className="sb-logo-box">
          <img src="/logo.jpg" alt="MDRRMO Logo" className="sb-logo-img" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="sb-brand-title">SendResQPls</div>
          <div className="sb-brand-sub">MDRRMO Balayan</div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="sb-nav-container">
        <div className="sb-section-label">Command Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sb-nav-item${isActive ? ' active' : ''}`}
          >
            <div className="sb-nav-icon-box">
              <Icon size={16} />
            </div>
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer User Info */}
      <div className="sb-footer">
        <button
          className="sb-signout-btn"
          onClick={handleLogout}
          aria-label="Sign out of admin session"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>

        <div className="sb-user-card">
          <div className="sb-user-avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sb-user-name" title={userName}>{userName}</div>
            <div className="sb-user-email" title={userEmail || 'Administrator'}>
              {userEmail || 'Administrator'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
