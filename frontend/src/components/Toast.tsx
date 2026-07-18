import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, AlertTriangle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  detail?: string;
  duration?: number;
  onClose: () => void;
}

const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };

const palette = {
  success: { rail: "#22C55E", icon: "#22C55E", glow: "rgba(34,197,94,0.18)"  },
  error:   { rail: "#EF4444", icon: "#EF4444", glow: "rgba(239,68,68,0.18)"   },
  warning: { rail: "#F59E0B", icon: "#F59E0B", glow: "rgba(245,158,11,0.18)"  },
  info:    { rail: "#3B82F6", icon: "#3B82F6", glow: "rgba(59,130,246,0.18)"  },
};

export default function Toast({ message, type, detail, duration = 5000, onClose }: ToastProps) {
  const [phase,    setPhase]    = useState<"enter" | "visible" | "exit">("enter");
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const Icon  = icons[type];
  const color = palette[type];

  // Animate progress bar
  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now);
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [duration]);

  // Lifecycle: enter -> visible -> exit
  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase("visible"), 16);
    timerRef.current = setTimeout(() => {
      setPhase("exit");
      setTimeout(onClose, 380);
    }, duration);
    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, onClose]);

  const dismiss = () => {
    setPhase("exit");
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    setTimeout(onClose, 380);
  };

  const isVisible = phase === "visible";

  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", zIndex: 10000,
      transform: `translateX(-50%) translateY(${isVisible ? "0" : "-28px"}) scale(${isVisible ? 1 : 0.94})`,
      opacity: phase === "exit" ? 0 : isVisible ? 1 : 0,
      transition: "transform 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.38s cubic-bezier(0.16,1,0.3,1)",
      width: "90%", maxWidth: 420,
      background: "rgba(15,23,42,0.96)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 18, overflow: "hidden",
      boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px ${color.glow}`,
      fontFamily: "var(--font)",
    }}>
      {/* Colored left rail */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(to bottom, ${color.rail}, ${color.rail}88)`,
      }} />

      {/* Content row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px 16px 22px" }}>
        {/* Icon halo */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 1,
          background: `${color.rail}1A`, border: `1px solid ${color.rail}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={color.icon} strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.95)", marginBottom: detail ? 4 : 0, letterSpacing: "-0.1px" }}>
            {message}
          </div>
          {detail && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.52)", lineHeight: 1.5 }}>
              {detail}
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button onClick={dismiss} aria-label="Dismiss" style={{
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, width: 28, height: 28, cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.5)", flexShrink: 0, transition: "background 0.15s",
        }}>
          <X size={14} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: `linear-gradient(to right, ${color.rail}aa, ${color.rail})`,
          transition: "width 0.1s linear", borderRadius: "0 2px 2px 0",
        }} />
      </div>
    </div>
  );
}
