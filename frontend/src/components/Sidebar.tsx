import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Phone,
  BarChart3, Building2, Settings, LogOut, X,
} from 'lucide-react';
import { useAdminNav } from '../context/AdminNavContext';

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
  const { isSidebarOpen, closeSidebar } = useAdminNav();
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
    closeSidebar();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="sb-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation drawer"
        />
      )}

      <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
            z-index: 1001;
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            font-family: 'Geist', 'Inter', system-ui, sans-serif;
            user-select: none;
            transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .sb-backdrop {
            display: none;
          }

          .sb-mobile-close {
            display: none;
          }

          @media (max-width: 1024px) {
            .app-sidebar {
              transform: translateX(-100%);
              box-shadow: none;
            }
            .app-sidebar.open {
              transform: translateX(0);
              box-shadow: 12px 0 40px rgba(0, 0, 0, 0.45);
            }
            .sb-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.65);
              backdrop-filter: blur(4px);
              -webkit-backdrop-filter: blur(4px);
              z-index: 1000;
              animation: fadeIn 0.2s ease both;
            }
            .sb-mobile-close {
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 10px;
              width: 32px;
              height: 32px;
              color: white;
              cursor: pointer;
              margin-left: auto;
              padding: 0;
            }
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
            background: rgba(255, 255, 255, 0.09);
            color: #FFFFFF;
            font-weight: 700;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
          }

          .sb-nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 16%;
            bottom: 16%;
            width: 4px;
            border-radius: 0 4px 4px 0;
            background: linear-gradient(180deg, #FBBF24, #F59E0B, #D97706);
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
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
            background: rgba(245, 158, 11, 0.18);
            border-color: rgba(245, 158, 11, 0.45);
            color: #FBBF24;
            box-shadow: 0 2px 10px rgba(245, 158, 11, 0.25);
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
            <img src="/logo.jpg" alt="SendResQPls" className="sb-logo-img" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="sb-brand-title">SendResQPls</div>
            <div className="sb-brand-sub">MDRRMO BALAYAN</div>
          </div>
          <button className="sb-mobile-close" onClick={closeSidebar} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="sb-nav-container">
          <div className="sb-section-label">Main Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) => `sb-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="sb-nav-icon-box">
                  <Icon size={16} />
                </div>
                <span style={{ flex: 1 }}>{item.label}</span>
              </NavLink>
            );
          })}
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
    </>
  );
}
