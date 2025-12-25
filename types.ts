
export type UserRole = 'admin' | 'doctor' | 'patient';

export interface ClinicSettings {
  aiConsultationEnabled: boolean;
  photoConsultationEnabled: boolean;
  restrictStaffLogs: boolean;
  patientVisibility: {
    summary: boolean;
    results: boolean;
    careInstructions: boolean;
  };
}

export const CLINIC_TREATMENTS = [
  "Facial",
  "CO2 Laser",
  "Candela Laser",
  "Diag Laser",
  "Lose Weight Machine",
  "Hair Implementation",
  "Botox Injection",
  "Mezo Gel Injection",
  "Skin Tightening",
  "Chemical Peel"
];

export interface ClinicStaff {
  id: string;
  name: string;
  username: string;
  password?: string;
  specialty: string;
  role: 'admin' | 'doctor';
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  password?: string;
  email: string;
  dob: string; // Used for age
  notes: string;
  createdAt: string;
  photos?: { id: string; url: string; timestamp: string; note: string }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  dateTime: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'rejected';
  type: string;
  assignedStaffId?: string;
  originalSuggestedTime?: string;
  isVerified: boolean;
}

export interface SessionRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  timestamp: string;
  summary: string;
  results: string;
  nextSessionDate?: string;
  careInstructions: string;
  treatmentType: string;
}

export interface Notification {
  id: string;
  patientId: string;
  appointmentId?: string;
  type: 'welcome' | 'reminder_24h' | 'reminder_2h' | 'verification_request' | 'verification_confirm' | 'rejection';
  channel: 'WhatsApp' | 'SMS';
  content: string;
  sentAt: string;
  status: 'sent' | 'pending';
}

export type View = 'dashboard' | 'patients' | 'appointments' | 'sessions' | 'notifications' | 'patient-portal' | 'settings' | 'photos';
