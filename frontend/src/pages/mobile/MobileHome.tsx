import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AlertTriangle, Wind, Waves, Siren, Stethoscope, ChevronDown, WifiOff, Navigation, Lock } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
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
  { icon: Wind,        color: '#2563EB', bg: '#EFF6FF', title: 'Stay Calm',    tip: 'Take deep breaths. Panicking makes it harder to think clearly.' },
  { icon: Waves,       color: '#0EA5E9', bg: '#F0F9FF', title: 'Flood Safety', tip: 'Move to high ground immediately. Do not walk or drive through floodwaters.' },
  { icon: Siren,       color: '#EF4444', bg: '#FEF2F2', title: 'Fire Safety',  tip: 'Stay away from smoke. Cover your nose with a damp cloth and evacuate immediately.' },
  { icon: Stethoscope, color: '#8B5CF6', bg: '#F5F3FF', title: 'First Aid',   tip: 'Apply pressure to wounds with a clean cloth to stop bleeding. Do not move injured persons unless necessary.' },
];

import { useLocationChecker } from '../../utils/useLocationChecker';

const STATUS_KEY = 'srq_last_statuses';

export default function MobileHome() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const userId = localStorage.getItem('userId');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time location state via useLocationChecker (framework: Phone GPS ON? -> Allowed? -> Continue)
  const { isLocationOn, status: locStatus, recheckLocation, requestLocation, requesting: locRequesting, openAppSettings } = useLocationChecker();
  const [showLocModal, setShowLocModal] = useState(false);

  // Online/offline state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Online / offline detection
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);


  // Request location permission first, then notifications sequentially (magkasunod)
  useEffect(() => {
    let isMounted = true;

    async function initPermissionsSequentially() {
      // Step 1: Request GPS Location first
      await recheckLocation();

      // Step 2: Polite breathing delay so dialogs appear sequentially
      await new Promise(r => setTimeout(r, 600));
      if (!isMounted) return;

      // Step 3: Request Push Notifications second
      if (userId) {
        try {
          await setupPushNotifications();
        } catch (err) {
          console.warn('[Push] Sequential setup error:', err);
        }
      }
    }

    initPermissionsSequentially();

    return () => {
      isMounted = false;
    };
  }, [userId, recheckLocation]);


  return (
    <div className="mobile-shell" style={{ background: '#F1F5F9' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
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
      <div style={{ flex: 1, paddingBottom: 80 }}>

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
          <div
            className="sos-card"
            onClick={isOnline ? () => navigate('/mobile/report') : undefined}
            role="button"
            tabIndex={0}
            aria-label="Send emergency alert to MDRRMO"
            style={!isOnline ? {
              opacity: 0.55,
              pointerEvents: 'none',
              filter: 'grayscale(0.5)',
              cursor: 'not-allowed',
            } : {}}
          >
            {/* Concentric radar pulse container */}
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer radar wave 1 */}
              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                animation: 'radarPing 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                pointerEvents: 'none',
              }} />
              {/* Outer radar wave 2 (staggered) */}
              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                animation: 'radarPing 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite 1.1s',
                pointerEvents: 'none',
              }} />
              {/* Inner Glowing SOS Icon Circle */}
              <div style={{
                width: 62, height: 62, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                position: 'relative', zIndex: 1,
              }}>
                <AlertTriangle size={30} strokeWidth={2.4} color="white" />
              </div>
            </div>

            <h2 style={{ letterSpacing: '1.5px', fontSize: 20, margin: 0, fontWeight: 900 }}>SEND EMERGENCY ALERT</h2>
            <p style={{ fontSize: 12.5, opacity: 0.88, marginTop: 6, marginBottom: 0, letterSpacing: '0.1px', lineHeight: 1.45 }}>
              Tap to instantly report an incident to MDRRMO Balayan
            </p>
            <div className="tap-hint" style={{ marginTop: 12 }}>
              <span className="tap-arrow"><ChevronDown size={12} /></span>
              <span>TAP TO REPORT NOW</span>
              <span className="tap-arrow"><ChevronDown size={12} /></span>
            </div>
          </div>

          {/* Offline badge */}
          {!isOnline && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              marginTop: 12,
              padding: '8px 16px',
              background: '#F1F5F9',
              border: '1.5px solid #CBD5E1',
              borderRadius: 40,
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              letterSpacing: '0.01em',
              animation: 'fadeUp 0.3s ease both',
            }}>
              <WifiOff size={14} color="#94A3B8" />
              You're offline — emergency alerts unavailable
            </div>
          )}
        </div>

        {/* ── Location Status Strip (taste-skill redesign: flat navy, left-edge accent) ── */}
        {isLocationOn !== true && (
          <div style={{ padding: '12px 20px 0' }}>
            <div
              onClick={() => setShowLocModal(true)}
              role="button"
              tabIndex={0}
              style={{
                background: '#0F2942',
                borderLeft: `4px solid ${locStatus === 'PERMISSION_DENIED' ? '#3B82F6' : '#F59E0B'}`,
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              }}
            >
              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: locStatus === 'PERMISSION_DENIED' ? '#3B82F6' : '#F59E0B',
                boxShadow: `0 0 0 3px ${locStatus === 'PERMISSION_DENIED' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }} />

              {/* Text block */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.1px', marginBottom: 2 }}>
                  {locStatus === 'PERMISSION_DENIED' ? 'Location permission blocked' : 'Location (GPS) is off'}
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4 }}>
                  {locStatus === 'PERMISSION_DENIED'
                    ? 'Tap to open App Settings and allow access.'
                    : 'Turn on GPS so responders can find you.'}
                </div>
              </div>

              {/* Primary action button */}
              {locStatus === 'PERMISSION_DENIED' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); openAppSettings(); }}
                  style={{
                    flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 8,
                    background: '#3B82F6', border: 'none',
                    color: 'white', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
                  }}
                >
                  <Lock size={12} /> Settings
                </button>
              ) : (
                <button
                  disabled={locRequesting}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await requestLocation();
                    if (ok) setShowLocModal(false);
                  }}
                  style={{
                    flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 8,
                    background: locRequesting ? '#78350F' : '#F59E0B', border: 'none',
                    color: 'white', fontSize: 12, fontWeight: 700,
                    cursor: locRequesting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
                    opacity: locRequesting ? 0.85 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  {locRequesting ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Detecting…
                    </>
                  ) : (
                    <><Navigation size={12} /> Enable</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}



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
                {/* Colored header — stacked so 11-digit numbers always fit */}
                <div style={{
                  background: `linear-gradient(135deg, ${h.color}ee 0%, ${h.color}aa 100%)`,
                  padding: '12px 12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {/* Icon pill — top row */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: 'rgba(255,255,255,0.22)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Phone size={14} color="white" strokeWidth={2.5} />
                  </div>
                  {/* Number — full width, scales to fit 11 digits */}
                  <div style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: 'white',
                    letterSpacing: '-0.3px',
                    lineHeight: 1,
                    wordBreak: 'break-all',
                  }}>
                    {h.number}
                  </div>
                </div>
                {/* Name row */}
                <div style={{
                  padding: '8px 12px 10px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.1px',
                  lineHeight: 1.25,
                }}>
                  {h.name}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Safety Tips ─────────────────────────────────── */}
        <div style={{ padding: '24px 20px 20px' }}>
          <p className="srq-section-label">Emergency Safety Tips</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {safetyTips.map((t, i) => (
              <div
                key={t.title}
                className="srq-tip-card"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Icon box with tint */}
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: t.bg, border: `1.5px solid ${t.color}25`,
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
                  width: 3,
                  borderRadius: 4,
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


      {/* ── Location Framework Modal (Screen-Centered Dialog) ── */}
      {showLocModal && (
        <div
          onClick={() => setShowLocModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 24,
              padding: 'clamp(20px, 4vw, 28px) clamp(16px, 4vw, 24px)',
              width: 'min(420px, calc(100vw - 32px))',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.32)',
              animation: 'modalScaleIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 18,
                background: locStatus === 'PERMISSION_DENIED' ? 'linear-gradient(135deg, #DBEAFE, #EFF6FF)' : 'linear-gradient(135deg, #FEE2E2, #FEF2F2)',
                border: `1.5px solid ${locStatus === 'PERMISSION_DENIED' ? '#BFDBFE' : '#FECACA'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                {locStatus === 'PERMISSION_DENIED' ? (
                  <Lock size={26} color="#2563EB" strokeWidth={2} />
                ) : (
                  <Navigation size={26} color="#DC2626" strokeWidth={2} />
                )}
              </div>

              <div style={{
                fontSize: 19, fontWeight: 900, color: '#0F172A',
                textAlign: 'center', marginBottom: 6, letterSpacing: '-0.3px',
              }}>
                {locStatus === 'PERMISSION_DENIED'
                  ? 'Allow SendResQPls Location'
                  : 'Turn On Phone Location'}
              </div>

              <div style={{
                fontSize: 13, color: '#64748B', lineHeight: 1.5,
                textAlign: 'center', marginBottom: 18,
              }}>
                {locStatus === 'PERMISSION_DENIED'
                  ? 'SendResQPls needs location permission to dispatch emergency responders directly to your coordinates in Balayan.'
                  : 'Your phone GPS is currently switched off. Turn on location services so SendResQPls can find you.'}
              </div>
            </div>

            {/* Step-by-step instructions card */}
            <div style={{
              background: '#F8FAFC', borderRadius: 16, padding: '16px',
              border: '1px solid #E2E8F0', marginBottom: 20,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {locStatus === 'PERMISSION_DENIED' ? (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Tap <strong>Open App Settings</strong> below (or tap the 🔒 lock icon in browser).
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Tap <strong>Permissions</strong> → <strong>Location</strong> → choose <strong>Allow</strong>.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Return here and tap <strong>Check Location Now</strong>.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DC2626', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Tap <strong>Enable Location</strong> below — your phone will show a location prompt.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DC2626', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      If asked, tap <strong>Allow</strong> or turn on <strong>📍 Location / GPS</strong> in the popup.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DC2626', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      The app will automatically detect your location once enabled.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {locStatus === 'PERMISSION_DENIED' ? (
                /* Permission was blocked — only way is to go to OS settings */
                <button
                  onClick={() => openAppSettings()}
                  style={{
                    width: '100%', padding: '15px 20px',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: 'white', border: 'none', borderRadius: 16,
                    fontSize: 15, fontWeight: 800, cursor: 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Lock size={16} /> Open App Settings
                </button>
              ) : (
                /* GPS off or not yet asked — fire the native browser dialog directly */
                <button
                  disabled={locRequesting}
                  onClick={async () => {
                    const ok = await requestLocation();
                    if (ok) setShowLocModal(false);
                  }}
                  style={{
                    width: '100%', padding: '15px 20px',
                    background: locRequesting ? '#9A3412' : 'linear-gradient(135deg, #F97316, #EA580C)',
                    color: 'white', border: 'none', borderRadius: 16,
                    fontSize: 15, fontWeight: 800,
                    cursor: locRequesting ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: locRequesting ? 0.85 : 1,
                  }}
                >
                  {locRequesting ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Detecting Location…
                    </>
                  ) : (
                    <><Navigation size={16} /> Enable Location</>
                  )}
                </button>
              )}

              <button
                onClick={async () => {
                  const ok = await recheckLocation();
                  if (ok) {
                    setShowLocModal(false);
                  }
                }}
                style={{
                  width: '100%', padding: '13px 20px',
                  background: '#F1F5F9', color: '#1E293B',
                  border: '1.5px solid #CBD5E1', borderRadius: 16,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Navigation size={15} /> Check Location Now
              </button>

              <button
                onClick={() => setShowLocModal(false)}
                style={{
                  width: '100%', padding: '11px 20px',
                  background: 'none', color: '#64748B',
                  border: 'none', borderRadius: 16,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
