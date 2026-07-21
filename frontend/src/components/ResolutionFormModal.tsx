import { useState } from 'react';
import { X, CheckCircle2, Upload, Camera, FileText, HeartPulse, UserCheck, ShieldAlert } from 'lucide-react';
import type { Incident, ResolutionForm } from '../types';
import { getNearestBarangay } from '../data/balayan-data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ResolutionForm) => void;
  incident: Incident;
  isSubmitting?: boolean;
}

export default function ResolutionFormModal({ isOpen, onClose, onSubmit, incident, isSubmitting }: Props) {
  const defaultDate = incident?.createdAt ? new Date(incident.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const defaultTime = incident?.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  const defaultLocation = incident ? getNearestBarangay(incident.latitude, incident.longitude) + ', Balayan, Batangas' : 'Balayan, Batangas';

  const [formData, setFormData] = useState<ResolutionForm>({
    incidentType: incident?.aiDetectedType || 'Trauma Emergency',
    incidentDate: defaultDate,
    incidentTime: defaultTime,
    incidentLocation: defaultLocation,

    patientName: '',
    patientAge: '',
    patientSex: 'Male',
    patientAddress: defaultLocation,

    howIncidentHappened: '',
    intoxicationSuspected: 'No',
    mechanismOfInjury: 'Vehicular Accident',

    injuriesObserved: 'Abrasions, Contusions',
    gcsLevel: 'Alert (15)',
    airwayStatus: 'Clear',
    breathingStatus: 'Normal',
    circulationStatus: 'Pulse Present',

    bloodPressure: '120/80',
    pulseRate: '80',
    respiratoryRate: '18',
    oxygenSaturation: '98',
    temperature: '36.5',
    gcsScore: '15',

    treatmentInterventions: 'Wound cleaning, dressing, vitals monitoring',
    bleedingControlled: 'Yes',
    patientImmobilized: 'Yes',
    woundsCleaned: 'Yes',
    oxygenAdministered: 'No',

    procedurePhotoUrl: '',

    respondingAgency: 'MDRRMO Balayan Rescue Team',
    responderNames: 'Giovanni Marco, Team Alpha',
    arrivalTime: defaultTime,
    departureTime: '',

    dispositionStatus: 'TRANSPORTED',
    destinationFacility: 'Balayan Medicare Hospital',
    transportTime: defaultTime,
    turnoverStatus: 'Stable upon turnover',
  });

  const [photoPreview, setPhotoPreview] = useState<string>('');

  if (!isOpen) return null;

  const handleChange = (field: keyof ResolutionForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData((prev) => ({ ...prev, procedurePhotoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: 820,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}>
              <CheckCircle2 size={22} color="#22C55E" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
                Incident Resolution Questionnaire
              </h2>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                Fill out clinical & disposition data to finalize resolution for Incident #{incident.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Section 1: Incident Info */}
          <div className="form-section">
            <h3 className="section-title"><FileText size={16} /> 1. Incident Information</h3>
            <div className="form-grid-2">
              <div>
                <label className="field-label">Incident Type</label>
                <select className="field-input" value={formData.incidentType} onChange={(e) => handleChange('incidentType', e.target.value)}>
                  <option value="Trauma Emergency">Trauma Emergency</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Medical Conduction">Medical Conduction</option>
                  <option value="Fire Incident">Fire Incident</option>
                  <option value="Crime-Related Incident">Crime-Related Incident</option>
                </select>
              </div>
              <div>
                <label className="field-label">Location</label>
                <input className="field-input" value={formData.incidentLocation} onChange={(e) => handleChange('incidentLocation', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Date of Incident</label>
                <input type="date" className="field-input" value={formData.incidentDate} onChange={(e) => handleChange('incidentDate', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Time of Incident</label>
                <input type="text" className="field-input" value={formData.incidentTime} onChange={(e) => handleChange('incidentTime', e.target.value)} placeholder="e.g. 1430H" required />
              </div>
            </div>
          </div>

          {/* Section 2: Patient Info */}
          <div className="form-section">
            <h3 className="section-title"><UserCheck size={16} /> 2. Patient Information</h3>
            <div className="form-grid-2">
              <div>
                <label className="field-label">Full Name</label>
                <input className="field-input" placeholder="Patient's Full Name" value={formData.patientName} onChange={(e) => handleChange('patientName', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Age</label>
                <input className="field-input" placeholder="e.g. 34" value={formData.patientAge} onChange={(e) => handleChange('patientAge', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Sex</label>
                <select className="field-input" value={formData.patientSex} onChange={(e) => handleChange('patientSex', e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="field-label">Address</label>
                <input className="field-input" placeholder="Barangay / Address" value={formData.patientAddress} onChange={(e) => handleChange('patientAddress', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Section 3: Incident Details */}
          <div className="form-section">
            <h3 className="section-title"><ShieldAlert size={16} /> 3. Incident Details</h3>
            <div style={{ marginBottom: 12 }}>
              <label className="field-label">Describe How the Incident Happened</label>
              <textarea className="field-input" rows={2} placeholder="Brief narrative of the incident event..." value={formData.howIncidentHappened} onChange={(e) => handleChange('howIncidentHappened', e.target.value)} required />
            </div>
            <div className="form-grid-2">
              <div>
                <label className="field-label">Intoxication Suspected? (Alcohol/Drugs)</label>
                <select className="field-input" value={formData.intoxicationSuspected} onChange={(e) => handleChange('intoxicationSuspected', e.target.value)}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="field-label">Mechanism of Injury / Cause</label>
                <input className="field-input" placeholder="e.g. Motorcycle Collision, Fall from Height, Hypertension" value={formData.mechanismOfInjury} onChange={(e) => handleChange('mechanismOfInjury', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Section 4: Patient Assessment */}
          <div className="form-section">
            <h3 className="section-title"><HeartPulse size={16} /> 4. Patient Assessment</h3>
            <div style={{ marginBottom: 12 }}>
              <label className="field-label">Injuries Observed / Chief Complaints</label>
              <input className="field-input" placeholder="e.g. Abrasions, Laceration Wounds, Dizziness, Difficulty of Breathing" value={formData.injuriesObserved} onChange={(e) => handleChange('injuriesObserved', e.target.value)} required />
            </div>
            <div className="form-grid-4">
              <div>
                <label className="field-label">Consciousness</label>
                <input className="field-input" value={formData.gcsLevel} onChange={(e) => handleChange('gcsLevel', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Airway Status</label>
                <input className="field-input" value={formData.airwayStatus} onChange={(e) => handleChange('airwayStatus', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Breathing</label>
                <input className="field-input" value={formData.breathingStatus} onChange={(e) => handleChange('breathingStatus', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Circulation</label>
                <input className="field-input" value={formData.circulationStatus} onChange={(e) => handleChange('circulationStatus', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 5: Vital Signs */}
          <div className="form-section">
            <h3 className="section-title">5. Vital Signs</h3>
            <div className="form-grid-3">
              <div>
                <label className="field-label">Blood Pressure (BP)</label>
                <input className="field-input" placeholder="e.g. 120/80" value={formData.bloodPressure} onChange={(e) => handleChange('bloodPressure', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Pulse Rate (bpm)</label>
                <input className="field-input" placeholder="e.g. 82" value={formData.pulseRate} onChange={(e) => handleChange('pulseRate', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Resp. Rate (cpm)</label>
                <input className="field-input" placeholder="e.g. 18" value={formData.respiratoryRate} onChange={(e) => handleChange('respiratoryRate', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Oxygen Saturation (SaO₂ %)</label>
                <input className="field-input" placeholder="e.g. 98%" value={formData.oxygenSaturation} onChange={(e) => handleChange('oxygenSaturation', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Temperature (°C)</label>
                <input className="field-input" placeholder="e.g. 36.5" value={formData.temperature} onChange={(e) => handleChange('temperature', e.target.value)} />
              </div>
              <div>
                <label className="field-label">GCS Score (3-15)</label>
                <input className="field-input" placeholder="e.g. 15" value={formData.gcsScore} onChange={(e) => handleChange('gcsScore', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 6: Pre-hospital Care */}
          <div className="form-section">
            <h3 className="section-title">6. Pre-Hospital Care & Interventions</h3>
            <div style={{ marginBottom: 12 }}>
              <label className="field-label">Treatment Provided</label>
              <textarea className="field-input" rows={2} placeholder="Interventions rendered by responders..." value={formData.treatmentInterventions} onChange={(e) => handleChange('treatmentInterventions', e.target.value)} required />
            </div>
            <div className="form-grid-4">
              <div>
                <label className="field-label">Bleeding Controlled?</label>
                <select className="field-input" value={formData.bleedingControlled} onChange={(e) => handleChange('bleedingControlled', e.target.value)}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div>
                <label className="field-label">Patient Immobilized?</label>
                <select className="field-input" value={formData.patientImmobilized} onChange={(e) => handleChange('patientImmobilized', e.target.value)}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div>
                <label className="field-label">Wounds Cleaned?</label>
                <select className="field-input" value={formData.woundsCleaned} onChange={(e) => handleChange('woundsCleaned', e.target.value)}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
              <div>
                <label className="field-label">Oxygen Administered?</label>
                <select className="field-input" value={formData.oxygenAdministered} onChange={(e) => handleChange('oxygenAdministered', e.target.value)}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 7: Procedure / Ongoing Rescue Photo Upload */}
          <div className="form-section">
            <h3 className="section-title"><Camera size={16} /> 7. Ongoing Rescue / Procedure Photo</h3>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <label style={{
                flex: 1,
                border: '2px dashed #CBD5E1',
                borderRadius: 12,
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#F8FAFC',
                transition: 'all 0.2s',
              }}>
                <Upload size={24} color="#64748B" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Upload Procedure / Rescue Photo</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>PNG, JPG or WEBP (Appears on Daily .docx Report)</div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              {photoPreview && (
                <div style={{ width: 90, height: 90, borderRadius: 10, overflow: 'hidden', border: '2px solid #22C55E', flexShrink: 0 }}>
                  <img src={photoPreview} alt="Procedure Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>

          {/* Section 8: Response & Disposition Info */}
          <div className="form-section">
            <h3 className="section-title">8. Response & Patient Disposition</h3>
            <div className="form-grid-2" style={{ marginBottom: 12 }}>
              <div>
                <label className="field-label">Responding Agency</label>
                <input className="field-input" value={formData.respondingAgency} onChange={(e) => handleChange('respondingAgency', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Responders</label>
                <input className="field-input" value={formData.responderNames} onChange={(e) => handleChange('responderNames', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Arrival Time</label>
                <input className="field-input" value={formData.arrivalTime} onChange={(e) => handleChange('arrivalTime', e.target.value)} placeholder="e.g. 1435H" />
              </div>
              <div>
                <label className="field-label">Departure Time</label>
                <input className="field-input" value={formData.departureTime} onChange={(e) => handleChange('departureTime', e.target.value)} placeholder="e.g. 1510H" />
              </div>
            </div>
            <div className="form-grid-2">
              <div>
                <label className="field-label">Patient Disposition Status</label>
                <select className="field-input" value={formData.dispositionStatus} onChange={(e) => handleChange('dispositionStatus', e.target.value)}>
                  <option value="TRANSPORTED">Transported after care</option>
                  <option value="REFUSED_TRANSPORT">Refused Transport</option>
                  <option value="DEAD_ON_SPOT">Dead on the spot</option>
                  <option value="CANCELLED">Cancelled / Stood Down</option>
                </select>
              </div>
              <div>
                <label className="field-label">Destination Facility</label>
                <input className="field-input" value={formData.destinationFacility} onChange={(e) => handleChange('destinationFacility', e.target.value)} placeholder="e.g. Balayan Medicare Hospital" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#22C55E', borderColor: '#22C55E', minWidth: 160 }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving & Resolving...' : 'Complete & Resolve'}
            </button>
          </div>
        </form>

        <style>{`
          .form-section {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 16px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #0F172A;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
          .form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .field-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
          .field-input {
            width: 100%;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #CBD5E1;
            font-size: 13px;
            box-sizing: border-box;
            background: #FFFFFF;
            font-family: inherit;
          }
          .field-input:focus {
            outline: none;
            border-color: #2563EB;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}
