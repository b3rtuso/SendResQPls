import Header from '../components/Header';
import { Phone, Mail, Users } from 'lucide-react';
import type { DepartmentInfo } from '../types';

const departments: DepartmentInfo[] = [
  { id: '1', name: 'BFP', fullName: 'Bureau of Fire Protection', headOfficer: 'FO3 Roberto Cruz', contact: '(02) 8426-0219', email: 'bfp.pasig@gov.ph', personnelCount: 45, equipment: ['Fire Trucks', 'Ladder Trucks', 'Rescue Gear', 'Water Tankers'], status: 'Available' },
  { id: '2', name: 'PNP', fullName: 'Philippine National Police', headOfficer: 'PCPT. Ana Reyes', contact: '(02) 8723-0401', email: 'pnp.pasig@gov.ph', personnelCount: 120, equipment: ['Patrol Cars', 'Traffic Cones', 'Body Cameras', 'K9 Units'], status: 'Available' },
  { id: '3', name: 'MEDICAL', fullName: 'Medical / Red Cross', headOfficer: 'Dr. Luis Santos', contact: '(02) 8527-8385', email: 'medical.pasig@gov.ph', personnelCount: 30, equipment: ['Ambulances', 'First Aid Kits', 'Stretchers', 'Defibrillators'], status: 'Deployed' },
  { id: '4', name: 'ENGINEERING', fullName: 'DPWH / Local Engineering', headOfficer: 'Engr. Mark Lim', contact: '(02) 8304-3706', email: 'engineering.pasig@gov.ph', personnelCount: 25, equipment: ['Backhoes', 'Chainsaws', 'Barricades', 'Generators'], status: 'On Standby' },
  { id: '5', name: 'RESCUE', fullName: 'MDRRMO Rescue Team', headOfficer: 'SRO Jose Garcia', contact: '(02) 8631-1044', email: 'rescue.pasig@gov.ph', personnelCount: 55, equipment: ['Rescue Boats', 'Rope Systems', 'Life Vests', 'Night Vision'], status: 'Available' },
];

const statusClass: Record<string, string> = { Available: 'available', 'On Standby': 'standby', Deployed: 'deployed' };

export default function Departments() {
  return (
    <>
      <Header title="Responding Departments" subtitle="Manage and monitor department availability" />
      <div className="page-content">
        <div className="dept-grid fade-in">
          {departments.map((dept) => (
            <div className="dept-card" key={dept.id}>
              <div className="dept-card-header">
                <div>
                  <h4>{dept.name}</h4>
                  <div className="dept-sub">{dept.fullName}</div>
                </div>
                <span className={`badge ${statusClass[dept.status]}`}>{dept.status}</span>
              </div>
              <div className="dept-detail"><Users size={14} /> <strong>Head:</strong> {dept.headOfficer}</div>
              <div className="dept-detail"><Phone size={14} /> <strong>Contact:</strong> {dept.contact}</div>
              <div className="dept-detail"><Mail size={14} /> <strong>Email:</strong> {dept.email}</div>
              <div className="dept-detail"><Users size={14} /> <strong>Personnel:</strong> {dept.personnelCount} active</div>
              <div className="equipment-tags">
                {dept.equipment.map((eq) => <span className="equipment-tag" key={eq}>{eq}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
