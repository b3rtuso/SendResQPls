import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Camera, Loader } from 'lucide-react';
import { reportIncident } from '../../api/client';
import BottomNav from '../../components/BottomNav';
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
    if (!photo) {
      showToast('warning', 'No photo selected', 'Please capture or upload an image of the emergency.');
      return;
    }

    setSending(true);

    try {
      // Get the user ID from localStorage (set during login)
      const userId = localStorage.getItem('userId') || 'anonymous';

      // Build FormData
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('userId', userId);

      // Try to get GPS coordinates
      let lat = '14.5995'; // Default: Balayan, Batangas
      let lng = '120.9842';

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = String(position.coords.latitude);
        lng = String(position.coords.longitude);
      } catch {
        // GPS unavailable — use default coordinates
        console.log('📍 GPS unavailable, using default location');
      }

      formData.append('latitude', lat);
      formData.append('longitude', lng);

      // Send to backend → AI classifies → saves to database
      const response = await reportIncident(formData);
      const { incident } = response.data;

      // ✅ SUCCESS NOTIFICATION — report went through!
      showToast(
        'success',
        'Emergency Report Submitted!',
        `AI classified as: ${incident?.aiDetectedType || 'Processing...'} — Routed to ${incident?.aiRecommendedDept || 'MDRRMO'}`
      );

      // Clear the form
      setPhoto(null);
      setPreview(null);

      // Navigate to history after a short delay so user sees the notification
      setTimeout(() => {
        navigate('/mobile/history');
      }, 3000);

    } catch (error: any) {
      // ❌ FAILURE NOTIFICATION — report did NOT go through
      const detail = error?.response?.data?.details || error?.message || 'Check your connection and try again.';
      showToast('error', 'Failed to send report', detail);
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
        <div className="mobile-page-header">
          <button className="back-btn" onClick={() => navigate('/mobile')}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1>Quick SOS Alert</h1>
            <p>MDRRMO will assess & dispatch</p>
          </div>
        </div>

        <div className="report-hero">
          <div className="alert-icon"><AlertTriangle size={28} /></div>
          <h2>Need Help Fast?</h2>
          <p>Just capture an image of the situation and share your location. The AI will classify the emergency and dispatch the right teams immediately.</p>
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
              style={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'cover',
                borderRadius: 12,
              }}
            />
          ) : (
            <>
              <div className="cam-icon"><Camera size={26} /></div>
              <p>Tap to capture or upload a photo</p>
            </>
          )}
          {photo && !preview && <p className="file-name">📷 {photo.name}</p>}
        </div>

        <button className="sos-btn" onClick={handleSend} disabled={!photo || sending}>
          {sending ? (
            <>
              <Loader size={20} className="spin" />
              SENDING TO MDRRMO...
            </>
          ) : (
            <>
              <AlertTriangle size={20} />
              SEND EMERGENCY ALERT
            </>
          )}
        </button>
        <p className="report-note">* Location and image are required to send alert</p>
      </div>
      <BottomNav />
    </div>
  );
}
