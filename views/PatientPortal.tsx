import React, { useState } from 'react';
import { Calendar, Sparkles, History, Send, CheckCircle2, Clock, Camera, Upload, EyeOff } from 'lucide-react';
import { Patient, Appointment, SessionRecord, ClinicSettings, CLINIC_TREATMENTS } from '../types';
import { consultPatientAI } from '../services/geminiService';
import { supabase } from '../supabaseClient';

interface PatientPortalProps {
  patient: Patient | null;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  sessions: SessionRecord[];
  settings: ClinicSettings;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ patient, appointments, sessions, settings }) => {
  const [activeTab, setActiveTab] = useState<'consult' | 'book' | 'history' | 'photos'>('consult');
  const [concern, setConcern] = useState('');
  const [consultResult, setConsultResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({ treatment: '', date: '', time: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Filter using snake_case properties
  const myAppointments = appointments.filter(a => a.patient_id === patient?.id && a.status !== 'rejected');
  const mySessions = sessions.filter(s => s.patient_id === patient?.id);

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await consultPatientAI(concern);
    setConsultResult(result);
    setLoading(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    
    // Create correct object for Supabase
    const newAppPayload = {
      id: crypto.randomUUID(),
      patient_id: patient.id,
      date_time: `${bookingData.date}T${bookingData.time}`,
      type: bookingData.treatment,
      status: 'pending',
      is_verified: false
    };

    const { error } = await supabase.from('appointments').insert([newAppPayload]);

    if (error) {
      alert("Booking Failed: " + error.message);
    } else {
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setActiveTab('history');
      }, 2000);
    }
  };

  if (!patient) return <div className="text-center py-20 font-bold text-slate-400">Loading Profile...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Hello, {patient.name.split(' ')[0]}</h2>
          <p className="text-slate-500 font-medium">Your personalized care portal.</p>
        </div>
        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1">
          {[
            { id: 'consult', label: 'AI Clinic', icon: Sparkles },
            { id: 'book', label: 'Suggest Time', icon: Calendar },
            { id: 'photos', label: 'Distance Consult', icon: Camera },
            { id: 'history', label: 'My Records', icon: History },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <tab.icon size={16} /> <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'consult' && (
          <div className="bg-white p-10 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Sparkles className="text-blue-600"/> AI Treatment Advisor</h3>
            {!settings.aiPatientEnabled ? (
              <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-400 font-bold">AI Consultation is currently disabled.</div>
            ) : (
              <form onSubmit={handleConsult} className="space-y-6">
                <textarea className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl h-40 font-medium outline-none focus:ring-4 focus:ring-blue-50" placeholder="Describe your skin goals..." value={concern} onChange={e => setConcern(e.target.value)} />
                <button disabled={loading || !concern} type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
                  {loading ? 'Analyzing...' : 'Get Recommendation'}
                </button>
              </form>
            )}
            {consultResult && <div className="mt-8 p-6 bg-blue-50 rounded-2xl text-blue-900 font-medium leading-relaxed whitespace-pre-wrap">{consultResult}</div>}
          </div>
        )}

        {activeTab === 'book' && (
          <div className="max-w-3xl mx-auto bg-white p-10 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-8"><Clock className="inline mr-2 text-blue-600"/> Suggest Visit Time</h3>
            {bookingSuccess ? (
              <div className="text-center py-10 text-emerald-600 font-black text-xl"><CheckCircle2 className="mx-auto mb-4" size={48}/>Request Sent!</div>
            ) : (
              <form onSubmit={handleBook} className="space-y-6">
                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={bookingData.treatment} onChange={e => setBookingData({...bookingData, treatment: e.target.value})}>
                  <option value="">Select Service...</option>
                  {CLINIC_TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                  <input required type="time" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100">Submit Request</button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800">My Appointments</h3>
            {myAppointments.map(app => (
              <div key={app.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-black text-slate-800">{app.type}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">{new Date(app.date_time).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${app.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {app.is_verified ? 'Confirmed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPortal;
