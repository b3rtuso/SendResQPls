export type Status = 'PENDING' | 'REVIEWING' | 'DISPATCHED' | 'RESOLVED' | 'REJECTED';
export type Department = 'BFP' | 'PNP' | 'MEDICAL' | 'ENGINEERING' | 'RESCUE';
export type Role = 'CITIZEN' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: Role;
  createdAt: string;
}

export interface Incident {
  id: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  aiDetectedType?: string;
  aiRecommendedDept?: Department;
  assignedDepartment?: Department;
  status: Status;
  adminNotes?: string;
  reporterId: string;
  reporter?: User;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  dispatched: number;
  completed: number;
}

export interface CallLog {
  id: string;
  requestId: string;
  callerName: string;
  department: string;
  duration: string;
  status: 'Accepted' | 'No Response' | 'Declined';
  timestamp: string;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  fullName: string;
  headOfficer: string;
  contact: string;
  email: string;
  personnelCount: number;
  equipment: string[];
  status: 'Available' | 'On Standby' | 'Deployed';
}
