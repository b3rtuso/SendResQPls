import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Camera, Loader, WifiOff, Clock } from 'lucide-react';
import { reportIncident } from '../../api/client';
import { isWithinBalayan } from '../../data/balayan-data';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import {
  enqueueReport,
  dequeueReport,
  getPendingIds,
  getReport,
  getPendingCount,
  pruneStaleReports,
} from '../../utils/offlineQueue';
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
  const [flushing, setFlushing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = useCallback((type: ToastType, message: string, detail?: string) => {
    setToast({ show: true, message, detail, type });
  }, []);

  // Prune stale reports on mount and refresh pending count
  useEffect(() => {
    pruneStaleReports().then(() => setPendingCount(getPendingCount()));
  }, []);

  // -- Flush offline queue when connection is restored ---------------------------
  useEffect(() => {
    if (!isOnline) return;

    const ids = getPendingIds();
    if (ids.length === 0) return;

    const flush = async () => {
      setFlushing(true);
      showToast('info', `Sending ${ids.length} queued report${ids.length > 1 ? 's' : ''}…`, 'Connection restored — submitting offline reports now.');

      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          const report = await getReport(id);
          if (!report) { await dequeueReport(id); continue; }

          // Reconstruct File from stored Blob
          const file = new File([report.photoBlob], report.photoName, { type: report.photoBlob.type });

          const formData = new FormData();
          formData.append('photo', file);
          formData.append('latitude', report.latitude);
          formData.append('longitude', report.longitude);
          // userId comes from JWT in the Authorization header (set by api interceptor)

          await reportIncident(formData);
          await dequeueReport(id);
          successCount++;
        } catch {
          failCount++;
        }
      }

      setPendingCount(getPendingCount());
      setFlushing(false);

      if (successCount > 0 && failCount === 0) {
        showToast('success', `${successCount} report${successCount > 1 ? 's' : ''} sent!`, 'All queued emergency reports have been submitted to MDRRMO.');
      } else if (successCount > 0 && failCount > 0) {
        showToast('warning', `${successCount} sent, ${failCount} failed`, 'Some reports could not be sent. They will retry next time you are online.');
      } else {
        showToast('error', 'Failed to send queued reports', 'Reports are still saved. They will retry when you reconnect.');
      }
    };

    flush();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if (!photo) {
      showToast('warning', 'No photo', 'Please capture or upload an image of the emergency.');
      return;
    }

    setSending(true);

    try {
      // Always get GPS location first (needed for both online & offline paths)
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

      // -- OFFLINE PATH: Save to IndexedDB queue ------------------------------
      if (!isOnline) {
        const userId = localStorage.getItem('userId') || 'anonymous';
        await enqueueReport({
          userId,
          latitude: lat,
          longitude: lng,
          photoBlob: photo,          // Stored in IndexedDB — handles large images
          photoName: photo.name,
        });

        const newCount = getPendingCount();
        setPendingCount(newCount);
        setPhoto(null);
        setPreview(null);

        showToast(
          'warning',
          'Report Saved — Will Send When Online',
          `Your report has been saved on your device (${newCount} queued). It will be automatically sent to MDRRMO when your internet connection is restored.`
        );
        setSending(false);
        return;
      }

      // -- ONLINE PATH: Submit directly --------------------------------------
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      // userId comes from JWT token via api interceptor — not passed in body

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
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#EF4444',
            fontSize: 13,
            fontWeight: 600,
          }}>
            <WifiOff size={20} color="#EF4444" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#EF4444' }}>No Internet Connection</div>
              <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, color: 'var(--text-secondary, #94A3B8)' }}>
                Your report will be saved on your device and sent automatically when you reconnect.
              </div>
            </div>
          </div>
        )}

        {/* Queued reports badge */}
        {pendingCount > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
          }}>
            <Clock size={18} color="#F59E0B" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 700, color: '#F59E0B' }}>
                {flushing ? `Sending ${pendingCount} queued report${pendingCount > 1 ? 's' : ''}…` : `${pendingCount} report${pendingCount > 1 ? 's' : ''} queued`}
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-secondary, #94A3B8)', marginTop: 2 }}>
                {flushing ? 'Submitting to MDRRMO now…' : 'Will send automatically when online'}
              </div>
            </div>
            {flushing && <Loader size={16} color="#F59E0B" className="spin" style={{ marginLeft: 'auto' }} />}
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
          disabled={!photo || sending || flushing}
          style={flushing ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        >
          {sending ? (
            <>
              <Loader size={20} className="spin" />
              {isOnline ? 'SENDING TO MDRRMO...' : 'SAVING REPORT...'}
            </>
          ) : !isOnline ? (
            <>
              <WifiOff size={20} />
              SAVE REPORT FOR LATER
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
            ? '* Report will be saved and sent automatically when internet is restored'
            : '* Location and photo are required to send the alert'}
        </p>
      </div>
      <BottomNav />
      <FcmBannerOverlay />
    </div>
  );
}

