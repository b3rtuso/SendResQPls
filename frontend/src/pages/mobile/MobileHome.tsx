import { useNavigate } from 'react-router-dom';
import { Phone, AlertTriangle, Shield, Droplets, Flame, Heart } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

const hotlines = [
  { name: 'National Emergency', number: '911', color: '#DC2626' },
  { name: 'Red Cross', number: '143', color: '#EF4444' },
  { name: 'MDRRMO Balayan', number: '09171234567', color: '#2563EB' },
  { name: 'BFP Fire', number: '160', color: '#F59E0B' },
];

const safetyTips = [
  { icon: Shield, color: '#2563EB', bg: '#EFF6FF', title: 'Stay Calm', tip: 'Take deep breaths. Panicking makes it harder to think clearly and act quickly.' },
  { icon: Droplets, color: '#0EA5E9', bg: '#F0F9FF', title: 'Flood Safety', tip: 'Move to higher ground immediately. Never walk or drive through floodwater.' },
  { icon: Flame, color: '#EF4444', bg: '#FEF2F2', title: 'Fire Safety', tip: 'Stay low to avoid smoke. Cover your nose with a damp cloth and exit quickly.' },
  { icon: Heart, color: '#EC4899', bg: '#FDF2F8', title: 'First Aid', tip: 'Apply pressure to wounds. Keep the injured person still until help arrives.' },
];

export default function MobileHome() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="mobile-shell">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
          padding: '36px 24px 28px', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <img src="/logo.jpg" alt="SRQ Logo" style={{ width: 50, height: 50, borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', objectFit: 'cover' }} />
            <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 4 }}>Welcome back,</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{userName.split(' ')[0]}</div>
          </div>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 17,
          }}>{initials}</div>
        </div>

        {/* SOS Card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div
            onClick={() => navigate('/mobile/report')}
            style={{
              padding: '36px 24px', background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              borderRadius: 20, textAlign: 'center', color: 'white',
              cursor: 'pointer', boxShadow: '0 8px 32px rgba(220,38,38,0.3)',
              transition: 'transform 0.15s', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
            }} />
            <div style={{
              width: 60, height: 60, margin: '0 auto 14px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, margin: '0 0 6px' }}>SEND EMERGENCY ALERT</h2>
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>Tap to send an instant alert to MDRRMO</p>
          </div>
        </div>

        {/* Emergency Hotlines */}
        <div style={{ padding: '24px 20px 0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Emergency Hotlines</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {hotlines.map(h => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '18px 12px', borderRadius: 16, background: 'white',
                  border: '1.5px solid #E2E8F0', textDecoration: 'none',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${h.color}12`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                }}>
                  <Phone size={20} color={h.color} />
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 2, textAlign: 'center' }}>{h.name}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{h.number}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Safety Tips */}
        <div style={{ padding: '24px 20px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Safety Tips</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {safetyTips.map(t => (
              <div key={t.title} style={{
                display: 'flex', gap: 14, padding: '16px',
                background: t.bg, borderRadius: 16, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <t.icon size={20} color={t.color} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{t.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
