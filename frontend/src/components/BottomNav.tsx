import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Clock, User } from 'lucide-react';

const tabs = [
  { to: '/mobile',         icon: Home,       label: 'Home',    end: true },
  { to: '/mobile/report',  icon: PlusCircle, label: 'Report',  end: false },
  { to: '/mobile/history', icon: Clock,      label: 'History', end: false },
  { to: '/mobile/profile', icon: User,       label: 'Profile', end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <style>{`
        .bn-tab {
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; text-decoration: none; font-size: 10px; font-weight: 600;
          color: #94A3B8; padding: 7px 18px; border-radius: 14px;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
          letter-spacing: 0.02em; position: relative;
        }
        .bn-tab:hover { color: #475569; }
        .bn-tab.active { color: #2563EB; background: rgba(37,99,235,0.08); }
        .bn-tab.active .bn-icon-wrap {
          background: rgba(37,99,235,0.12);
          transform: translateY(-2px);
        }
        .bn-icon-wrap {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .bn-report-tab.active { color: #DC2626; background: rgba(220,38,38,0.07); }
        .bn-report-tab.active .bn-icon-wrap { background: rgba(220,38,38,0.1); }
        .bn-report-tab:hover { color: #DC2626; }
      `}</style>
      {tabs.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bn-tab${to === '/mobile/report' ? ' bn-report-tab' : ''}${isActive ? ' active' : ''}`
          }
        >
          <div className="bn-icon-wrap">
            <Icon size={20} strokeWidth={2} />
          </div>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
