import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Clock, User, Bell } from 'lucide-react';
import { getStoredNotifications } from '../pages/mobile/MobileNotifications';

const tabs = [
  { to: '/mobile',               icon: Home,       label: 'Home',    end: true,  isReport: false, isBell: false },
  { to: '/mobile/report',        icon: PlusCircle, label: 'Report',  end: false, isReport: true,  isBell: false },
  { to: '/mobile/notifications', icon: Bell,       label: 'Alerts',  end: false, isReport: false, isBell: true  },
  { to: '/mobile/history',       icon: Clock,      label: 'History', end: false, isReport: false, isBell: false },
  { to: '/mobile/profile',       icon: User,       label: 'Profile', end: false, isReport: false, isBell: false },
];

export default function BottomNav() {
  const unread = getStoredNotifications().filter(n => !n.read).length;

  return (
    <nav className="bottom-nav">
      <style>{`
        /* ── Bottom Nav Shell ── */
        .bottom-nav {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          margin: 0 auto !important;
          width: 100% !important;
          max-width: 480px !important;
          height: 68px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-around !important;
          background: rgba(255, 255, 255, 0.96) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-top: 1px solid rgba(226, 232, 240, 0.9) !important;
          box-shadow: 0 -4px 24px rgba(15, 23, 42, 0.07) !important;
          z-index: 99999 !important;
          padding: 0 4px env(safe-area-inset-bottom, 0px) !important;
          box-sizing: border-box !important;
        }

        /* ── Individual Tab ── */
        .bn-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          font-size: 9.5px;
          font-weight: 600;
          color: #94A3B8;
          padding: 6px 0;
          min-width: 60px;
          min-height: 56px;
          border-radius: 16px;
          transition: color 0.2s ease;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          position: relative;
          flex: 1;
          cursor: pointer;
        }

        /* Active state — default blue */
        .bn-tab.active {
          color: #2563EB;
          font-weight: 800;
        }

        /* Glowing dot indicator above icon for active tab */
        .bn-tab.active .bn-dot {
          opacity: 1;
          transform: scale(1);
        }

        .bn-dot {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #2563EB;
          opacity: 0;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Report tab active — red */
        .bn-report-tab.active {
          color: #DC2626;
        }
        .bn-report-tab.active .bn-dot {
          background: #DC2626;
        }

        /* Icon wrapper — subtle background on active */
        .bn-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .bn-tab.active .bn-icon-wrap {
          background: rgba(37, 99, 235, 0.12);
          transform: translateY(-2px) scale(1.08);
          animation: bnTabActiveBounce 0.36s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .bn-report-tab.active .bn-icon-wrap {
          background: rgba(220, 38, 38, 0.12);
        }

        @keyframes bnTabActiveBounce {
          0% {
            transform: scale(0.85);
          }
          60% {
            transform: scale(1.15) translateY(-3px);
          }
          100% {
            transform: scale(1.08) translateY(-2px);
          }
        }

        /* Press / tap state */
        .bn-tab:active .bn-icon-wrap {
          transform: scale(0.88);
        }

        /* Notification badge */
        .bn-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 17px;
          height: 17px;
          border-radius: 9px;
          background: #EF4444;
          color: white;
          font-size: 9px;
          font-weight: 800;
          line-height: 17px;
          text-align: center;
          padding: 0 4px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.45);
          animation: badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes badgePop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
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
          {/* Active indicator dot above icon */}
          <span className="bn-dot" />

          {/* Icon with optional badge */}
          <div className="bn-icon-wrap">
            <Icon size={20} strokeWidth={2} />
            {isBell && unread > 0 && (
              <span className="bn-badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </div>

          {/* Label */}
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
