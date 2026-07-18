import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AlertTriangle, Shield, Droplets, Flame, Heart, ChevronDown, MapPinOff, X } from 'lucide-react';
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
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .srq-hotline-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04);
          border: 1px solid rgba(226,232,240,0.8);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease;
          animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .srq-hotline-card:active {
          transform: scale(0.96);
          box-shadow: 0 1px 4px rgba(15,23,42,0.08);
        }
        .srq-tip-card {
          display: flex;
          gap: 14px;
          padding: 16px;
          background: white;
          border-radius: 18px;
          align-items: flex-start;
          box-shadow: 0 2px 10px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.03);
          border: 1px solid rgba(226,232,240,0.7);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
          animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        .srq-tip-card:active {
          transform: scale(0.98);
        }
        .srq-section-label {
          font-size: 10.5px;
          font-weight: 800;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0 0 14px;
        }
      `}</style>
      <FcmBannerOverlay />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* ── Location Alert Banner (Facebook-style full-width) ── */}
        {showLocBanner && (locStatus === 'denied' || locStatus === 'unavailable') && (
          <div style={{
            background: '#FEF2F2',
            borderBottom: '1px solid #FCA5A5',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'slideDown 0.22s ease',
          }}>
            <MapPinOff size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
              {locStatus === 'denied' ? 'Enable location for emergency reports' : 'GPS not supported on this device'}
            </div>
            <button
              onClick={() => setShowLocBanner(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', padding: 2, flexShrink: 0, display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Header ─────────────────────────────────── */}
        <div className="mobile-home-header" style={{ marginBottom: 24 }}>
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
          <p className="srq-section-label">Emergency Hotlines</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {hotlines.map((h, i) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="srq-hotline-card"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {/* Colored full-width header strip */}
                <div style={{
                  background: `linear-gradient(135deg, ${h.color}ee 0%, ${h.color}bb 100%)`,
                  padding: '14px 14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  {/* Icon in glass pill */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 11,
                    background: 'rgba(255,255,255,0.22)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Phone size={16} color="white" strokeWidth={2.5} />
                  </div>
                  {/* Number display */}
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {h.number}
                  </div>
                </div>
                {/* Name below */}
                <div style={{ padding: '10px 14px 12px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>
                    {h.name}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Safety Tips ─────────────────────────────────── */}
        <div style={{ padding: '24px 20px 28px' }}>
          <p className="srq-section-label">Quick Safety Tips</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {safetyTips.map((t, i) => (
              <div
                key={t.title}
                className="srq-tip-card"
                style={{ animationDelay: `${i * 0.07 + 0.15}s` }}
              >
                {/* Icon block — double-bezel: outer tinted shell + inner icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: t.bg,
                  border: `1.5px solid ${t.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, position: 'relative',
                }}>
                  {/* Inner accent dot */}
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 5, height: 5, borderRadius: '50%',
                    background: t.color, opacity: 0.45,
                  }} />
                  <t.icon size={20} color={t.color} strokeWidth={2} />
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 800, color: '#0F172A',
                    marginBottom: 4, letterSpacing: '-0.1px',
                  }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.6 }}>
                    {t.tip}
                  </div>
                </div>
                {/* Right accent bar */}
                <div style={{
                  width: 3, height: '100%', borderRadius: 4,
                  background: `linear-gradient(to bottom, ${t.color}, ${t.color}44)`,
                  alignSelf: 'stretch', flexShrink: 0,
                  marginLeft: 4,
                }} />
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
