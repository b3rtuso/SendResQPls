import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Bell, ArrowRight, ChevronRight } from 'lucide-react';

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

  const goNext = () => {
    if (animating) return;
    if (current < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => { setCurrent(c => c + 1); setAnimating(false); }, 250);
    } else {
      localStorage.setItem(ONBOARDING_KEY, '1');
      onDone();
    }
  };

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    onDone();
  };

  const slide = slides[current];
  const Icon = slide.icon;
  const isLast = current === slides.length - 1;

  return (
    <div style={{
      width: '100vw', height: '100vh', background: slide.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '48px 28px 40px',
      boxSizing: 'border-box', transition: 'background 0.5s ease',
      fontFamily: "'Inter', sans-serif", maxWidth: 420, margin: '0 auto',
    }}>
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
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        {/* Logo */}
        <img src="/icon-192.png" alt="SRQ Logo" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />

        {/* Icon Card */}
        <div style={{
          width: 90, height: 90, borderRadius: 28, background: slide.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          animation: animating ? 'none' : 'float 3s ease-in-out infinite',
        }}>
          <Icon size={44} color={slide.iconColor} />
        </div>

        {/* Badge */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', padding: '6px 18px',
          borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'white',
          letterSpacing: 0.5,
        }}>{slide.badge}</div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.2 }}>
          {slide.title}
        </h1>

        {/* Description */}
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6, margin: 0, maxWidth: 320 }}>
          {slide.desc}
        </p>
      </div>

      {/* Bottom: Dots + Button */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        {/* Dot Indicators */}
        <div style={{ display: 'flex', gap: 8 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? 28 : 8, height: 8, borderRadius: 4,
              background: i === current ? 'white' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease', cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* CTA Button */}
        <button onClick={goNext} style={{
          width: '100%', padding: '16px', borderRadius: 16,
          background: 'white', border: 'none', cursor: 'pointer',
          fontSize: 16, fontWeight: 800, color: '#0F172A',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontFamily: "'Inter', sans-serif",
          transition: 'opacity 0.15s',
        }}>
          {isLast ? 'Get Started' : 'Next'}
          {isLast ? <ArrowRight size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// Helper to check if onboarding should show
export function shouldShowOnboarding() {
  return !localStorage.getItem(ONBOARDING_KEY);
}
