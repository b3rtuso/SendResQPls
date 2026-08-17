import { useState, useRef } from 'react';
import { ArrowRight, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_KEY = 'srq_onboarding_done';

const slides = [
  {
    image: '/onboarding_01.jpg',
    alt: '01 REPORT — Photograph the emergency',
  },
  {
    image: '/onboarding_02.jpg',
    alt: '02 DISPATCH — MDRRMO routes your report',
  },
  {
    image: '/onboarding_03.jpg',
    alt: '03 RESPOND — Trained responders arrive on-site',
  },
];

export default function MobileOnboarding({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // Touch/swipe support
  const touchStartX = useRef<number | null>(null);

  const goTo = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    setCurrent(index);
  };

  const goNext = () => goTo(current + 1);
  const goPrev = () => goTo(current - 1);

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

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#0D1B2A',
        userSelect: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .onb-slide-enter {
          animation: slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .onb-dot {
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          padding: 0;
        }
      `}</style>

      {/* Fullscreen Slide Image */}
      <div
        key={current}
        className="onb-slide-enter"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${slides[current].image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-label={slides[current].alt}
      />

      {/* Dark overlay gradient at bottom for UI legibility */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(13, 27, 42, 0.92) 0%, rgba(13, 27, 42, 0.0) 45%)',
        pointerEvents: 'none',
      }} />

      {/* Top Bar: Skip button */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '52px 24px 16px',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        {!isLast && (
          <button
            onClick={skip}
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.85)',
              padding: '8px 20px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.02em',
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Tap zones: left half goes back, right half goes forward (non-last) */}
      {!isLast && (
        <>
          <div
            onClick={goPrev}
            style={{
              position: 'absolute',
              top: '10%', bottom: '22%',
              left: 0, width: '40%',
              cursor: current > 0 ? 'w-resize' : 'default',
              zIndex: 10,
            }}
          />
          <div
            onClick={goNext}
            style={{
              position: 'absolute',
              top: '10%', bottom: '22%',
              right: 0, width: '60%',
              cursor: 'e-resize',
              zIndex: 10,
            }}
          />
        </>
      )}

      {/* Bottom UI: Dots + CTA */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '0 28px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        zIndex: 20,
      }}>
        {/* Dot Indicators */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              className="onb-dot"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 999,
                background: i === current ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)',
              }}
            />
          ))}
        </div>

        {/* CTA Buttons */}
        {isLast ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleGetStarted}
              style={{
                width: '100%',
                padding: '17px',
                borderRadius: 16,
                background: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 800,
                color: '#0D1B2A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
              }}
            >
              Get Started <ArrowRight size={18} />
            </button>
            <button
              onClick={handleCreateAccount}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'inherit',
              }}
            >
              <LogIn size={18} /> Create an Account
            </button>
          </div>
        ) : (
          <button
            onClick={goNext}
            style={{
              width: '100%',
              padding: '17px',
              borderRadius: 16,
              background: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 800,
              color: '#0D1B2A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
            }}
          >
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
