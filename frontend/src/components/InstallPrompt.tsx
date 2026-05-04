import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // Don't show if dismissed this session
    if (sessionStorage.getItem('pwa-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    sessionStorage.setItem('pwa-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 388,
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        zIndex: 9999,
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #DC2626, #EF4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Download size={22} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 2 }}>
          Install SendResqPls
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.3 }}>
          Add to home screen for quick emergency reporting
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: '#DC2626', color: 'white', border: 'none',
          borderRadius: 10, padding: '8px 16px', fontWeight: 700,
          fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
          whiteSpace: 'nowrap',
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'none', border: 'none', color: '#64748B',
          cursor: 'pointer', padding: 4, flexShrink: 0,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
