import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Phone,
  BarChart3, Building2, Settings, LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard'          },
  { to: '/requests',    icon: FileText,         label: 'Requests'           },
  { to: '/call-logs',   icon: Phone,            label: 'Call Logs'          },
  { to: '/analytics',  icon: BarChart3,        label: 'Analytics'          },
  { to: '/departments', icon: Building2,        label: 'Departments'        },
  { to: '/settings',   icon: Settings,         label: 'Settings'           },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const userName  = localStorage.getItem('userName')  || 'MDRRMO Admin';
  const userEmail = localStorage.getItem('userEmail') || 'admin@mdrrmo.gov.ph';
  const initials  = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 260,
      background: 'linear-gradient(180deg, #1E3A5F 0%, #0F172A 100%)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img
          src="/logo.jpg"
          alt="SRQ Logo"
          style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            objectFit: 'cover',
            boxShadow: '0 4px 16px rgba(220,38,38,0.45)',
          }}
        />
        <div>
          <div style={{ color: 'white', fontSize: 16, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.3px' }}>SendResqPls</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Emergency Response</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>
          Main Menu
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, marginBottom: 2,
              background: isActive ? '#2563EB' : 'transparent',
              color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 700 : 500,
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.4)' : 'none',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget;
              if (!el.classList.contains('active')) {
                el.style.background = 'rgba(255,255,255,0.08)';
                el.style.color = 'white';
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              if (!el.classList.contains('active')) {
                el.style.background = 'transparent';
                el.style.color = 'rgba(255,255,255,0.55)';
              }
            }}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10, marginBottom: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; e.currentTarget.style.color = '#FCA5A5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          <span>Logout</span>
        </button>

        {/* Admin profile */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
