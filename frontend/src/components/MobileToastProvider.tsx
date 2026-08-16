import { MobileToastProvider as Provider, useMobileToast } from '../contexts/MobileToastContext';
import MobileToastCard from './MobileToastCard';

/**
 * Inner renderer — uses context to read toasts and render the stack.
 * Must be a child of Provider so it can call useMobileToast().
 */
function MobileToastStack() {
  const { toasts, dismiss } = useMobileToast();

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes srq-pulse {
          0%   { box-shadow: 0 0 0 0 currentColor; }
          70%  { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          /* Respect notch / dynamic island */
          top: 'max(env(safe-area-inset-top, 0px), 0px)',
          left: 12,
          right: 12,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          /* The container itself doesn't block touches */
          pointerEvents: 'none',
          paddingTop: 12,
        }}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast, index) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <MobileToastCard
              toast={toast}
              onDismiss={dismiss}
              index={index}
            />
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * MobileToastProvider wraps the app with context AND renders the stack overlay.
 * Usage: wrap your mobile route tree with <MobileToastProvider>.
 */
export function MobileToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <MobileToastStack />
    </Provider>
  );
}

// Re-export hook for convenience
export { useMobileToast } from '../contexts/MobileToastContext';
export type { MobileToastInput, MobileToastPriority, MobileToastType } from '../contexts/MobileToastContext';
