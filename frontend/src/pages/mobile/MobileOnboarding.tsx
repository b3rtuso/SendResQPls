import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle, ShieldCheck, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ONBOARDING_KEY = 'srq_onboarding_done';

interface SlideData {
  category: string;
  badgeIcon: any;
  accentColor: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  type: 'camera' | 'map' | 'status';
}

const slides: SlideData[] = [
  {
    category: 'Report',
    badgeIcon: Camera,
    accentColor: '#2563EB',
    badgeBg: '#EFF6FF',
    title: 'Snap & Report Emergency',
    subtitle: 'Photograph the scene. AI instantly detects disaster type and tags your exact GPS coordinates.',
    type: 'camera',
  },
  {
    category: 'Dispatch',
    badgeIcon: AlertTriangle,
    accentColor: '#DC2626',
    badgeBg: '#FEF2F2',
    title: 'MDRRMO Balayan Triage',
    subtitle: 'Command Center reviews priorities in real time and routes alerts to the nearest response team.',
    type: 'map',
  },
  {
    category: 'Live Track',
    badgeIcon: ShieldCheck,
    accentColor: '#16A34A',
    badgeBg: '#F0FDF4',
    title: 'Real-Time Responder ETA',
    subtitle: 'Track responder location on live GPS and receive instant status updates until help arrives.',
    type: 'status',
  },
];

