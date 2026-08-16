import { createContext, useContext, useState, useCallback, useRef } from 'react';

export type MobileToastPriority = 'normal' | 'important' | 'critical';
export type MobileToastType = 'success' | 'error' | 'warning' | 'info' | 'incident' | 'system';

export interface MobileToastItem {
  id: string;
  title: string;
  message?: string;
  type: MobileToastType;
  priority: MobileToastPriority;
  /** Auto-dismiss duration in ms. 0 = never. Defaults by priority if not set. */
  duration?: number;
  /** Route to navigate to when notification is tapped */
  navigateTo?: string;
  incidentId?: string;
  /** Incident status string for color mapping */
  status?: string;
  /** Shown on the notification (e.g. "just now") */
  timestamp?: string;
}

export type MobileToastInput = Omit<MobileToastItem, 'id' | 'timestamp'>;

interface MobileToastContextValue {
  toasts: MobileToastItem[];
  push: (item: MobileToastInput) => string;
  dismiss: (id: string) => void;
}

const MobileToastContext = createContext<MobileToastContextValue | null>(null);

const MAX_STACK = 3;

const DEFAULT_DURATION: Record<MobileToastPriority, number> = {
  normal:    4500,
  important: 5500,
  critical:  0,   // stays until dismissed
};

export function MobileToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<MobileToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((item: MobileToastInput): string => {
    const id = `mt-${Date.now()}-${counterRef.current++}`;
    const timestamp = 'just now';
    const duration = item.duration ?? DEFAULT_DURATION[item.priority];

    const newToast: MobileToastItem = { ...item, id, timestamp, duration };

    setToasts(prev => {
      // Newest at top; cap at MAX_STACK (remove oldest = last in array)
      const next = [newToast, ...prev].slice(0, MAX_STACK);
      return next;
    });

    return id;
  }, []);

  return (
    <MobileToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
    </MobileToastContext.Provider>
  );
}

export function useMobileToast(): MobileToastContextValue {
  const ctx = useContext(MobileToastContext);
  if (!ctx) throw new Error('useMobileToast must be used inside <MobileToastProvider>');
  return ctx;
}

export default MobileToastContext;
