import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Import the client
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

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  
  // Data State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<ClinicStaff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<ClinicSettings>({ 
    aiConsultationEnabled: true,
    photoConsultationEnabled: true,
    restrictStaffLogs: false,
    patientVisibility: { summary: true, results: true, careInstructions: true }
  });

  // --- STEP 1: LOAD DATA FROM SUPABASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Patients
        const { data: pts } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
        if (pts) setPatients(pts);

        // Fetch Staff
        const { data: stf } = await supabase.from('staff').select('*');
        if (stf) setStaff(stf);

        // Fetch Appointments
        const { data: apts } = await supabase.from('appointments').select('*');
        if (apts) setAppointments(apts);

        // Fetch Sessions
        const { data: sess } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
        if (sess) setSessions(sess);

        // Fetch Settings
        const { data: sett } = await supabase.from('settings').select('*').single();
        if (sett) {
          setSettings({
            aiConsultationEnabled: sett.ai_consultation_enabled,
            aiStaffEnabled: sett.ai_staff_enabled,
            photoConsultationEnabled: sett.photo_consultation_enabled,
            restrictStaffLogs: sett.restrict_staff_logs,
            patientVisibility: sett.patient_visibility
          });
        }

        // Keep local session for login persistence (standard practice)
        const savedSession = JSON.parse(localStorage.getItem('mp_user_session') || 'null');
        if (savedSession) {
          setRole(savedSession.role);
          setCurrentUserId(savedSession.id);
          setView(savedSession.role === 'patient' ? 'patient-portal' : 'dashboard');
        }
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
      }
    };

    fetchData();
  }, []);

  // --- STEP 2: PERSIST LOGIN SESSION ONLY ---
  useEffect(() => {
    if (role && currentUserId) {
      localStorage.setItem('mp_user_session', JSON.stringify({ role, id: currentUserId }));
    } else {
      localStorage.removeItem('mp_user_session');
    }
  }, [role, currentUserId]);

  const handleLogin = (role: UserRole, id: string) => {
    setRole(role);
    setCurrentUserId(id);
    setView(role === 'patient' ? 'patient-portal' : 'dashboard');
  };

  // --- STEP 3: REGISTER PATIENT IN SUPABASE ---
  const handleRegisterPatient = async (name: string, phone: string, pass: string) => {
    const newPatientData = {
      name,
      phone,
      password: pass,
      email: '',
      dob: '',
      notes: 'Self-registered via website.',
    };
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('patients')
      .insert([newPatientData])
      .select()
      .single();

    if (error) {
      alert("Error registering: " + error.message);
      return;
    }

    if (data) {
      setPatients(prev => [data, ...prev]);

      // Generate Welcome Message
      const welcomeContent = await generateWelcomeMessage(data);
      
      // Save Notification to Supabase
      const { data: notif } = await supabase.from('notifications').insert([{
        patient_id: data.id,
        type: 'welcome',
        channel: 'WhatsApp',
        content: welcomeContent,
        status: 'sent'
      }]).select().single();

      if (notif) setNotifications(prev => [notif, ...prev]);

      handleLogin('patient', data.id);
    }
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentUserId(null);
    setView('dashboard');
  };

  // --- RENDER LOGIC (Remains mostly the same) ---
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
        return <Dashboard patients={patients} appointments={filteredAppointments} onNavigate={setView} role={role} staffName={currentUser?.name} />;
      case 'patients': 
        return <PatientsView patients={patients} setPatients={setPatients} notifications={notifications} setNotifications={setNotifications} sessions={sessions} role={role} />;
      case 'appointments': 
        return <AppointmentsView appointments={appointments} setAppointments={setAppointments} patients={patients} notifications={notifications} setNotifications={setNotifications} role={role} currentStaffId={currentUserId} staff={staff} />;
      case 'sessions': 
        return <SessionsView sessions={sessions} setSessions={setSessions} patients={patients} appointments={appointments} setAppointments={setAppointments} role={role} currentStaffId={currentUserId} settings={settings} staff={staff} />;
      case 'notifications':
        return <NotificationsView notifications={notifications} patients={patients} />;
      case 'settings':
        return <SettingsView settings={settings} setSettings={setSettings} staff={staff} setStaff={setStaff} role={role} />;
      case 'photos':
        return <PhotosView patients={patients} settings={settings} role={role} currentStaffId={currentUserId} />;
      default: 
        return <Dashboard patients={patients} appointments={filteredAppointments} onNavigate={setView} role={role} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={view} onViewChange={setView} role={role} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
