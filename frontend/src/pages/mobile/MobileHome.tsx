import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, AlertTriangle, Shield, Droplets, Flame, Heart, Bell, X, CheckCircle2, ChevronDown, MapPin, MapPinOff } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import { getMyIncidents } from '../../api/client';
import { setupPushNotifications } from '../../utils/pushNotificationHelper';

const hotlines = [
  { name: 'National Emergency', number: '911', color: '#DC2626' },
  { name: 'Red Cross', number: '143', color: '#EF4444' },
  { name: 'MDRRMO Balayan', number: '09171234567', color: '#2563EB' },
  { name: 'BFP Fire', number: '160', color: '#F59E0B' },
];

const safetyTips = [
  { icon: Shield, color: '#2563EB', bg: '#EFF6FF', title: 'Manatiling Kalmado', tip: 'Deep breaths lang. Pag nagpanic, mas mahirap mag-isip nang maayos.' },
  { icon: Droplets, color: '#0EA5E9', bg: '#F0F9FF', title: 'Baha Safety', tip: 'Pumunta agad sa mataas na lugar. Huwag lumakad o magmaneho sa baha.' },
  { icon: Flame, color: '#EF4444', bg: '#FEF2F2', title: 'Fire Safety', tip: 'Lumayo sa usok. Takpan ang ilong ng basang tela at lumabas agad.' },
  { icon: Heart, color: '#EC4899', bg: '#FDF2F8', title: 'First Aid', tip: 'Ipitin ang sugat ng malinis na tela para mapigilan ang pagdurugo. Huwag galawin ang nasugatan hanggang wala pang dumarating na tulong.' },
];

interface NotifItem {
  id: string;
  type: string;
  status: string;
  time: string;
}

const STATUS_KEY = 'srq_last_statuses';

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'Naghihintay ng review';
    case 'REVIEWING': return 'Nire-review ng MDRRMO';
    case 'DISPATCHED': return 'Na-dispatch na ang responder!';
    case 'RESOLVED': return 'Resolved na ang iyong report';
    case 'REJECTED': return 'Hindi na-approve ang report';
    default: return status;
  }
}

