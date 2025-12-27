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
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<ClinicStaff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [settings, setSettings] = useState<ClinicSettings>({ 
    aiConsultationEnabled: true,
    aiPatientEnabled: true,
    aiStaffEnabled: true,
    photoConsultationEnabled: true,
    restrictStaffLogs: false,
    patientVisibility: { summary: true, results: true, careInstructions: true }
  });

  // --- 1. ROBUST DATA FETCHING ---
  const fetchData = async () => {
    try {
      const { data: pts, error: ptErr } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (ptErr) console.error("Patients Error:", ptErr);
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
          aiConsultationEnabled: sett.ai_consultation_enabled ?? true,
          aiPatientEnabled: sett.ai_patient_enabled ?? true,
          aiStaffEnabled: sett.ai_staff_enabled ?? true,
          photoConsultationEnabled: sett.photo_consultation_enabled ?? true,
          restrictStaffLogs: sett.restrict_staff_logs ?? false,
          patientVisibility: sett.patient_visibility ?? { summary: true, results: true, careInstructions: true }
        });
      }
    } catch (err) {
      console.error("Critical Fetch Error:", err);
    }
  };

  // --- 2. REALTIME SYNC ---
  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('main_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        console.log("Database changed, refreshing...");
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- 3. PERSIST LOGIN ---
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('mp_user_session') || 'null');
    if (session) {
      setRole(session.role);
      setCurrentUserId(session.id);
      setView(session.role === 'patient' ? 'patient-portal' : 'dashboard');
    }
  }, []);

  useEffect(() => {
    if (role && currentUserId) {
      localStorage.setItem('mp_user_session', JSON.stringify({ role, id: currentUserId }));
    } else {
      localStorage.removeItem('mp_user_session');
    }
  }, [role, currentUserId]);

  // --- 4. FIXED REGISTER FUNCTION ---
  const handleRegisterPatient = async (name: string, phone: string, pass: string) => {
    const newId = crypto.randomUUID(); // Generate ID client-side to be safe
    
    // Prepare object with exact DB column names
    const newPatient = {
      id: newId,
      name: name,
      phone: phone,
      password: pass,
      email: '', // Send empty string if not provided
      dob: '',
      notes: 'Self-registered'
    };

    const { data, error } = await supabase.from('patients').insert([newPatient]).select();

    if (error) {
      console.error("Supabase Write Error:", error);
      alert("Registration Error: " + error.message + " (Check console for details)");
      return;
    }

    if (data) {
      // Success! Log them in immediately.
      handleLogin('patient', newId);
      
      // Try AI Welcome (Non-blocking)
      generateWelcomeMessage(newPatient).then(msg => {
        supabase.from('notifications').insert([{
          patient_id: newId,
          type: 'welcome',
          channel: 'WhatsApp',
          content: msg,
          status: 'sent'
        }]);
      });
    }
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentUserId(null);
    setView('dashboard');
  };

  // --- RENDER ---
  if (!role || !currentUserId) {
    return <AuthView patients={patients} staff={staff} onLogin={handleLogin} onRegisterPatient={handleRegisterPatient} />;
  }

  const currentUser = role === 'patient' 
    ? patients.find(p => p.id === currentUserId) 
    : staff.find(s => s.id === currentUserId);

  const renderView = () => {
    if (role === 'patient') {
      return <PatientPortal patient={currentUser as Patient} appointments={appointments} setAppointments={setAppointments} sessions={sessions} settings={settings} setPatients={setPatients} />;
    }
    const filteredApps = role === 'admin' ? appointments : appointments.filter(a => a.assigned_staff_id === currentUserId);

    switch(view) {
      case 'dashboard': return <Dashboard patients={patients} appointments={filteredApps} onNavigate={setView} role={role} staffName={currentUser?.name} />;
      case 'patients': return <PatientsView patients={patients} setPatients={setPatients} notifications={notifications} setNotifications={setNotifications} sessions={sessions} role={role} />;
      case 'appointments': return <AppointmentsView appointments={appointments} setAppointments={setAppointments} patients={patients} notifications={notifications} setNotifications={setNotifications} role={role} currentStaffId={currentUserId} staff={staff} />;
      case 'sessions': return <SessionsView sessions={sessions} setSessions={setSessions} patients={patients} appointments={appointments} setAppointments={setAppointments} role={role} currentStaffId={currentUserId} settings={settings} staff={staff} />;
      case 'notifications': return <NotificationsView notifications={notifications} patients={patients} />;
      case 'settings': return <SettingsView settings={settings} setSettings={setSettings} staff={staff} setStaff={setStaff} role={role} />;
      case 'photos': return <PhotosView patients={patients} settings={settings} role={role} currentStaffId={currentUserId} />;
      default: return <Dashboard patients={patients} appointments={filteredApps} onNavigate={setView} role={role} />;
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
