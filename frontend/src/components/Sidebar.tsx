import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Phone,
  BarChart3, Building2, Settings, LogOut, Radio,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/requests',    icon: FileText,         label: 'Requests'    },
  { to: '/call-logs',   icon: Phone,            label: 'Call Logs'   },
  { to: '/analytics',  icon: BarChart3,         label: 'Analytics'   },
  { to: '/departments', icon: Building2,        label: 'Departments' },
  { to: '/settings',   icon: Settings,          label: 'Settings'    },
];

const S: Record<string, React.CSSProperties> = {
  aside: {
    position: 'fixed', left: 0, top: 0, bottom: 0, width: 256,
    background: 'linear-gradient(180deg, #0F1F38 0%, #0A1628 100%)',
    display: 'flex', flexDirection: 'column',
    zIndex: 50,
    borderRight: '1px solid rgba(255,255,255,0.05)',
  },
  brand: {
    padding: '22px 20px 18px',
    display: 'flex', alignItems: 'center', gap: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logoWrap: {
    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
    overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)',
  },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  brandName: {
    color: '#fff', fontSize: 14, fontWeight: 800,
    letterSpacing: '-0.3px', lineHeight: 1.2,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10.5,
    fontWeight: 500, marginTop: 2, letterSpacing: '0.02em',
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 700,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    padding: '20px 18px 8px',
  },
  nav: { flex: 1, padding: '4px 12px', overflowY: 'auto' as const },
  liveWrap: {
    margin: '0 12px 12px',
    padding: '9px 12px',
    borderRadius: 10,
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16,185,129,0.18)',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#10B981',
    boxShadow: '0 0 6px #10B981',
    flexShrink: 0,
    animation: 'sidebarPulse 2s ease-in-out infinite',
  },
  liveText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 },
  footer: {
    padding: '10px 12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  logoutBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', borderRadius: 9, marginBottom: 8,
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.38)', fontSize: 13.5, fontWeight: 500,
    transition: 'all 0.15s', fontFamily: 'inherit',
  },
  adminCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800, color: 'white',
    border: '1.5px solid rgba(255,255,255,0.15)',
  },
};

export default function Sidebar() {
  const navigate = useNavigate();
  const userName  = localStorage.getItem('userName')  || 'MDRRMO Admin';
  const userEmail = localStorage.getItem('userEmail') || 'admin@mdrrmo.gov.ph';
  const initials  = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    ['token','userId','userName','userEmail','userRole'].forEach(k => localStorage.removeItem(k));
    navigate('/admin/login');
  };

  return (
    <aside style={S.aside}>
      <style>{`
        @keyframes sidebarPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} }
        .sb-nav-link {
          display:flex; align-items:center; gap:11px;
          padding:10px 14px; border-radius:9px; margin-bottom:2px;
          text-decoration:none; font-size:13.5px; font-weight:500;
          transition:all 0.15s ease; color:rgba(255,255,255,0.48);
          position:relative; overflow:hidden;
        }
        .sb-nav-link:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); }
        .sb-nav-link.active {
          background:rgba(37,99,235,0.22);
          color:#fff; font-weight:700;
          box-shadow:inset 0 0 0 1px rgba(37,99,235,0.35);
        }
        .sb-nav-link.active::before {
          content:''; position:absolute; left:0; top:20%; bottom:20%;
          width:3px; border-radius:0 3px 3px 0;
          background:linear-gradient(180deg, #60A5FA, #2563EB);
        }
        .sb-nav-link .sb-icon { flex-shrink:0; opacity:0.75; }
        .sb-nav-link.active .sb-icon { opacity:1; }
        .sb-logout:hover { background:rgba(239,68,68,0.12)!important; color:#FCA5A5!important; }
      `}</style>

      {/* Brand */}
      <div style={S.brand}>
        <div style={S.logoWrap}>
          <img src="/logo.jpg" alt="SRQ" style={S.logo} />
        </div>
        <div>
          <div style={S.brandName}>SendResqPls</div>
          <div style={S.brandSub}>MDRRMO Balayan, Batangas</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.sectionLabel}>Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}>
            <Icon size={17} className="sb-icon" />
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Live status */}
      <div style={S.liveWrap}>
        <Radio size={13} color="#10B981" style={{ flexShrink: 0 }} />
        <span style={S.liveText}>System Online</span>
        <div style={{ ...S.liveDot, marginLeft: 'auto' }} />
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <button
          className="sb-logout"
          onClick={handleLogout}
          style={S.logoutBtn}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          <span>Sign Out</span>
        </button>
        <div style={S.adminCard}>
          <div style={S.avatar}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#F1F5F9', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
