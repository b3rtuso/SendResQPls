import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Camera, Loader, WifiOff } from 'lucide-react';
import { reportIncident } from '../../api/client';
import { isWithinBalayan } from '../../data/balayan-data';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import BottomNav from '../../components/BottomNav';
import FcmBannerOverlay from '../../components/FcmBannerOverlay';
import Toast, { type ToastType } from '../../components/Toast';

interface ToastState {
  show: boolean;
  message: string;
  detail?: string;
  type: ToastType;
}

export default function MobileReport() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const isOnline = useNetworkStatus();

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = useCallback((type: ToastType, message: string, detail?: string) => {
    setToast({ show: true, message, detail, type });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if (!isOnline) {
      showToast('error', 'No Internet Connection', 'Emergency alerts require an active internet connection. Please check your network and try again.');
      return;
    }

    if (!photo) {
      showToast('warning', 'No photo', 'Please capture or upload an image of the emergency.');
      return;
    }

    setSending(true);

    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('userId', userId);

      let lat: string;
      let lng: string;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
          });
        });
        lat = String(position.coords.latitude);
        lng = String(position.coords.longitude);
      } catch {
        showToast('error', 'Location Required', 'Please enable GPS/location to submit a report. Reports are only accepted within Balayan, Batangas.');
        setSending(false);
        return;
      }

      if (!isWithinBalayan(parseFloat(lat), parseFloat(lng))) {
        showToast('error', 'Outside Balayan', 'Emergency reports are only accepted within the municipality of Balayan, Batangas.');
        setSending(false);
        return;
      }

      formData.append('latitude', lat);
      formData.append('longitude', lng);

      // Optimistic state submission feedback
      showToast('info', 'Submitting Emergency Alert...', 'Sending photo and location to MDRRMO emergency dispatch.');

      const response = await reportIncident(formData);
      const { incident } = response.data;

      showToast(
        'success',
        'Emergency Report Sent!',
        `AI-classified as: ${incident?.aiDetectedType || 'Processing...'} — Routed to ${incident?.aiRecommendedDept || 'MDRRMO'}`
      );

      setPhoto(null);
      setPreview(null);

      setTimeout(() => navigate('/mobile/history'), 2500);

    } catch (error: any) {
      const detail = error?.response?.data?.details || error?.message || 'Please check your connection and try again.';
      showToast('error', 'Report failed to send', detail);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mobile-shell">
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          detail={toast.detail}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="mobile-page">
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
          margin: '0 -24px 20px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'white',
          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)',
        }}>
          <button 
            onClick={() => navigate('/mobile')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              padding: 0,
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '0.3px' }}>Quick SOS Alert</h1>
            <p style={{ fontSize: 11, opacity: 0.85, margin: '2px 0 0' }}>MDRRMO will respond immediately</p>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#92400E',
            fontSize: 13,
            fontWeight: 600,
          }}>
            <WifiOff size={20} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>No Internet Connection</div>
              <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>
                Emergency alerts require an active internet connection. The SOS button is disabled until connection is restored.
              </div>
            </div>
          </div>
        )}

        <div className="report-hero">
          <div className="alert-icon"><AlertTriangle size={28} /></div>
          <h2>Need Help?</h2>
          <p>Take a picture of the situation and share your location. Our AI will classify the emergency and dispatch the appropriate response team immediately.</p>
        </div>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />

        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
          {preview ? (
            <img
              src={preview}
              alt="Captured"
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }}
            />
          ) : (
            <>
              <div className="cam-icon"><Camera size={26} /></div>
              <p>Tap to take or upload a photo</p>
            </>
          )}
          {photo && !preview && <p className="file-name">{photo.name}</p>}
        </div>

        <button
          className="sos-btn"
          onClick={handleSend}
          disabled={!photo || sending || !isOnline}
          style={!isOnline ? { opacity: 0.5, cursor: 'not-allowed', background: '#9CA3AF' } : undefined}
        >
          {sending ? (
            <>
              <Loader size={20} className="spin" />
              SENDING TO MDRRMO...
            </>
          ) : !isOnline ? (
            <>
              <WifiOff size={20} />
              NO INTERNET — ALERT DISABLED
            </>
          ) : (
            <>
              <AlertTriangle size={20} />
              SEND EMERGENCY ALERT
            </>
          )}
        </button>
        <p className="report-note">
          {!isOnline
            ? '* Internet connection, location, and photo are required to send the alert'
            : '* Location and photo are required to send the alert'}
        </p>
      </div>
      <BottomNav />
      <FcmBannerOverlay />
    </div>
  );
}
