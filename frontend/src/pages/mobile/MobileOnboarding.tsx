import { useState } from 'react';
import { AlertTriangle, Clock, Bell, ArrowRight, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_KEY = 'srq_onboarding_done';

const slides = [
  {
    icon: AlertTriangle,
    iconColor: '#DC2626',
    iconBg: '#FEF2F2',
    badge: 'Emergency Reporting',
    title: 'Report Incidents Instantly',
    desc: 'Snap a photo, share your location, and send an emergency alert to MDRRMO Balayan in seconds. No calls needed — we handle the rest.',
    bg: 'linear-gradient(160deg, #1E3A5F 0%, #2563EB 100%)',
  },
  {
    icon: Clock,
    iconColor: '#F59E0B',
    iconBg: '#FFFBEB',
    badge: 'AI-Powered Triage',
    title: 'Smart Dispatching System',
    desc: 'Our AI automatically identifies the type of incident and recommends the right department — fire, medical, police, or rescue — for the fastest response.',
    bg: 'linear-gradient(160deg, #0F172A 0%, #1E3A5F 100%)',
  },
  {
    icon: Bell,
    iconColor: '#22C55E',
    iconBg: '#F0FDF4',
    badge: 'Real-time Updates',
    title: 'Stay Informed, Stay Safe',
    desc: 'Get notified by email the moment your report status changes. Track all your past reports in the History tab anytime.',
    bg: 'linear-gradient(160deg, #14532D 0%, #166534 100%)',
  },
];

export default function MobileOnboarding({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();

  const goNext = () => {
    if (animating) return;
    if (current < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => { setCurrent(c => c + 1); setAnimating(false); }, 250);
    }
  };

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    onDone();
  };

  const handleGetStarted = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    navigate('/mobile/signup');
  };

  const handleSignIn = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    navigate('/mobile/login');
  };

  const slide = slides[current];
  const Icon = slide.icon;
  const isLast = current === slides.length - 1;

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: slide.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '48px 28px 40px',
      boxSizing: 'border-box', transition: 'background 0.5s ease',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes onboardingFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .onboarding-transition {
          animation: onboardingFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Top: Skip */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        {!isLast && (
          <button onClick={skip} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Skip</button>
        )}
      </div>

      {/* Middle: Content */}
      <div key={current} className="onboarding-transition" style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        {/* Icon Card */}
        <div style={{
          width: 84, height: 84, borderRadius: 24, background: slide.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        }}>
          <Icon size={42} color={slide.iconColor} />
        </div>

        {/* Badge */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', padding: '6px 18px',
          borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: 0.5,
        }}>{slide.badge}</div>

        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.2 }}>
          {slide.title}
        </h1>

        {/* Description */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, margin: 0, maxWidth: 300 }}>
          {slide.desc}
        </p>
      </div>

      {/* Bottom: Dots + Buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {/* Dot Indicators */}
        <div style={{ display: 'flex', gap: 8 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === current ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease', cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* Last slide: two buttons */}
        {isLast ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={handleGetStarted} style={{
              width: '100%', padding: '16px', borderRadius: 16,
              background: 'white', border: 'none', cursor: 'pointer',
              fontSize: 16, fontWeight: 800, color: '#0F172A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)', fontFamily: "'Inter', sans-serif",
            }}>
              Get Started <ArrowRight size={18} />
            </button>
            <button onClick={handleSignIn} style={{
              width: '100%', padding: '15px', borderRadius: 16,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.35)',
              cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: "'Inter', sans-serif",
            }}>
              <LogIn size={18} /> Already have an account? Sign In
            </button>
          </div>
        ) : (
          /* Non-last slides: single Next button */
          <button onClick={goNext} style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: 'white', border: 'none', cursor: 'pointer',
            fontSize: 16, fontWeight: 800, color: '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontFamily: "'Inter', sans-serif",
          }}>
            Next <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// Helper to check if onboarding should show
export function shouldShowOnboarding() {
  return !localStorage.getItem(ONBOARDING_KEY);
}
