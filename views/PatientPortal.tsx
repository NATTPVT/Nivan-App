import React, { useState } from 'react';
import { Calendar, Sparkles, History, Send, CheckCircle2, Clock, MapPin, UserCheck, Camera, Upload, Trash2, AlertCircle, EyeOff } from 'lucide-react';
import { Patient, Appointment, SessionRecord, ClinicSettings, CLINIC_TREATMENTS } from '../types';
import { consultPatientAI } from '../services/geminiService';
import { supabase } from '../supabaseClient'; // Ensure this is imported

interface PatientPortalProps {
  patient: Patient | null;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  sessions: SessionRecord[];
  settings: ClinicSettings;
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ patient, appointments, setAppointments, sessions, settings, setPatients }) => {
  const [activeTab, setActiveTab] = useState<'consult' | 'book' | 'history' | 'photos'>('consult');
  const [concern, setConcern] = useState('');
  const [consultResult, setConsultResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [bookingData, setBookingData] = useState({ treatment: '', date: '', time: '' });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [photoNote, setPhotoNote] = useState('');

  const myAppointments = appointments.filter(a => a.patientId === patient?.id && a.status !== 'rejected');
  const mySessions = sessions.filter(s => s.patientId === patient?.id);

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concern.trim()) return;
    setLoading(true);
    // This calls your Gemini service - results remain in state (not DB) as requested
    const result = await consultPatientAI(concern);
    setConsultResult(result);
    setLoading(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    
    const newApp = {
      id: crypto.randomUUID(),
      patient_id: patient.id, // Supabase uses snake_case
      date_time: `${bookingData.date}T${bookingData.time}`,
      type: bookingData.treatment,
      status: 'pending'
    };

    // Save to Supabase
    const { error } = await supabase.from('appointments').insert([newApp]);

    if (!error) {
      setAppointments(prev => [{
        id: newApp.id,
        patientId: newApp.patient_id,
        dateTime: newApp.date_time,
        type: newApp.type,
        status: 'pending',
        isVerified: false
      }, ...prev]);
      
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setActiveTab('history');
      }, 2000);
    }
  };

  if (!patient) return <div className="text-center py-20 font-bold text-slate-400">Profile not found.</div>;

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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
        {/* --- AI CONSULTATION TAB --- */}
        {activeTab === 'consult' && (
          <div className="bg-white p-10 rounded-[32px] shadow-xl border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 shadow-inner">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Intelligent Treatment Advisor</h3>
                <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Service & Goal Alignment</p>
              </div>
            </div>
            
            {/* Check specifically for Patient AI Toggle */}
            {!settings.aiPatientEnabled ? (
              <div className="p-12 bg-slate-50 rounded-[32px] text-center border-2 border-dashed border-slate-200">
                <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4">
                  <EyeOff size={32} />
                </div>
                <p className="text-slate-500 font-bold text-lg">AI Consultant is currently offline.</p>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Please use the 'Suggest Time' tab to book a physical assessment with our clinicians.</p>
              </div>
            ) : (
              <form onSubmit={handleConsult} className="space-y-6">
                <p className="text-slate-600 leading-relaxed text-lg font-medium">Describe your aesthetic goals. Our AI will recommend the most effective services from our clinic.</p>
                <textarea 
                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none h-40 transition-all text-slate-700 text-lg shadow-inner font-medium"
                  placeholder="I want to improve skin texture and reduce redness..."
                  value={concern}
                  onChange={e => setConcern(e.target.value)}
                />
                <button 
                  disabled={loading || !concern}
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-3xl font-black hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100 text-lg uppercase tracking-widest"
                >
                  {loading ? 'Analyzing Services...' : <><Send size={22} /> Get Recommendation</>}
                </button>
              </form>
            )}

            {consultResult && settings.aiPatientEnabled && (
              <div className="mt-10 p-8 bg-blue-50 rounded-[32px] border border-blue-100 animate-in zoom-in duration-500">
                <h4 className="font-black text-blue-900 text-xl mb-4 flex items-center gap-2 uppercase tracking-tight">
                  <CheckCircle2 className="text-blue-500" /> Suggested Protocol
                </h4>
                <p className="text-blue-800 text-lg leading-relaxed font-medium whitespace-pre-wrap">{consultResult}</p>
              </div>
            )}
          </div>
        )}

        {/* --- BOOKING TAB --- */}
        {activeTab === 'book' && (
          <div className="max-w-3xl mx-auto bg-white p-10 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3 tracking-tight uppercase">
              <Clock className="text-blue-600" /> Suggest Visit Time
            </h3>
            
            {bookingSuccess ? (
              <div className="text-center py-16 animate-in fade-in">
                <div className="mx-auto w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h4 className="text-2xl font-black text-slate-800">Sent to Clinic</h4>
                <p className="text-slate-500 font-medium">We will verify this slot and notify you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Treatment Type</label>
                    <select 
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      value={bookingData.treatment}
                      onChange={e => setBookingData({...bookingData, treatment: e.target.value})}
                    >
                      <option value="">Choose Service...</option>
                      {CLINIC_TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                      <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                      <input required type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})} />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-transform hover:-translate-y-1">
                  Submit Suggestion
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- PHOTO CONSULT TAB --- */}
        {activeTab === 'photos' && (
          <div className="bg-white p-10 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3 tracking-tight uppercase">
              <Camera className="text-blue-600" /> Remote Diagnostics
            </h3>

            {!settings.photoConsultationEnabled ? (
              <div className="p-12 bg-slate-50 rounded-[32px] text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-bold italic">Photo-based consultation is currently disabled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="p-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer">
                  <Upload className="text-blue-600 mb-4" size={40} />
                  <p className="text-slate-800 font-black">Upload Case Photos</p>
                  <p className="text-slate-400 text-xs mt-2 uppercase font-bold tracking-tighter text-wrap">Secured medical-grade encryption applied</p>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Uploads</h4>
                   <div className="grid grid-cols-2 gap-4">
                      {patient.photos?.map(p => (
                        <img key={p.id} src={p.url} className="rounded-2xl border border-slate-200 aspect-square object-cover" />
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- RECORDS TAB --- */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Appointments Column */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Calendar size={14} /> Scheduled Visits
              </h4>
              {myAppointments.map(app => (
                <div key={app.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${app.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {app.isVerified ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg tracking-tight">{app.type}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">{new Date(app.dateTime).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${app.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {app.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            {/* Session Logs Column */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <History size={14} /> Clinical Logs
              </h4>
              {mySessions.map(session => (
                <div key={session.id} className="bg-white p-8 rounded-[32px] shadow-md border border-slate-50 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="font-black text-slate-800 text-xl tracking-tight">{session.treatmentType}</p>
                    <div className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Official Record</div>
                  </div>

                  <div className="space-y-4">
                    {/* Summary visibility check */}
                    {settings.patientVisibility.summary ? (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Summary</span>
                        <p className="text-sm text-slate-700 mt-1 font-medium">{session.summary}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50/50 rounded-2xl flex items-center gap-3 text-slate-300 italic text-xs">
                        <EyeOff size={14} /> Summary hidden by clinic
                      </div>
                    )}

                    {/* Results visibility check */}
                    {settings.patientVisibility.results ? (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observation Results</span>
                        <p className="text-sm text-slate-700 mt-1 font-medium">{session.results}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50/50 rounded-2xl flex items-center gap-3 text-slate-300 italic text-xs">
                        <EyeOff size={14} /> Detailed results restricted
                      </div>
                    )}

                    {/* Care Instructions visibility check */}
                    {settings.patientVisibility.careInstructions ? (
                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-2 mb-2 tracking-widest">
                          <Sparkles size={12} /> Post-Session Protocol
                        </span>
                        <p className="text-sm text-emerald-800 whitespace-pre-wrap font-bold leading-relaxed">{session.careInstructions}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50/50 rounded-2xl flex items-center gap-3 text-slate-300 italic text-xs">
                        <EyeOff size={14} /> After-care plan restricted
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPortal;
