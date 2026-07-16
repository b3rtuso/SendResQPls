import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AlertTriangle, Shield, Droplets, Flame, Heart, ChevronDown, MapPin, MapPinOff, X } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import FcmBannerOverlay from '../../components/FcmBannerOverlay';
import { getMyIncidents, cachedGet } from '../../api/client';
import { setupPushNotifications } from '../../utils/pushNotificationHelper';
import { getStoredNotifications, saveNotifications, type StoredNotif } from './MobileNotifications';


const hotlines = [
  { name: 'National Emergency', number: '911', color: '#DC2626' },
  { name: 'Red Cross', number: '143', color: '#EF4444' },
  { name: 'MDRRMO Balayan', number: '09171234567', color: '#2563EB' },
  { name: 'BFP Fire', number: '160', color: '#F59E0B' },
];

const safetyTips = [
  { icon: Shield, color: '#2563EB', bg: '#EFF6FF', title: 'Stay Calm', tip: 'Take deep breaths. Panicking makes it harder to think clearly.' },
  { icon: Droplets, color: '#0EA5E9', bg: '#F0F9FF', title: 'Flood Safety', tip: 'Move to high ground immediately. Do not walk or drive through floodwaters.' },
  { icon: Flame, color: '#EF4444', bg: '#FEF2F2', title: 'Fire Safety', tip: 'Stay away from smoke. Cover your nose with a damp cloth and evacuate immediately.' },
  { icon: Heart, color: '#EC4899', bg: '#FDF2F8', title: 'First Aid', tip: 'Apply pressure to wounds with a clean cloth to stop bleeding. Do not move injured persons unless necessary.' },
];

const STATUS_KEY = 'srq_last_statuses';