export default function MobileHome() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const userId = localStorage.getItem('userId');

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Location permission state
  type LocStatus = 'idle' | 'granted' | 'denied' | 'unavailable';
  const [locStatus, setLocStatus] = useState<LocStatus>('idle');
  const [showLocBanner, setShowLocBanner] = useState(true);

  const checkForUpdates = async () => {
    if (!userId) return;
    try {
      const res = await getMyIncidents(userId);
      const incidents = res.data || [];
      const stored: Record<string, string> = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
      const newNotifs: NotifItem[] = [];

      incidents.forEach((inc: any) => {
        const prev = stored[inc.id];
        if (prev && prev !== inc.status) {
          newNotifs.push({
            id: inc.id,
            type: inc.aiDetectedType || 'Emergency',
            status: inc.status,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
        stored[inc.id] = inc.status;
      });

      localStorage.setItem(STATUS_KEY, JSON.stringify(stored));
      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev].slice(0, 20));
        setUnseenCount(prev => prev + newNotifs.length);
      }
    } catch { /* silent */ }
  };

  // Request location permission on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus('unavailable');
      return;
    }
    // Check if already granted via Permissions API (non-blocking)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          setLocStatus('granted');
        } else if (result.state === 'denied') {
          setLocStatus('denied');
        } else {
          // 'prompt' — trigger the dialog now
          navigator.geolocation.getCurrentPosition(
            () => setLocStatus('granted'),
            () => setLocStatus('denied'),
            { timeout: 10000, enableHighAccuracy: true }
          );
        }
        // Watch for permission changes
        result.onchange = () => {
          if (result.state === 'granted') setLocStatus('granted');
          else if (result.state === 'denied') setLocStatus('denied');
        };
      });
    } else {
      // Fallback: just request directly
      navigator.geolocation.getCurrentPosition(
        () => setLocStatus('granted'),
        () => setLocStatus('denied'),
        { timeout: 10000, enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!userId) return;
      try {
        const res = await getMyIncidents(userId);
        const existing: Record<string, string> = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
        (res.data || []).forEach((inc: any) => { if (!existing[inc.id]) existing[inc.id] = inc.status; });
        localStorage.setItem(STATUS_KEY, JSON.stringify(existing));
      } catch { /* silent */ }
    };
    init();
    pollRef.current = setInterval(checkForUpdates, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId]);

  // Request push notifications setup on mount
  useEffect(() => {
    if (userId) {
      setupPushNotifications();
    }
  }, [userId]);

  // Auto-dismiss the green banner after 4s
  useEffect(() => {
    if (locStatus === 'granted') {
      const t = setTimeout(() => setShowLocBanner(false), 4000);
      return () => clearTimeout(t);
    }
  }, [locStatus]);

  const handleBellClick = () => {
    setShowNotifPanel(v => !v);
    setUnseenCount(0);
  };

  return (
    <div className="mobile-shell">
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* ── Header ─────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <img src="/logo.jpg" alt="SRQ" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>Kamusta,</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </div>
          </div>

          {/* Bell */}
          <button
            onClick={handleBellClick}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white', position: 'relative',
            }}
            aria-label="Mga Notification"
          >
            <Bell size={17} />
            {unseenCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 17, height: 17, borderRadius: 9,
                background: '#EF4444', fontSize: 10, fontWeight: 800,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #1E3A5F', padding: '0 3px',
              }}>
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 12, color: 'white',
          }}>
            {initials}
          </div>
        </div>

        {/* ── Location Status Banner ───────────────────────── */}
        {showLocBanner && locStatus === 'denied' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            background: '#FFF7ED',
            borderBottom: '1px solid #FED7AA',
            animation: 'slideDown 0.25s ease',
          }}>
            <MapPinOff size={18} color="#EA580C" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9A3412' }}>Location hindi available</div>
              <div style={{ fontSize: 11, color: '#C2410C' }}>I-enable ang location sa settings para makapag-send ng alert.</div>
            </div>
            <button
              onClick={() => setShowLocBanner(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A3412', padding: 0, flexShrink: 0 }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {showLocBanner && locStatus === 'unavailable' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            background: '#FFF7ED',
            borderBottom: '1px solid #FED7AA',
          }}>
            <MapPinOff size={18} color="#EA580C" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9A3412' }}>GPS not supported</div>
              <div style={{ fontSize: 11, color: '#C2410C' }}>Ang device mo ay hindi sumusuporta ng location.</div>
            </div>
            <button onClick={() => setShowLocBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A3412', padding: 0 }}>
              <X size={15} />
            </button>
          </div>
        )}

        {showLocBanner && locStatus === 'granted' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px',
            background: '#F0FDF4',
            borderBottom: '1px solid #BBF7D0',
            animation: 'slideDown 0.25s ease',
          }}>
            <MapPin size={16} color="#16A34A" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#15803D' }}>
              ✓ Location ready — pwede ka nang mag-send ng emergency reports
            </div>
            <button onClick={() => setShowLocBanner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Notification Panel ─────────────────────────── */}
        {showNotifPanel && (
          <div style={{
            position: 'sticky', top: 58, zIndex: 19,
            background: 'white', borderBottom: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxHeight: 270, overflowY: 'auto',
            animation: 'slideDown 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>🔔 Notifications</span>
              <div style={{ display: 'flex', gap: 10 }}>
                {notifications.length > 0 && (
                  <button onClick={() => { setNotifications([]); setShowNotifPanel(false); }}
                    style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Clear all
                  </button>
                )}
                <button onClick={() => setShowNotifPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                <Bell size={26} style={{ marginBottom: 6, opacity: 0.35 }} />
                <div>Wala pang bagong update</div>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={`${n.id}-${i}`} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid #F3F4F6',
                }}>
                  <CheckCircle2 size={17} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      {n.type} — {getStatusLabel(n.status)}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SOS Card ─────────────────────────────────── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="sos-card" onClick={() => navigate('/mobile/report')}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 14px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={30} />
            </div>
            <h2>🚨 SEND EMERGENCY ALERT</h2>
            <p style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              I-tap para makapag-report kaagad ng emergency sa MDRRMO
            </p>
            <div className="tap-hint">
              <span className="tap-arrow"><ChevronDown size={13} /></span>
              TAP NOW
              <span className="tap-arrow"><ChevronDown size={13} /></span>
            </div>
          </div>
        </div>

        {/* ── Emergency Hotlines ─────────────────────────── */}
        <div style={{ padding: '24px 20px 0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>Emergency Hotlines</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {hotlines.map(h => (
              <a key={h.number} href={`tel:${h.number}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '18px 12px', borderRadius: 16, background: 'white',
                border: '1.5px solid #E2E8F0', textDecoration: 'none',
                transition: 'all 0.15s', cursor: 'pointer',
              }}>
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

        {/* ── Safety Tips ─────────────────────────────────── */}
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