export default function MobileOnboarding({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const navigate = useNavigate();

  const touchStartX = useRef<number | null>(null);

  const goTo = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    setSlideDirection(index > current ? 'next' : 'prev');
    setCurrent(index);
  };

  const goNext = () => {
    if (current < slides.length - 1) {
      setSlideDirection('next');
      setCurrent(c => c + 1);
    } else {
      handleGetStarted();
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setSlideDirection('prev');
      setCurrent(c => c - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current]);

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    onDone();
  };

  const handleGetStarted = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    navigate('/mobile/login');
  };

  const handleCreateAccount = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    navigate('/mobile/signup');
  };

  const isLast = current === slides.length - 1;
  const slide = slides[current];
  const BadgeIcon = slide.badgeIcon;

  return (
    <div
      className="mobile-shell"
      style={{
        background: '#F1F5F9',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        fontFamily: "var(--font, 'Inter', system-ui, sans-serif)",
        position: 'relative',
        boxSizing: 'border-box',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes onbFadeSlideNext {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes onbFadeSlidePrev {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .onb-content-animate {
          animation: ${slideDirection === 'next' ? 'onbFadeSlideNext' : 'onbFadeSlidePrev'} 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .onb-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.25s ease;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .onb-action-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #FFFFFF;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transition: transform 0.18s, box-shadow 0.18s;
          letter-spacing: 0.01em;
        }
        .onb-action-btn:active {
          transform: scale(0.98);
        }
        .onb-secondary-btn {
          width: 100%;
          padding: 15px;
          background: #FFFFFF;
          color: #0F172A;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.18s, border-color 0.18s, transform 0.18s;
        }
        .onb-secondary-btn:active {
          background: #F8FAFC;
          transform: scale(0.98);
        }
      `}</style>

      {/* ── Top Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 8px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/logo.jpg"
            alt="SRQ Logo"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            SendResQPls
          </span>
        </div>

        {!isLast ? (
          <button
            onClick={skip}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            Skip
          </button>
        ) : (
          <div style={{ width: 48 }} />
        )}
      </div>

      {/* ── Main Slide Card Body ── */}
      <div
        key={current}
        className="onb-content-animate"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 20px',
        }}
      >
        {/* Category Header */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: slide.accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: `0 2px 10px ${slide.accentColor}33`,
              }}
            >
              <BadgeIcon size={16} strokeWidth={2.2} />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.02em',
              }}
            >
              {slide.category}
            </span>
          </div>

          {/* Bold 2-Line Headline */}
          <h1
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              margin: '0 0 8px',
            }}
          >
            {slide.title}
          </h1>

          {/* Underline Indicator Accent */}
          <div
            style={{
              width: 36,
              height: 3.5,
              borderRadius: 4,
              background: slide.accentColor,
              marginBottom: 10,
            }}
          />

          <p
            style={{
              fontSize: 13,
              color: '#64748B',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {slide.subtitle}
          </p>
        </div>

        {/* Center UI Preview Card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0',
          }}
        >
          {slide.type === 'camera' && (
            <div
              style={{
                width: '100%',
                maxWidth: 290,
                background: '#0F172A',
                borderRadius: 22,
                padding: '16px',
                color: '#FFFFFF',
                boxShadow: '0 12px 36px rgba(15,23,42,0.18), 0 2px 8px rgba(0,0,0,0.06)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Camera Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                  ⚡ SENDRESQPLS CAMERA
                </span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              </div>

              {/* Viewfinder Screen with Real Flood Photo */}
              <div
                style={{
                  height: 165,
                  borderRadius: 14,
                  backgroundImage: 'url(/flood_sample.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 8px',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                }}
              >
                {/* Gradient scrim for high contrast */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(0,0,0,0.0) 40%, rgba(15,23,42,0.8) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Viewfinder crosshairs */}
                <div style={{ position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderTop: '2.5px solid #2563EB', borderLeft: '2.5px solid #2563EB', zIndex: 2 }} />
                <div style={{ position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderTop: '2.5px solid #2563EB', borderRight: '2.5px solid #2563EB', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: 8, left: 8, width: 12, height: 12, borderBottom: '2.5px solid #2563EB', borderLeft: '2.5px solid #2563EB', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderBottom: '2.5px solid #2563EB', borderRight: '2.5px solid #2563EB', zIndex: 2 }} />

                {/* Center Reticle / Focus target */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -60%)',
                    width: 42,
                    height: 42,
                    border: '1.5px solid rgba(255,255,255,0.7)',
                    borderRadius: 6,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />

                {/* Spacer */}
                <div style={{ zIndex: 2 }} />

                {/* AI Detection Pill */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.96)',
                    color: '#0F172A',
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    zIndex: 2,
                  }}
                >
                  <span style={{ fontSize: 13 }}>🌊</span> Flood Hazard Detected
                </div>

                {/* GPS Location & Resolution */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0 6px',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 700,
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    zIndex: 2,
                  }}
                >
                  <span>📍 Balayan, Batangas</span>
                  <span>13.937° N, 120.734° E</span>
                </div>
              </div>
            </div>
          )}

          {slide.type === 'map' && (
            <div
              style={{
                width: '100%',
                maxWidth: 290,
                background: '#FFFFFF',
                borderRadius: 22,
                padding: '16px',
                boxShadow: '0 12px 36px rgba(30,58,95,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                border: '1.5px solid #E2E8F0',
                position: 'relative',
              }}
            >
              {/* Map mockup header */}
              <div
                style={{
                  background: '#0F1F38',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color="#93C5FD" />
                  <span style={{ fontSize: 11.5, fontWeight: 700 }}>MDRRMO Command Center</span>
                </div>
                <span style={{ fontSize: 10, background: '#DC2626', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>LIVE</span>
              </div>

              {/* Map graphic container */}
              <div
                style={{
                  height: 120,
                  borderRadius: 14,
                  background: '#E2E8F0',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Simulated map roads & route */}
                <svg width="100%" height="100%" viewBox="0 0 260 120" style={{ position: 'absolute', inset: 0 }}>
                  <path d="M 20 100 Q 80 40 140 70 T 240 30" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="20" cy="100" r="6" fill="#DC2626" />
                  <circle cx="140" cy="70" r="5" fill="#2563EB" />
                  <circle cx="240" cy="30" r="7" fill="#16A34A" />
                </svg>

                <div
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#0F172A',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                >
                  📍 Balayan Emergency Grid
                </div>
              </div>
            </div>
          )}

          {slide.type === 'status' && (
            <div
              style={{
                width: '100%',
                maxWidth: 290,
                background: '#FFFFFF',
                borderRadius: 22,
                padding: '18px 16px',
                boxShadow: '0 12px 36px rgba(30,58,95,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Active responder tracker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    border: '1px solid #BBF7D0',
                    flexShrink: 0,
                  }}
                >
                  <Navigation size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Ambulance En Route
                  </div>
                  <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700 }}>
                    Estimated Arrival: 3 mins
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '75%', height: '100%', background: '#16A34A', borderRadius: 999 }} />
              </div>

              {/* Hotline pill */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>📞 MDRRMO Hotline</span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#2563EB' }}>0917-123-4567</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Dot Indicators (Selected dot is circular dot and blue #2563EB) ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              className="onb-dot"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                background: i === current ? '#2563EB' : '#CBD5E1',
                transform: i === current ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* ── Action Buttons (No Arrow Icons) ── */}
        {isLast ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <Button
              type="button"
              className="onb-action-btn"
              onClick={handleGetStarted}
              style={{ minHeight: 48 }}
            >
              Get Started
            </Button>
            <Button
              type="button"
              variant="outline"
              className="onb-secondary-btn"
              onClick={handleCreateAccount}
              style={{ minHeight: 48 }}
            >
              Create an Account
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            className="onb-action-btn"
            onClick={goNext}
            style={{ minHeight: 48 }}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper to check if onboarding should show
export function shouldShowOnboarding() {
  return !localStorage.getItem(ONBOARDING_KEY);
}