export default function MobileHome() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const userId = localStorage.getItem('userId');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Location permission state
  type LocStatus = 'idle' | 'granted' | 'denied' | 'unavailable';
  const [locStatus, setLocStatus] = useState<LocStatus>('idle');
  const [showLocBanner, setShowLocBanner] = useState(true);

  // Unified polling — writes new notifications to localStorage for the notifications page
  const checkForUpdates = async (isFirstLoad = false) => {
    if (!userId) return;
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const url = `/incidents/my/${userId}`;
      const res = isFirstLoad
        ? await cachedGet(API_BASE + url, 20000)
        : await getMyIncidents(userId);
      const incidents = res.data || [];
      const stored: Record<string, string> = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
      const newNotifs: StoredNotif[] = [];

      incidents.forEach((inc: any) => {
        const prev = stored[inc.id];
        if (prev && prev !== inc.status) {
          newNotifs.push({
            id: inc.id,
            type: inc.aiDetectedType || 'Emergency',
            status: inc.status,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
          });
        }
        stored[inc.id] = inc.status;
      });

      localStorage.setItem(STATUS_KEY, JSON.stringify(stored));
      if (newNotifs.length > 0) {
        const existing = getStoredNotifications();
        saveNotifications([...newNotifs, ...existing].slice(0, 30));
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    checkForUpdates(true); // First load: uses cache, no duplicate
    pollRef.current = setInterval(() => checkForUpdates(false), 30000); // Poll every 30s
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId]);


  // Request push notifications setup on mount
  useEffect(() => {
    if (userId) {
      setupPushNotifications();
    }
  }, [userId]);

  // Request location permission and track grant status
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus('unavailable');
      return;
    }
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') setLocStatus('granted');
        else if (result.state === 'denied') setLocStatus('denied');
        else {
          navigator.geolocation.getCurrentPosition(
            () => setLocStatus('granted'),
            () => setLocStatus('denied'),
            { timeout: 10000, enableHighAccuracy: true }
          );
        }
        result.onchange = () => {
          if (result.state === 'granted') setLocStatus('granted');
          else if (result.state === 'denied') setLocStatus('denied');
        };
      });
    } else {
      navigator.geolocation.getCurrentPosition(
        () => setLocStatus('granted'),
        () => setLocStatus('denied'),
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Auto-dismiss the green location banner after 4s
  useEffect(() => {
    if (locStatus === 'granted') {
      const t = setTimeout(() => setShowLocBanner(false), 4000);
      return () => clearTimeout(t);
    }
  }, [locStatus]);

  return (
    <div className="mobile-shell" style={{ background: '#F1F5F9' }}>
      <FcmBannerOverlay />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* ── Header ─────────────────────────────────── */}
        <div className="mobile-home-header">
          {/* Top row: logo + actions */}
          <div className="header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.jpg" alt="SRQ" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.25)' }} />
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1 }}>SendResQPls</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3, marginTop: 1 }}>MDRRMO Balayan, Batangas</div>
              </div>
            </div>
            {/* Clickable Avatar redirects to Profile */}
            <button
              onClick={() => navigate('/mobile/profile')}
              style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, color: 'white',
                backdropFilter: 'blur(4px)', cursor: 'pointer', padding: 0,
                fontFamily: 'inherit', outline: 'none',
              }}
              aria-label="Profile"
            >
              {initials}
            </button>
          </div>
          {/* Greeting row */}
          <div>
            <div className="greeting">Hello,</div>
            <div className="user-name">{userName}</div>
          </div>
        </div>

        {/* ── Location Banner (clean minimal pill) ────────── */}
        {showLocBanner && (locStatus === 'denied' || locStatus === 'unavailable') && (
          <div style={{
            margin: '20px 16px 0',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: '#FFF7ED',
            border: '1px solid #FED7AA',
            borderRadius: 12,
            animation: 'slideDown 0.22s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <MapPinOff size={16} color="#F97316" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#9A3412' }}>
              {locStatus === 'denied' ? 'Enable location for emergency reports' : 'GPS not supported on this device'}
            </div>
            <button
              onClick={() => setShowLocBanner(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C2410C', padding: 2, flexShrink: 0, display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {showLocBanner && locStatus === 'granted' && (
          <div style={{
            margin: '20px 16px 0',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 12,
            animation: 'slideDown 0.22s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}>
            <MapPin size={14} color="#16A34A" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#15803D' }}>
              Location ready
            </div>
            <button onClick={() => setShowLocBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', padding: 2, flexShrink: 0, display: 'flex' }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── SOS Card ─────────────────────────────────── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="sos-card" onClick={() => navigate('/mobile/report')}>
            <div style={{
              width: 60, height: 60, margin: '0 auto 14px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ letterSpacing: '1.5px', fontSize: 20 }}>SEND EMERGENCY ALERT</h2>
            <p style={{ fontSize: 12.5, opacity: 0.82, marginTop: 6, letterSpacing: '0.1px' }}>
              Tap to instantly report an emergency to MDRRMO
            </p>
            <div className="tap-hint">
              <span className="tap-arrow"><ChevronDown size={12} /></span>
              TAP TO REPORT
              <span className="tap-arrow"><ChevronDown size={12} /></span>
            </div>
          </div>
        </div>

        {/* ── Emergency Hotlines ─────────────────────────── */}
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Emergency Hotlines</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {hotlines.map(h => (
              <a key={h.number} href={`tel:${h.number}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '16px 10px', borderRadius: 14, background: 'white',
                border: '1px solid #E2E8F0', textDecoration: 'none',
                transition: 'all 0.15s', cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: h.color, borderRadius: '14px 14px 0 0' }} />
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: `${h.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                }}>
                  <Phone size={18} color={h.color} />
                </div>
                <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 700, marginBottom: 3, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h.name}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>{h.number}</div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Safety Tips ─────────────────────────────────── */}
        <div style={{ padding: '24px 20px 28px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Safety Tips</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {safetyTips.map(t => (
              <div key={t.title} style={{
                display: 'flex', gap: 14, padding: '14px 16px',
                background: 'white', borderRadius: 14, alignItems: 'flex-start',
                border: '1px solid #E2E8F0',
                borderLeft: `3px solid ${t.color}`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: t.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <t.icon size={18} color={t.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>{t.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />

      {/* ── FCM Foreground Banner (Instagram-style heads-up) ── */}
      <FcmBannerOverlay />
    </div>
  );
}
