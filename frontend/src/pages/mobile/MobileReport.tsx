import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, AlertTriangle, Camera, Loader, WifiOff, Clock,
  RotateCcw, MapPin, ArrowRight, ShieldCheck,
  MessageSquare, ChevronDown, Lock, Navigation
} from 'lucide-react';
import { reportIncident } from '../../api/client';
import { Button } from '@/components/ui/button';
import { isWithinBalayan, getNearestBarangay, BARANGAYS } from '../../data/balayan-data';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { compressImage } from '../../utils/imageCompressor';
import {
  enqueueReport,
  dequeueReport,
  getPendingIds,
  getReport,
  getPendingCount,
  pruneStaleReports,
} from '../../utils/offlineQueue';
import { useLocationChecker } from '../../utils/useLocationChecker';
import BottomNav from '../../components/BottomNav';
import { useMobileToast } from '../../components/MobileToastProvider';

// ── Module-level cache to persist photo across mobile tab switches ──────────
let cachedReportPhoto: File | null = null;
let cachedReportPreview: string | null = null;

export default function MobileReport() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const isOnline = useNetworkStatus();

  const { push: showToast } = useMobileToast();

  const [photo, setPhoto] = useState<File | null>(() => cachedReportPhoto);
  const [preview, setPreview] = useState<string | null>(() => cachedReportPreview);
  const [compressing, setCompressing] = useState(false);
  const [sending, setSending] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isSubmittingRef = useRef(false);

  // Pre-flight review, fallback location & success modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ lat: string; lng: string; barangay: string } | null>(null);
  const [resolvingLoc, setResolvingLoc] = useState(false);
  const [showManualBarangayModal, setShowManualBarangayModal] = useState(false);
  const [selectedManualBrgy, setSelectedManualBrgy] = useState(BARANGAYS[0]?.name || 'Poblacion 1');
  const [submittedIncident, setSubmittedIncident] = useState<any | null>(null);

  // Real-time location state via useLocationChecker (framework: Phone GPS ON? -> Allowed? -> Continue)
  const { isLocationOn, status: locStatus, recheckLocation, requestLocation, requesting: locRequesting, openAppSettings } = useLocationChecker();
  const [showLocationGuideModal, setShowLocationGuideModal] = useState(false);

  // Emergency contacts from localStorage
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
      setEmergencyContacts(stored);
    } catch {
      setEmergencyContacts([]);
    }
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
      showToast({ type: 'info', priority: 'normal', title: `Sending ${ids.length} queued report${ids.length > 1 ? 's' : ''}…`, message: 'Connection restored — submitting offline reports now.' });

      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          const report = await getReport(id);
          if (!report) { await dequeueReport(id); continue; }

          const file = new File([report.photoBlob], report.photoName, { type: report.photoBlob.type });

          const formData = new FormData();
          formData.append('photo', file);
          formData.append('latitude', report.latitude);
          formData.append('longitude', report.longitude);

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
        showToast({ type: 'success', priority: 'important', title: `${successCount} report${successCount > 1 ? 's' : ''} sent!`, message: 'All queued emergency reports have been submitted to MDRRMO.' });
      } else if (successCount > 0 && failCount > 0) {
        showToast({ type: 'warning', priority: 'important', title: `${successCount} sent, ${failCount} failed`, message: 'Some reports could not be sent. They will retry next time you are online.' });
      } else {
        showToast({ type: 'error', priority: 'important', title: 'Failed to send queued reports', message: 'Reports are still saved. They will retry when you reconnect.' });
      }
    };

    flush();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const handleEnableGps = async () => {
    const isNowOn = await recheckLocation();
    if (isNowOn) {
      showToast({ type: 'success', priority: 'normal', title: 'GPS Active', message: 'Location auto-tagging is enabled.' });
      setShowLocationGuideModal(false);
    } else {
      setShowLocationGuideModal(true);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset file input so selecting the same file again triggers onChange
    e.target.value = '';

    if (!file) {
      // User cancelled file selection dialog -> KEEP EXISTING PHOTO INTACT!
      return;
    }

    setCompressing(true);
    try {
      // Automatically optimize high-res photo for fastest transmission
      const { file: compressed } = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.82,
      });

      const objectUrl = URL.createObjectURL(compressed);
      cachedReportPhoto = compressed;
      cachedReportPreview = objectUrl;
      setPhoto(compressed);
      setPreview(objectUrl);
    } catch {
      const objectUrl = URL.createObjectURL(file);
      cachedReportPhoto = file;
      cachedReportPreview = objectUrl;
      setPhoto(file);
      setPreview(objectUrl);
    } finally {
      setCompressing(false);
    }
  };

  const handleOpenReview = async () => {
    if (!photo) {
      showToast({ type: 'warning', priority: 'normal', title: 'No photo', message: 'Please capture or upload an image of the emergency.' });
      return;
    }

    setResolvingLoc(true);

    // Primary GPS resolution attempt (High Accuracy)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          enableHighAccuracy: true,
        });
      });
      const lat = String(position.coords.latitude);
      const lng = String(position.coords.longitude);

      if (!isWithinBalayan(parseFloat(lat), parseFloat(lng))) {
        showToast({ type: 'error', priority: 'important', title: 'Outside Balayan', message: 'Emergency reports are only accepted within the municipality of Balayan, Batangas.' });
        setResolvingLoc(false);
        return;
      }

      const barangay = getNearestBarangay(parseFloat(lat), parseFloat(lng));
      setDetectedLocation({ lat, lng, barangay });
      setShowReviewModal(true);
      setResolvingLoc(false);
      return;
    } catch {
      // Secondary GPS resolution attempt (Standard Network GPS Fallback)
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false,
          });
        });
        const lat = String(position.coords.latitude);
        const lng = String(position.coords.longitude);

        if (isWithinBalayan(parseFloat(lat), parseFloat(lng))) {
          const barangay = getNearestBarangay(parseFloat(lat), parseFloat(lng));
          setDetectedLocation({ lat, lng, barangay });
          setShowReviewModal(true);
          setResolvingLoc(false);
          return;
        }
      } catch {
        // Fallback: Indoor / GPS signal blocked -> prompt manual barangay confirmation
        setShowManualBarangayModal(true);
      }
    } finally {
      setResolvingLoc(false);
    }
  };

  const handleConfirmManualBarangay = () => {
    setShowManualBarangayModal(false);
    const targetBrgy = BARANGAYS.find(b => b.name === selectedManualBrgy) || BARANGAYS[0];
    const lat = String(targetBrgy.lat);
    const lng = String(targetBrgy.lng);
    setDetectedLocation({ lat, lng, barangay: `${targetBrgy.name} (Manual)` });
    setShowReviewModal(true);
  };

  const executeSubmit = async () => {
    if (isSubmittingRef.current || sending || !photo || !detectedLocation) return;
    isSubmittingRef.current = true;
    setShowReviewModal(false);
    setSending(true);

    try {
      const { lat, lng } = detectedLocation;

      // OFFLINE PATH
      if (!isOnline) {
        const userId = localStorage.getItem('userId') || 'anonymous';
        await enqueueReport({
          userId,
          latitude: lat,
          longitude: lng,
          photoBlob: photo,
          photoName: photo.name,
        });

        const newCount = getPendingCount();
        setPendingCount(newCount);
        cachedReportPhoto = null;
        cachedReportPreview = null;
        setPhoto(null);
        setPreview(null);
        setDetectedLocation(null);

        setSubmittedIncident({
          id: 'OFFLINE-' + Date.now().toString().slice(-6),
          status: 'SAVED_OFFLINE',
          barangay: detectedLocation.barangay,
          offline: true,
        });
        setSending(false);
        isSubmittingRef.current = false;
        return;
      }

      // ONLINE PATH
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('latitude', lat);
      formData.append('longitude', lng);

      const response = await reportIncident(formData);
      const { incident } = response.data;

      cachedReportPhoto = null;
      cachedReportPreview = null;
      setPhoto(null);
      setPreview(null);
      setDetectedLocation(null);
      setSubmittedIncident({
        ...incident,
        barangay: detectedLocation.barangay,
        offline: false,
      });

      showToast({
        type: 'success',
        priority: 'important',
        title: 'Emergency Report Sent!',
        message: `AI-classified as: ${incident?.aiDetectedType || 'Processing…'} — Routed to ${incident?.aiRecommendedDept || 'MDRRMO'}`,
      });

    } catch (error: any) {
      const detail = error?.response?.data?.details || error?.message || 'Please check your connection and try again.';
      showToast({ type: 'error', priority: 'important', title: 'Report failed to send', message: detail });
    } finally {
      setSending(false);
      isSubmittingRef.current = false;
    }
  };

  const handleShareSMS = () => {
    if (!submittedIncident) return;
    const phoneNumbers = emergencyContacts.map(c => c.phone).filter(Boolean).join(';');
    const message = `EMERGENCY ALERT: I reported an incident at Barangay ${submittedIncident.barangay || 'Balayan'} via SendResQPls. MDRRMO is responding. Incident Ref: #${submittedIncident.id?.slice(0, 8)}.`;
    const smsUrl = `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  return (
    <div className="mobile-shell" style={{ background: '#F1F5F9' }}>
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.8; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .viewfinder-box {
          position: relative;
          width: 100%;
          min-height: 240px;
          border-radius: 20px;
          overflow: hidden;
          background: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 30px rgba(15,23,42,0.18);
          cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.12);
        }
        .vf-corner {
          position: absolute;
          width: 22px;
          height: 22px;
          border-color: #EF4444;
          border-style: solid;
          pointer-events: none;
          z-index: 2;
        }
        .vf-tl { top: 14px; left: 14px; border-width: 3px 0 0 3px; border-top-left-radius: 6px; }
        .vf-tr { top: 14px; right: 14px; border-width: 3px 3px 0 0; border-top-right-radius: 6px; }
        .vf-bl { bottom: 14px; left: 14px; border-width: 0 0 3px 3px; border-bottom-left-radius: 6px; }
        .vf-br { bottom: 14px; right: 14px; border-width: 0 3px 3px 0; border-bottom-right-radius: 6px; }
        .vf-scan {
          position: absolute;
          left: 14px;
          right: 14px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #EF4444, #F87171, transparent);
          box-shadow: 0 0 12px #EF4444;
          animation: scanline 2.5s ease-in-out infinite;
          pointer-events: none;
          z-index: 2;
        }
      `}</style>

      <div className="mobile-page" style={{ paddingBottom: 100 }}>
        {/* Header (flush top, matching Home header gradient) */}
        <div style={{
          background: 'linear-gradient(155deg, #0F1F38 0%, #1E3A5F 40%, #2563EB 100%)',
          margin: 0,
          padding: '24px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'white',
          boxShadow: '0 6px 24px rgba(15, 31, 56, 0.35)',
          borderRadius: '0 0 24px 24px',
        }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: 0,
            }}
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.2px' }}>Emergency Alert</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>MDRRMO Balayan Command Center</p>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#991B1B',
            fontSize: 13,
            fontWeight: 600,
          }}>
            <WifiOff size={20} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, color: '#991B1B' }}>Offline Mode Active</div>
              <div style={{ fontSize: 11.5, fontWeight: 500, marginTop: 2, color: '#7F1D1D' }}>
                Your report will be stored securely on your device and submitted once connection returns.
              </div>
            </div>
          </div>
        )}

        {/* Queued reports badge */}
        {pendingCount > 0 && (
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 14,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
          }}>
            <Clock size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 800, color: '#92400E' }}>
                {flushing ? `Sending ${pendingCount} queued report${pendingCount > 1 ? 's' : ''}…` : `${pendingCount} report${pendingCount > 1 ? 's' : ''} queued`}
              </span>
              <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 1 }}>
                {flushing ? 'Submitting to MDRRMO now…' : 'Will send automatically when online'}
              </div>
            </div>
            {flushing && <Loader size={16} color="#D97706" className="spin" style={{ marginLeft: 'auto' }} />}
          </div>
        )}

        {/* Location Services Off/Denied Reminder Banner (stays if OFF, auto-disappears if ON) */}
        {isLocationOn === false && (
          <div style={{
            background: '#FEF3C7',
            border: '1.5px solid #FDE68A',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F59E0B', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MapPin size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
                Location Services Off
              </div>
              <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 1, lineHeight: 1.4 }}>
                GPS is off. You can manually select your barangay on submit or enable GPS.
              </div>
            </div>
            <button
              onClick={handleEnableGps}
              style={{
                padding: '7px 12px',
                borderRadius: 10,
                background: '#D97706',
                color: 'white',
                border: 'none',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              Enable GPS
            </button>
          </div>
        )}

        {/* Camera Viewfinder Box */}
        <div style={{ marginBottom: 20 }}>
          <div className="viewfinder-box" onClick={() => fileRef.current?.click()}>
            <div className="vf-corner vf-tl" />
            <div className="vf-corner vf-tr" />
            <div className="vf-corner vf-bl" />
            <div className="vf-corner vf-br" />
            {!preview && !compressing && <div className="vf-scan" />}

            {compressing ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', zIndex: 1, color: 'white' }}>
                <Loader size={32} className="spin" style={{ color: '#60A5FA', margin: '0 auto 12px' }} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Optimizing Photo Clarity…</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8' }}>Compressing for instant emergency dispatch</p>
              </div>
            ) : preview ? (
              <img
                src={preview}
                alt="Captured emergency evidence"
                style={{ width: '100%', height: 260, objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', zIndex: 1 }}>
                <div style={{
                  width: 58, height: 58, borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px', border: '1.5px solid rgba(239, 68, 68, 0.3)',
                }}>
                  <Camera size={28} color="#EF4444" />
                </div>
                <h3 style={{ margin: '0 0 6px', color: '#FFFFFF', fontSize: 16, fontWeight: 800 }}>
                  Take or Upload Photo
                </h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: 12.5, maxWidth: 240, lineHeight: 1.4 }}>
                  Capture clear evidence of the scene for instant AI triage
                </p>
              </div>
            )}
          </div>

          {/* Photo actions */}
          {preview && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  background: 'white', border: '1px solid #CBD5E1', borderRadius: 10,
                  padding: '6px 14px', fontSize: 12.5, fontWeight: 700, color: '#475569',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RotateCcw size={13} /> Retake
              </button>
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />

        {/* Info Card */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '16px 18px',
          border: '1px solid #E2E8F0', marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563EB', flexShrink: 0,
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Automatic AI Routing</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginTop: 2 }}>
                Our Gemini AI model analyzes the hazard type in seconds and dispatches the nearest response unit (BFP, PNP, EMS, Rescue).
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleOpenReview}
          disabled={!photo || sending || flushing || resolvingLoc || compressing}
          style={{
            width: '100%',
            padding: '17px',
            borderRadius: 16,
            background: !photo ? '#94A3B8' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: 'white',
            border: 'none',
            fontSize: 16,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: !photo ? 'none' : '0 6px 24px rgba(220,38,38,0.4)',
            transition: 'all 0.2s ease',
            minHeight: 54,
          }}
        >
          {resolvingLoc ? (
            <><Loader size={20} className="spin" /> VERIFYING LOCATION…</>
          ) : sending ? (
            <><Loader size={20} className="spin" /> DISPATCHING REPORT…</>
          ) : flushing ? (
            <><Loader size={20} className="spin" /> SYNCING QUEUED REPORTS…</>
          ) : !isOnline ? (
            <>QUEUE REPORT OFFLINE <ArrowRight size={18} /></>
          ) : (
            <>DISPATCH EMERGENCY ALERT <ArrowRight size={18} /></>
          )}
        </Button>
      </div>

      {/* ── Manual Barangay Selection Modal (Screen-Centered Dialog) ── */}
      {showManualBarangayModal && (
        <div
          onClick={() => setShowManualBarangayModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 24,
              padding: '28px 24px 28px',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleUp 0.28s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: '#FEF3C7', border: '1.5px solid #FDE68A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', color: '#D97706',
              }}>
                <MapPin size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>
                Select Your Barangay
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Location services are off or signal was blocked indoors. Please confirm your Balayan barangay:
              </p>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Barangay in Balayan, Batangas
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedManualBrgy}
                  onChange={e => setSelectedManualBrgy(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 14,
                    border: '1.5px solid #CBD5E1', background: '#F8FAFC',
                    fontSize: 15, fontWeight: 700, color: '#0F172A',
                    fontFamily: 'inherit', outline: 'none', appearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {BARANGAYS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} color="#64748B" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowManualBarangayModal(false)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: '#F1F5F9', border: '1.5px solid #E2E8F0',
                  color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmManualBarangay}
                style={{
                  flex: 2, padding: '14px', borderRadius: 14,
                  background: '#2563EB', color: 'white', border: 'none',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                  fontFamily: 'inherit',
                }}
              >
                Continue to Review
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ── Pre-flight Review & Submit Modal (Screen-Centered Dialog) ── */}
      {showReviewModal && detectedLocation && (
        <div
          onClick={() => setShowReviewModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 24,
              padding: '28px 24px 28px',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'modalScaleIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: '#FEF2F2', border: '1.5px solid #FECACA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', color: '#DC2626',
              }}>
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>
                Confirm Emergency Dispatch
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                Please review your report details before sending to MDRRMO.
              </p>
            </div>

            {/* Preview Summary Card */}
            <div style={{
              background: '#F8FAFC', borderRadius: 16, padding: '14px 16px',
              border: '1px solid #E2E8F0', marginBottom: 22, display: 'flex', gap: 14, alignItems: 'center',
            }}>
              {preview && (
                <img
                  src={preview}
                  alt="Review thumbnail"
                  style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid #CBD5E1' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2563EB', fontSize: 13, fontWeight: 800 }}>
                  <MapPin size={14} />
                  <span>{detectedLocation.barangay}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  {parseFloat(detectedLocation.lat).toFixed(4)}°N, {parseFloat(detectedLocation.lng).toFixed(4)}°E
                </div>
                <div style={{ fontSize: 11, color: isOnline ? '#16A34A' : '#D97706', fontWeight: 700, marginTop: 4 }}>
                  {isOnline ? '● Live Server Dispatch' : '● Stored to Offline Queue'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: '#F1F5F9', border: '1.5px solid #E2E8F0',
                  color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeSubmit}
                style={{
                  flex: 2, padding: '14px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white', border: 'none',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
                  fontFamily: 'inherit',
                }}
              >
                Confirm & Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Location Framework Modal (Screen-Centered Dialog) ── */}
      {showLocationGuideModal && (
        <div
          onClick={() => setShowLocationGuideModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 20px)',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 24,
              padding: 'clamp(20px, 4vw, 28px) clamp(16px, 4vw, 24px)',
              width: 'min(420px, calc(100vw - 32px))',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.32)',
              animation: 'modalScaleIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: locStatus === 'PERMISSION_DENIED' ? '#DBEAFE' : '#FEF3C7',
                border: `1.5px solid ${locStatus === 'PERMISSION_DENIED' ? '#BFDBFE' : '#FDE68A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                color: locStatus === 'PERMISSION_DENIED' ? '#2563EB' : '#D97706',
              }}>
                {locStatus === 'PERMISSION_DENIED' ? (
                  <Lock size={26} />
                ) : (
                  <Navigation size={26} />
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>
                {locStatus === 'PERMISSION_DENIED'
                  ? 'Allow Location Access'
                  : 'Turn On Phone Location'}
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                {locStatus === 'PERMISSION_DENIED'
                  ? 'SendResQPls needs location access to pinpoint where emergency responders should be dispatched.'
                  : 'Your phone GPS is currently off. Turn on location services to automatically tag your emergency report.'}
              </p>
            </div>

            {/* Step-by-step instructions card */}
            <div style={{
              background: '#F8FAFC', borderRadius: 16, padding: '16px',
              border: '1px solid #E2E8F0', marginBottom: 20,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {locStatus === 'PERMISSION_DENIED' ? (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Tap <strong>Open App Settings</strong> below (or the 🔒 lock icon in browser).
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Tap <strong>Permissions</strong> → <strong>Location</strong> → choose <strong>Allow</strong>.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Return here and tap <strong>Check Location Now</strong>.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F59E0B', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      Tap <strong>Enable Location</strong> below — your phone will show a location prompt.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F59E0B', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      If asked, tap <strong>Allow</strong> or turn on <strong>📍 Location / GPS</strong> in the popup.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F59E0B', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                      The app will automatically detect your location once enabled.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {locStatus === 'PERMISSION_DENIED' ? (
                /* Permission blocked — must go to OS settings */
                <button
                  onClick={() => openAppSettings()}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: 'white', border: 'none',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Lock size={16} /> Open App Settings
                </button>
              ) : (
                /* GPS off or not yet asked — fire the native browser dialog inline */
                <button
                  disabled={locRequesting}
                  onClick={async () => {
                    const ok = await requestLocation();
                    if (ok) {
                      showToast({ type: 'success', priority: 'normal', title: 'Location Enabled!', message: 'GPS auto-tagging is now active.' });
                      setShowLocationGuideModal(false);
                    }
                    // If still blocked, locStatus updates reactively — modal will shift to PERMISSION_DENIED state automatically
                  }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14,
                    background: locRequesting ? '#92400E' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: 'white', border: 'none',
                    fontSize: 14, fontWeight: 800,
                    cursor: locRequesting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: locRequesting ? 0.85 : 1,
                  }}
                >
                  {locRequesting ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Detecting Location…
                    </>
                  ) : (
                    <><Navigation size={16} /> Enable Location</>
                  )}
                </button>
              )}

              <button
                onClick={async () => {
                  const ok = await recheckLocation();
                  if (ok) {
                    showToast({ type: 'success', priority: 'normal', title: 'Location Enabled!', message: 'GPS auto-tagging is now active.' });
                    setShowLocationGuideModal(false);
                  } else {
                    showToast({ type: 'warning', priority: 'important', title: 'Still Disabled', message: 'Location is not yet enabled. Please follow the steps above.' });
                  }
                }}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: '#F1F5F9', color: '#1E293B',
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Navigation size={15} /> Check Location Now
              </button>

              <button
                onClick={() => setShowLocationGuideModal(false)}
                style={{
                  width: '100%', padding: '11px', borderRadius: 14,
                  background: 'none', border: 'none',
                  color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Screen Modal Overlay (Facebook-Style, No Icons) ── */}
      {submittedIncident && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 11000,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(12px, 3vw, 24px)',
          overflowY: 'auto',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: 'clamp(20px, 4vw, 28px) clamp(16px, 4vw, 24px)',
            width: 'min(380px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            animation: 'scaleUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <div style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: submittedIncident.offline ? '#D97706' : '#16A34A',
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {submittedIncident.offline ? 'Offline Storage' : 'Live MDRRMO Dispatch'}
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              {submittedIncident.offline ? 'Report Saved Locally' : 'Emergency Alert Dispatched!'}
            </h2>

            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.55, margin: '0 0 20px' }}>
              {submittedIncident.offline
                ? 'Your report is stored and will automatically transmit to MDRRMO as soon as internet connection is restored.'
                : `Incident reference ${submittedIncident.id?.slice(0, 8) || ''} logged at ${submittedIncident.barangay}. Responders notified.`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Optional SMS trigger if emergency contacts exist */}
              {emergencyContacts.length > 0 && (
                <button
                  onClick={handleShareSMS}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 14,
                    background: '#FEF3C7', border: '1.5px solid #FDE68A',
                    color: '#92400E', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit',
                  }}
                >
                  <MessageSquare size={16} color="#D97706" /> Notify {emergencyContacts.length} Emergency Contact{emergencyContacts.length > 1 ? 's' : ''} (SMS)
                </button>
              )}

              <button
                onClick={() => navigate('/mobile/history')}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  background: '#2563EB', color: 'white', border: 'none',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                }}
              >
                Track in Report History <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/mobile')}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: '#F1F5F9', border: '1.5px solid #E2E8F0',
                  color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
