import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap } from 'lucide-react';
import type { MobileToastItem } from '../contexts/MobileToastContext';

interface MobileToastCardProps {
  toast: MobileToastItem;
  onDismiss: (id: string) => void;
  index: number; // 0 = top/newest
}

// ── Color config ──────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  success:  '#22C55E',
  error:    '#EF4444',
  warning:  '#F59E0B',
  info:     '#2563EB',
  incident: '#2563EB',
  system:   '#64748B',
};

const STATUS_COLOR: Record<string, string> = {
  DISPATCHED:   '#2563EB',
  RESOLVED:     '#22C55E',
  REVIEWING:    '#F59E0B',
  REJECTED:     '#EF4444',
  PENDING:      '#64748B',
  NEW_INCIDENT: '#EF4444',
};

// ── Component ─────────────────────────────────────────────
export default function MobileToastCard({ toast, onDismiss, index }: MobileToastCardProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const [progress, setProgress] = useState(100);

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Timer refs
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef     = useRef<number | null>(null);
  const startRef   = useRef<number | null>(null);
  const pausedAt   = useRef<number | null>(null);  // remaining ms when paused
  const isPaused   = useRef(false);

  const accent = toast.status
    ? (STATUS_COLOR[toast.status] ?? TYPE_COLOR[toast.type] ?? '#2563EB')
    : (TYPE_COLOR[toast.type] ?? '#2563EB');

  const isCritical = toast.priority === 'critical';
  const duration   = toast.duration ?? 0;

  // ── Lifecycle ──────────────────────────────────────────
  const triggerExit = () => {
    if (phase === 'exit') return;
    setPhase('exit');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  // Progress bar RAF
  const startProgress = (remaining: number) => {
    if (duration === 0) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now);
      const pct = Math.max(0, (remaining - elapsed) / duration * 100);
      setProgress(pct);
      if (pct > 0 && !isPaused.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const startTimer = (remaining: number) => {
    if (duration === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(triggerExit, remaining);
  };

  const pauseTimer = () => {
    if (duration === 0 || isPaused.current) return;
    isPaused.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // How much time has already elapsed?
    const elapsed = startRef.current ? performance.now() - startRef.current : 0;
    pausedAt.current = Math.max(0, duration - elapsed);
  };

  const resumeTimer = () => {
    if (!isPaused.current) return;
    isPaused.current = false;
    const remaining = pausedAt.current ?? duration;
    startRef.current = performance.now();
    startProgress(remaining);
    startTimer(remaining);
  };

  useEffect(() => {
    // Enter animation
    const enterT = setTimeout(() => setPhase('visible'), 20);
    // Start auto-dismiss
    if (duration > 0) {
      startProgress(duration);
      startTimer(duration);
    }
    return () => {
      clearTimeout(enterT);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swipe handlers ─────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    pauseTimer();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only track horizontal swipes
    if (Math.abs(dx) > Math.abs(dy)) {
      setSwipeX(dx);
    }
  };

  const onTouchEnd = () => {
    const threshold = 60;
    if (Math.abs(swipeX) >= threshold) {
      // Fly off screen
      setSwipeX(swipeX > 0 ? 400 : -400);
      setPhase('exit');
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setTimeout(() => onDismiss(toast.id), 280);
    } else {
      // Snap back
      setSwipeX(0);
      resumeTimer();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // ── Tap handler ────────────────────────────────────────
  const handleTap = () => {
    if (Math.abs(swipeX) > 5) return; // ignore if was swiping
    if (toast.navigateTo) {
      onDismiss(toast.id);
      navigate(toast.navigateTo);
    } else if (toast.incidentId) {
      onDismiss(toast.id);
      navigate(`/mobile/history?incidentId=${toast.incidentId}`);
    }
  };

  // ── Visual state ───────────────────────────────────────
  const isVisible = phase === 'visible';
  const translateY = isVisible ? 0 : phase === 'exit' ? -20 : -110;
  const opacity    = phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1;
  const scale      = phase === 'visible' ? 1 : 0.96;

  // Priority: left border width
  const leftBorder = isCritical ? 4 : toast.priority === 'important' ? 3 : 0;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleTap}
      style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: 18,
        border: `1px solid ${isCritical ? `${accent}40` : '#E2E8F0'}`,
        borderLeft: leftBorder > 0 ? `${leftBorder}px solid ${accent}` : undefined,
        boxShadow: isCritical
          ? `0 8px 28px rgba(0,0,0,0.13), 0 2px 8px ${accent}22, 0 0 0 1px ${accent}15`
          : '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        cursor: (toast.navigateTo || toast.incidentId) ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        // Animations
        transform: `translateY(${translateY}%) scale(${scale}) translateX(${swipeX}px)`,
        opacity,
        transition: swipeX !== 0
          ? 'opacity 0.3s ease, box-shadow 0.2s'
          : `transform 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.32s ease, box-shadow 0.2s`,
        // Stack offset: cards below are slightly scaled down and shifted
        zIndex: 100 - index,
      }}
    >
      {/* Critical pulsing dot */}
      {isCritical && (
        <div style={{
          position: 'absolute', top: 12, right: 44,
          width: 8, height: 8, borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 0 0 ${accent}`,
          animation: 'srq-pulse 1.4s cubic-bezier(0.66,0,0,1) infinite',
        }} />
      )}

      {/* Main content row — Facebook Style without icons */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        gap: 12, padding: '14px 16px 14px',
        paddingLeft: leftBorder > 0 ? (16 + leftBorder) : 16,
      }}>
        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#1877F2',
              letterSpacing: '0.2px',
            }}>
              SendResQPls
            </span>
            {toast.status && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: accent, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: accent }}>
                  {toast.status.charAt(0) + toast.status.slice(1).toLowerCase().replace('_', ' ')}
                </span>
              </>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#94A3B8', flexShrink: 0 }}>
              {toast.timestamp}
            </span>
          </div>

          <div style={{
            fontSize: 14, fontWeight: 700, color: '#0F172A',
            lineHeight: 1.35, letterSpacing: '-0.1px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {toast.title}
          </div>

          {toast.message && (
            <div style={{
              fontSize: 12.5, color: '#475569', marginTop: 3,
              lineHeight: 1.45, overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {toast.message}
            </div>
          )}
        </div>

        {/* Dismiss X */}
        <button
          onClick={e => { e.stopPropagation(); triggerExit(); }}
          aria-label="Dismiss notification"
          style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
            background: '#F1F5F9', border: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748B', padding: 0,
            transition: 'background 0.15s',
          }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div style={{ height: 2, background: '#F1F5F9' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(to right, ${accent}88, ${accent})`,
            transition: 'width 0.1s linear',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>
      )}

      {/* Swipe hint overlay (appears when swipe starts) */}
      {Math.abs(swipeX) > 15 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: swipeX > 0 ? 'flex-start' : 'flex-end',
          padding: '0 20px',
          background: `${accent}12`,
          borderRadius: 18,
          pointerEvents: 'none',
        }}>
          <Zap size={20} color={accent} style={{ opacity: Math.min(1, Math.abs(swipeX) / 60) }} />
        </div>
      )}
    </div>
  );
}
