import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Camera, Loader } from 'lucide-react';
import { reportIncident } from '../../api/client';
import { isWithinBalayan } from '../../data/balayan-data';
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
      showToast('warning', 'Walang photo', 'Kumuha o mag-upload ng larawan ng emergency.');
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
        showToast('error', 'Kailangan ng Location', 'I-enable ang GPS/location para makapag-submit ng report. Ang mga report ay para lang sa loob ng Balayan, Batangas.');
        setSending(false);
        return;
      }

      if (!isWithinBalayan(parseFloat(lat), parseFloat(lng))) {
        showToast('error', 'Outside ng Balayan', 'Ang reports ay para lang sa loob ng Balayan, Batangas. Siguraduhing nasa area ka.');
        setSending(false);
        return;
      }

      formData.append('latitude', lat);
      formData.append('longitude', lng);

      const response = await reportIncident(formData);
      const { incident } = response.data;

      showToast(
        'success',
        'Na-send na ang Emergency Report! 🚑',
        `AI-classified bilang: ${incident?.aiDetectedType || 'Processing...'} — Na-route sa ${incident?.aiRecommendedDept || 'MDRRMO'}`
      );

      setPhoto(null);
      setPreview(null);

      setTimeout(() => navigate('/mobile/history'), 3000);

    } catch (error: any) {
      const detail = error?.response?.data?.details || error?.message || 'I-check ang connection at try mo ulit.';
      showToast('error', 'Hindi na-send ang report', detail);
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
            <p>MDRRMO will respond agad</p>
          </div>
        </div>

        <div className="report-hero">
          <div className="alert-icon"><AlertTriangle size={28} /></div>
          <h2>Need Help? 🙋</h2>
          <p>Kumuha ng pic ng sitwasyon at i-share ang location. Ang AI ang mag-cla-classify ng emergency at magpadala ng tamang team agad.</p>
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
              alt="Kinuha"
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }}
            />
          ) : (
            <>
              <div className="cam-icon"><Camera size={26} /></div>
              <p>I-tap para kumuha o mag-upload ng photo</p>
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
              🚨 SEND EMERGENCY ALERT
            </>
          )}
        </button>
        <p className="report-note">* Kailangan ang location at photo para mapadala ang alert</p>
      </div>
      <BottomNav />
    </div>
  );
}
