
import React, { useState, useEffect } from 'react';
import { View, Patient, Appointment, SessionRecord, Notification, UserRole, ClinicSettings, ClinicStaff } from './types';
import Sidebar from './components/Sidebar';
import AuthView from './components/AuthView';
import Dashboard from './views/Dashboard';
import PatientsView from './views/PatientsView';
import AppointmentsView from './views/AppointmentsView';
import SessionsView from './views/SessionsView';
import NotificationsView from './views/NotificationsView';
import PatientPortal from './views/PatientPortal';
import SettingsView from './views/SettingsView';
import PhotosView from './views/PhotosView';
import { generateWelcomeMessage } from './services/geminiService';

const DEFAULT_STAFF: ClinicStaff[] = [
  { id: 'admin', name: 'System Admin', username: 'admin', password: '123', specialty: 'Management', role: 'admin' },
  { id: 'doc1', name: 'Dr. Sarah', username: 'sarah', password: '123', specialty: 'Facial', role: 'doctor' },
];

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<ClinicStaff[]>(DEFAULT_STAFF);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<ClinicSettings>({ 
    aiConsultationEnabled: true,
    photoConsultationEnabled: true,
    restrictStaffLogs: false,
    patientVisibility: {
      summary: true,
      results: true,
      careInstructions: true
    }
  });

  useEffect(() => {
    const savedPatients = JSON.parse(localStorage.getItem('mp_patients') || '[]');
    const savedStaff = JSON.parse(localStorage.getItem('mp_staff') || JSON.stringify(DEFAULT_STAFF));
    const savedAppointments = JSON.parse(localStorage.getItem('mp_appointments') || '[]');
    const savedSessions = JSON.parse(localStorage.getItem('mp_sessions') || '[]');
    const savedNotifications = JSON.parse(localStorage.getItem('mp_notifications') || '[]');
    const savedSettings = JSON.parse(localStorage.getItem('mp_settings') || JSON.stringify(settings));
    const savedSession = JSON.parse(localStorage.getItem('mp_user_session') || 'null');

    setPatients(savedPatients);
    setStaff(savedStaff);
    setAppointments(savedAppointments);
    setSessions(savedSessions);
    setNotifications(savedNotifications);
    setSettings(savedSettings);

    if (savedSession) {
      setRole(savedSession.role);
      setCurrentUserId(savedSession.id);
      setView(savedSession.role === 'patient' ? 'patient-portal' : 'dashboard');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mp_patients', JSON.stringify(patients));
    localStorage.setItem('mp_staff', JSON.stringify(staff));
    localStorage.setItem('mp_appointments', JSON.stringify(appointments));
    localStorage.setItem('mp_sessions', JSON.stringify(sessions));
    localStorage.setItem('mp_notifications', JSON.stringify(notifications));
    localStorage.setItem('mp_settings', JSON.stringify(settings));
    
    if (role && currentUserId) {
      localStorage.setItem('mp_user_session', JSON.stringify({ role, id: currentUserId }));
    } else {
      localStorage.removeItem('mp_user_session');
    }
  }, [patients, staff, appointments, sessions, notifications, settings, role, currentUserId]);

  const handleLogin = (role: UserRole, id: string) => {
    setRole(role);
    setCurrentUserId(id);
    setView(role === 'patient' ? 'patient-portal' : 'dashboard');
  };

  const handleRegisterPatient = async (name: string, phone: string, pass: string) => {
    const id = crypto.randomUUID();
    const newPatient: Patient = {
      id,
      name,
      phone,
      password: pass,
      email: '',
      dob: '',
      notes: 'Self-registered via website.',
      createdAt: new Date().toISOString()
    };
    
    setPatients(prev => [newPatient, ...prev]);

    // Send automated welcome
    const welcomeContent = await generateWelcomeMessage(newPatient);
    setNotifications(prev => [{
      id: crypto.randomUUID(),
      patientId: id,
      type: 'welcome',
      channel: 'WhatsApp',
      content: welcomeContent,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }, ...prev]);

    handleLogin('patient', id);
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentUserId(null);
    setView('dashboard');
  };

  if (!role || !currentUserId) {
    return (
      <AuthView 
        patients={patients} 
        staff={staff} 
        onLogin={handleLogin} 
        onRegisterPatient={handleRegisterPatient} 
      />
    );
  }

  const currentUser = role === 'patient' 
    ? patients.find(p => p.id === currentUserId) 
    : staff.find(s => s.id === currentUserId);

  const renderView = () => {
    if (role === 'patient') {
      return (
        <PatientPortal 
          patient={currentUser as Patient} 
          appointments={appointments}
          setAppointments={setAppointments}
          sessions={sessions}
          settings={settings}
          setPatients={setPatients}
        />
      );
    }

    const filteredAppointments = (role === 'admin') 
      ? appointments 
      : appointments.filter(a => a.assignedStaffId === currentUserId);

    switch(view) {
      case 'dashboard': 
        return <Dashboard 
          patients={patients} 
          appointments={filteredAppointments} 
          onNavigate={setView} 
          role={role}
          staffName={currentUser?.name}
        />;
      case 'patients': 
        return <PatientsView 
          patients={patients} 
          setPatients={setPatients} 
          notifications={notifications} 
          setNotifications={setNotifications}
          sessions={sessions}
          role={role}
        />;
      case 'appointments': 
        return <AppointmentsView 
          appointments={appointments} 
          setAppointments={setAppointments} 
          patients={patients} 
          notifications={notifications} 
          setNotifications={setNotifications} 
          role={role}
          currentStaffId={currentUserId}
          staff={staff}
        />;
      case 'sessions': 
        return <SessionsView 
          sessions={sessions} 
          setSessions={setSessions} 
          patients={patients} 
          appointments={appointments} 
          setAppointments={setAppointments} 
          role={role}
          currentStaffId={currentUserId}
          settings={settings}
          staff={staff}
        />;
      case 'notifications':
        return <NotificationsView notifications={notifications} patients={patients} />;
      case 'settings':
        return <SettingsView 
          settings={settings} 
          setSettings={setSettings} 
          staff={staff} 
          setStaff={setStaff} 
          role={role} 
        />;
      case 'photos':
        return <PhotosView patients={patients} settings={settings} role={role} currentStaffId={currentUserId} />;
      default: 
        return <Dashboard patients={patients} appointments={filteredAppointments} onNavigate={setView} role={role} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        role={role} 
        currentUser={currentUser}
        onLogout={handleLogout} 
      />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
