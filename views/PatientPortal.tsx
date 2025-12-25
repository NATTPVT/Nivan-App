
import React, { useState } from 'react';
import { Calendar, Sparkles, History, Send, CheckCircle2, Clock, MapPin, UserCheck, Camera, Upload, Trash2, AlertCircle, EyeOff } from 'lucide-react';
import { Patient, Appointment, SessionRecord, ClinicSettings, CLINIC_TREATMENTS } from '../types';
import { consultPatientAI } from '../services/geminiService';

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
    const result = await consultPatientAI(concern);
    setConsultResult(result);
    setLoading(false);
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    
    const newApp: Appointment = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      dateTime: `${bookingData.date}T${bookingData.time}`,
      type: bookingData.treatment,
      status: 'pending',
      isVerified: false
    };

    setAppointments(prev => [newApp, ...prev]);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveTab('history');
    }, 2000);
  };

  const handlePhotoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    const newPhoto = {
      id: crypto.randomUUID(),
      url: `https://picsum.photos/seed/${Math.random()}/400/300`, // Simulated upload
      timestamp: new Date().toISOString(),
      note: photoNote
    };

    setPatients(prev => prev.map(p => 
      p.id === patient.id 
      ? { ...p, photos: [...(p.photos || []), newPhoto] } 
      : p
    ));
    setPhotoNote('');
    alert("Photo uploaded for distance consultation!");
  };

  if (!patient) return <div className="text-center py-20">Profile not found.</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Hello, {patient.name.split(' ')[0]}</h2>
          <p className="text-slate-500 font-medium">Your personalized care portal at MedPulse.</p>
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
        {activeTab === 'consult' && (
          <div className="bg-white p-10 rounded-[32px] shadow-xl border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 shadow-inner">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">Intelligent Treatment Advisor</h3>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Powered by Gemini Pro</p>
              </div>
            </div>
            
            {!settings.aiConsultationEnabled ? (
              <div className="p-8 bg-slate-50 rounded-3xl text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium italic">The AI advisor is currently offline. Please use the booking tab to schedule a physical consultation.</p>
              </div>
            ) : (
              <form onSubmit={handleConsult} className="space-y-6">
                <p className="text-slate-600 leading-relaxed text-lg">Tell us about your aesthetic goals or concerns. Our medical AI will help you navigate our services.</p>
                <textarea 
                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none h-40 transition-all text-slate-700 text-lg shadow-inner"
                  placeholder="Example: I'm noticing fine lines around my eyes and would like a refreshed look..."
                  value={concern}
                  onChange={e => setConcern(e.target.value)}
                />
                <button 
                  disabled={loading || !concern}
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white rounded-3xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100 text-lg"
                >
                  {loading ? 'Consulting Experts...' : <><Send size={22} /> Analyze & Recommend</>}
                </button>
              </form>
            )}

            {consultResult && (
              <div className="mt-10 p-8 bg-blue-50 rounded-[32px] border border-blue-100 animate-in zoom-in duration-500">
                <h4 className="font-bold text-blue-900 text-xl mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-blue-500" />
                  Your AI Clinical Assessment
                </h4>
                <p className="text-blue-800 text-lg leading-relaxed">{consultResult}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'book' && (
          <div className="max-w-3xl mx-auto bg-white p-10 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <Clock className="text-blue-600" /> Suggest Your Visit Time
            </h3>
            
            {bookingSuccess ? (
              <div className="text-center py-16 space-y-6">
                <div className="mx-auto w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-800">Suggestion Received!</h4>
                  <p className="text-slate-500 text-lg">The clinic will review your time and confirm via WhatsApp shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Preferred Treatment</label>
                    <select 
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={bookingData.treatment}
                      onChange={e => setBookingData({...bookingData, treatment: e.target.value})}
                    >
                      <option value="">Select a service...</option>
                      {CLINIC_TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                      <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Time</label>
                      <input required type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                  <AlertCircle className="text-blue-600 mt-1" size={20} />
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">Note: This is a suggested time. The clinic will either verify this slot or suggest an alternative if it's full.</p>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 text-lg transition-transform hover:-translate-y-1">
                  Submit Suggestion
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="bg-white p-10 rounded-[32px] shadow-xl border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <Camera className="text-blue-600" /> Distance Consultation (Photos)
            </h3>

            {!settings.photoConsultationEnabled ? (
              <div className="p-12 bg-slate-50 rounded-3xl text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium italic">Photo consultations are currently disabled by the clinic.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handlePhotoUpload} className="space-y-6">
                  <div className="p-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-slate-100 transition-colors">
                    <div className="bg-white p-4 rounded-full shadow-md group-hover:scale-110 transition-transform mb-4">
                      <Upload className="text-blue-600" />
                    </div>
                    <p className="text-slate-700 font-bold text-lg">Upload Medical Photo</p>
                    <p className="text-slate-400 text-sm">JPG, PNG up to 10MB</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Additional Notes for Doctor</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 h-24"
                      placeholder="Mention specific areas of concern in this photo..."
                      value={photoNote}
                      onChange={e => setPhotoNote(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all">Send to Clinic</button>
                </form>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Uploaded Photos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {patient.photos?.map(photo => (
                      <div key={photo.id} className="relative group rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-square">
                        <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-[10px] text-white font-bold p-2 text-center">{photo.note}</p>
                        </div>
                      </div>
                    ))}
                    {(!patient.photos || patient.photos.length === 0) && (
                      <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-slate-400 text-sm font-medium">No photos uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-10">
            <h3 className="text-2xl font-bold text-slate-800">Your Medical History</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> Planned Visits
                </h4>
                {myAppointments.map(app => (
                  <div key={app.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${app.isVerified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {app.isVerified ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{app.type}</p>
                        <p className="text-sm text-slate-500 font-medium">
                          {new Date(app.dateTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${app.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {app.isVerified ? 'Verified' : 'Suggested'}
                    </span>
                  </div>
                ))}
                {myAppointments.length === 0 && <p className="text-slate-400 italic text-sm">No appointments history.</p>}
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Treatment Logs
                </h4>
                {mySessions.map(session => {
                  const hasHiddenPart = !settings.patientVisibility.summary || !settings.patientVisibility.results || !settings.patientVisibility.careInstructions;
                  return (
                    <div key={session.id} className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                          Visit Logged
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-slate-800 text-xl">{session.treatmentType}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Doctor</span>
                            <p className="text-sm text-slate-700 font-bold">{session.doctorId}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                            <p className="text-sm text-emerald-600 font-bold">Recorded</p>
                          </div>
                        </div>

                        {settings.patientVisibility.summary ? (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Session Summary</span>
                             <p className="text-sm text-slate-700 mt-1">{session.summary}</p>
                          </div>
                        ) : <div className="p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-[10px] text-amber-600 font-bold uppercase tracking-widest"><EyeOff size={12}/> Summary Restricted</div>}

                        {settings.patientVisibility.results ? (
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Results</span>
                             <p className="text-sm text-slate-700 mt-1 font-medium">{session.results}</p>
                          </div>
                        ) : <div className="p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-[10px] text-amber-600 font-bold uppercase tracking-widest"><EyeOff size={12}/> Results Restricted</div>}

                        {settings.patientVisibility.careInstructions ? (
                          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                            <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-2 mb-2">
                              <Sparkles size={12} /> Post-Session Care
                            </span>
                            <p className="text-sm text-blue-700 whitespace-pre-wrap font-medium">{session.careInstructions}</p>
                          </div>
                        ) : <div className="p-3 bg-amber-50 rounded-xl flex items-center gap-2 text-[10px] text-amber-600 font-bold uppercase tracking-widest"><EyeOff size={12}/> Instructions Restricted</div>}
                      </div>
                    </div>
                  );
                })}
                {mySessions.length === 0 && <p className="text-slate-400 italic text-sm">No recorded sessions yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPortal;
