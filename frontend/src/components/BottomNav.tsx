import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Clock, User, Bell } from 'lucide-react';
import { getStoredNotifications } from '../pages/mobile/MobileNotifications';

const tabs = [
  { to: '/mobile',               icon: Home,       label: 'Home',    end: true,  isReport: false, isBell: false },
  { to: '/mobile/report',        icon: PlusCircle, label: 'Report',  end: false, isReport: true,  isBell: false },
  { to: '/mobile/notifications', icon: Bell,       label: 'Notifications',  end: false, isReport: false, isBell: true  },
  { to: '/mobile/history',       icon: Clock,      label: 'History', end: false, isReport: false, isBell: false },
  { to: '/mobile/profile',       icon: User,       label: 'Profile', end: false, isReport: false, isBell: false },
];

export default function BottomNav() {
  const unread = getStoredNotifications().filter(n => !n.read).length;

  return (
    <nav className="bottom-nav">
      <style>{`
        .bn-tab {
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; text-decoration: none; font-size: 10px; font-weight: 700;
          color: #94A3B8; padding: 7px 14px; border-radius: 12px;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
          letter-spacing: 0.04em; position: relative; text-transform: uppercase;
          min-width: 54px;
        }
        .bn-tab:active { opacity: 0.7; }
        .bn-tab.active { color: #2563EB; }
        .bn-tab.active::before {
          content: '';
          position: absolute; top: 0; left: 50%;
          transform: translateX(-50%);
          width: 24px; height: 2.5px;
          background: #2563EB;
          border-radius: 0 0 3px 3px;
        }
        .bn-tab.active .bn-icon-wrap { transform: translateY(-1px); }
        .bn-icon-wrap {
          width: 28px; height: 28px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
          position: relative;
        }
        .bn-report-tab.active { color: #DC2626; }
        .bn-report-tab.active::before { background: #DC2626; }
        .bn-badge {
          position: absolute; top: -4px; right: -6px;
          min-width: 16px; height: 16px; border-radius: 8px;
          background: #EF4444; color: white;
          font-size: 9px; font-weight: 800; line-height: 16px;
          text-align: center; padding: 0 3px;
          border: 1.5px solid white;
        }
      `}</style>
      {tabs.map(({ to, icon: Icon, label, end, isReport, isBell }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bn-tab${isReport ? ' bn-report-tab' : ''}${isActive ? ' active' : ''}`
          }
        >
          <div className="bn-icon-wrap">
            <Icon size={19} strokeWidth={2} />
            {isBell && unread > 0 && (
              <span className="bn-badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </div>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
