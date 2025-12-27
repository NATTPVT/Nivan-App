export type UserRole = 'admin' | 'doctor' | 'patient';

export interface ClinicSettings {
  aiConsultationEnabled: boolean;
  aiPatientEnabled: boolean;
  aiStaffEnabled: boolean;
  photoConsultationEnabled: boolean;
  restrictStaffLogs: boolean;
  patientVisibility: {
    summary: boolean;
    results: boolean;
    careInstructions: boolean;
  };
}

export const CLINIC_TREATMENTS = [
  "Facial", "CO2 Laser", "Candela Laser", "Diag Laser",
  "Lose Weight Machine", "Hair Implementation", "Botox Injection",
  "Mezo Gel Injection", "Skin Tightening", "Chemical Peel"
];

export interface ClinicStaff {
  id: string;
  name: string;
  username: string;
  specialty: string;
  role: 'admin' | 'doctor';
}

// FIXED: Matched to Supabase snake_case columns
export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string; // nullable in DB? We will handle it.
  dob: string;
  notes: string;
  password?: string; // Optional for UI security
  created_at: string; // CHANGED from createdAt to match DB
  photos?: { id: string; url: string; timestamp: string; note: string }[];
}

export interface Appointment {
  id: string;
  patient_id: string; // CHANGED to snake_case
  date_time: string;  // CHANGED to snake_case
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'rejected';
  type: string;
  assigned_staff_id?: string; // CHANGED
  is_verified: boolean; // CHANGED
}

export interface SessionRecord {
  id: string;
  appointment_id: string; // CHANGED
  patient_id: string;     // CHANGED
  doctor_id: string;      // CHANGED
  created_at: string;     // CHANGED
  summary: string;
  results: string;
  care_instructions: string; // CHANGED
  treatment_type: string;    // CHANGED
}

export interface Notification {
  id: string;
  patient_id: string;
  type: 'welcome' | 'reminder_24h' | 'reminder_2h' | 'verification_request' | 'verification_confirm' | 'rejection';
  channel: 'WhatsApp' | 'SMS';
  content: string;
  created_at: string;
  status: 'sent' | 'pending';
}

export type View = 'dashboard' | 'patients' | 'appointments' | 'sessions' | 'notifications' | 'patient-portal' | 'settings' | 'photos';
