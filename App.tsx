import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
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

  // --- STEP 1: LOAD INITIAL DATA ---
  const fetchData = async () => {
    try {
      const { data: pts } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (pts) setPatients(pts);

      const { data: stf } = await supabase.from('staff').select('*');
      if (stf) setStaff(stf);

      const { data: apts } = await supabase.from('appointments').select('*');
      if (apts) setAppointments(apts);

      const { data: sess } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
      if (sess) setSessions(sess);

      const { data: sett } = await supabase.from('settings').select('*').single();
      if (sett) {
        setSettings({
          aiConsultationEnabled: sett.ai_consultation_enabled,
          photoConsultationEnabled: sett.photo_consultation_enabled,
          restrictStaffLogs: sett.restrict_staff_logs,
          patientVisibility: sett.patient_visibility
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // --- STEP 2: REAL-TIME SUBSCRIPTIONS (The Fix for Big Problems) ---
  useEffect(() => {
    fetchData(); // Initial load

    // Listen to changes in ANY table
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        // When ANY change happens in the DB, refresh the data
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- STEP 3: PERSIST LOGIN ---
  useEffect(() => {
    const savedSession = JSON.parse(localStorage.getItem('mp_user_session') || 'null');
    if (savedSession) {
      setRole(savedSession.role);
      setCurrentUserId(savedSession.id);
      setView(savedSession.role === 'patient' ? 'patient-portal' : 'dashboard');
    }
  }, []);

  useEffect(() => {
    if (role && currentUserId) {
      localStorage.setItem('mp_user_session', JSON.stringify({ role, id: currentUserId }));
    }
  }, [role, currentUserId]);

  const handleLogin = (role: UserRole, id: string) => {
    setRole(role);
    setCurrentUserId(id);
    setView(role === 'patient' ? 'patient-portal' : 'dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('mp_user_session');
    setRole(null);
    setCurrentUserId(null);
    setView('dashboard');
  };

  // --- STEP 4: REGISTER PATIENT ---
  const handleRegisterPatient = async (name: string, phone: string, pass: string) => {
    const { data, error } = await supabase
      .from('patients')
      .insert([{ name, phone, password: pass, notes: 'Self-registered' }])
      .select()
      .single();

    if (error) {
      alert("Registration failed: " + error.message);
      return;
    }

    if (data) {
      // AI Welcome Message
      try {
        const welcomeContent = await generateWelcomeMessage(data);
        await supabase.from('notifications').insert([{
          patient_id: data.id,
          type: 'welcome',
          content: welcomeContent,
          status: 'sent'
        }]);
      } catch (aiErr) {
        console.error("AI Error:", aiErr);
      }
      handleLogin('patient', data.id);
    }
  };

  if (!role || !currentUserId) {
    return <AuthView patients={patients} staff={staff} onLogin={handleLogin} onRegisterPatient={handleRegisterPatient} />;
  }

  const currentUser = role === 'patient' 
    ? patients.find(p => p.id === currentUserId) 
    : staff.find(s => s.id === currentUserId);

  // Render Logic (remains same but uses live data)
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
      case 'dashboard': return <Dashboard patients={patients} appointments={filteredAppointments} onNavigate={setView} role={role} staffName={currentUser?.name} />;
      case 'patients': return <PatientsView patients={patients} setPatients={setPatients} notifications={notifications} setNotifications={setNotifications} sessions={sessions} role={role} />;
      case 'appointments': return <AppointmentsView appointments={appointments} setAppointments={setAppointments} patients={patients} notifications={notifications} setNotifications={setNotifications} role={role} currentStaffId={currentUserId} staff={staff} />;
      case 'sessions': return <SessionsView sessions={sessions} setSessions={setSessions} patients={patients} appointments={appointments} setAppointments={setAppointments} role={role} currentStaffId={currentUserId} settings={settings} staff={staff} />;
      case 'notifications': return <NotificationsView notifications={notifications} patients={patients} />;
      case 'settings': return <SettingsView settings={settings} setSettings={setSettings} staff={staff} setStaff={setStaff} role={role} />;
      case 'photos': return <PhotosView patients={patients} settings={settings} role={role} currentStaffId={currentUserId} />;
      default: return <Dashboard patients={patients} appointments={filteredAppointments} onNavigate={setView} role={role} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={view} onViewChange={setView} role={role} currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
