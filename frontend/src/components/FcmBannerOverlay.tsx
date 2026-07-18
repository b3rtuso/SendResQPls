import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { FCM_FOREGROUND_EVENT } from "../utils/pushNotificationHelper";
import type { FcmNotificationPayload } from "../utils/pushNotificationHelper";

/**
 * FcmBannerOverlay -- Premium iOS-style heads-up notification.
 * Dark glass card with status-coloured left rail and auto-dismiss bar.
 */

const STATUS_RAIL: Record<string, string> = {
  DISPATCHED: "#2563EB",
  RESOLVED:   "#22C55E",
  REVIEWING:  "#F59E0B",
  REJECTED:   "#EF4444",
  PENDING:    "#64748B",
  NEW_INCIDENT: "#EF4444",
};

const STATUS_DOT_LABEL: Record<string, string> = {
  DISPATCHED: "Dispatched",
  RESOLVED:   "Resolved",
  REVIEWING:  "Under Review",
  REJECTED:   "Rejected",
  PENDING:    "Pending",
};

export default function FcmBannerOverlay() {
  const navigate  = useNavigate();
  const [banner, setBanner]       = useState<FcmNotificationPayload | null>(null);
  const [progress, setProgress]   = useState(100);
  const [phase, setPhase]         = useState<"in"|"visible"|"out">("in");
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef     = useRef<number | null>(null);
  const startRef   = useRef<number | null>(null);
  const DURATION   = 5000;

  const startDismiss = () => {
    setPhase("out");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTimeout(() => setBanner(null), 380);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<FcmNotificationPayload>).detail;
      setBanner(payload);
      setProgress(100);
      setPhase("in");
      // Animate in after a microtask
      setTimeout(() => setPhase("visible"), 20);

      // Progress bar RAF
      startRef.current = performance.now();
      const tick = (now: number) => {
        const elapsed = now - (startRef.current ?? now);
        const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
        setProgress(pct);
        if (pct > 0) rafRef.current = requestAnimationFrame(tick);
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);

      if (dismissRef.current) clearTimeout(dismissRef.current);
      dismissRef.current = setTimeout(startDismiss, DURATION);
    };

    window.addEventListener(FCM_FOREGROUND_EVENT, handler);
    return () => {
      window.removeEventListener(FCM_FOREGROUND_EVENT, handler);
      if (dismissRef.current) clearTimeout(dismissRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!banner) return null;

  const railColor = STATUS_RAIL[banner.status ?? ""] || STATUS_RAIL[banner.type ?? ""] || "#3B82F6";
  const dotLabel  = STATUS_DOT_LABEL[banner.status ?? ""];

  const handleTap = () => {
    setBanner(null);
    if (banner.type === "NEW_INCIDENT" && banner.incidentId) navigate(`/requests/${banner.incidentId}`);
    else if (banner.incidentId) navigate("/mobile/history");
  };

  const isVisible = phase === "visible";

  return (
    <div
      onClick={handleTap}
      style={{
        position: "fixed", top: 12, left: 12, right: 12, zIndex: 9999,
        transform: `translateY(${isVisible ? "0" : "-110%"}) scale(${isVisible ? 1 : 0.97})`,
        opacity: phase === "out" ? 0 : 1,
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.38s ease",
        background: "rgba(13,20,38,0.97)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: `0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07), 0 2px 8px ${railColor}33`,
        border: "1px solid rgba(255,255,255,0.09)",
        cursor: "pointer",
      }}
    >
      {/* Left status rail */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: `linear-gradient(to bottom, ${railColor}, ${railColor}66)`,
      }} />

      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 12px 20px" }}>
        {/* App icon */}
        <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
          <img src="/logo.jpg" alt="SRQ" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              SendResQPls
            </span>
            {dotLabel && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: railColor, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: railColor, letterSpacing: "0.3px" }}>
                  {dotLabel}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,0.95)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.1px" }}>
            {banner.title}
          </div>
          {banner.body && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.52)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {banner.body}
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={e => { e.stopPropagation(); startDismiss(); }}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, width: 26, height: 26, cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.45)", flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.05)" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: `linear-gradient(to right, ${railColor}88, ${railColor})`,
          transition: "width 0.1s linear",
        }} />
      </div>
    </div>
  );
}
