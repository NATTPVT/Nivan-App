import React, { useState } from 'react';
import { History, FileText, BrainCircuit, CalendarCheck, ClipboardList, User, ShieldAlert, Sparkles, CheckCircle2, EyeOff } from 'lucide-react';
import { SessionRecord, Patient, Appointment, ClinicStaff, UserRole, ClinicSettings } from '../types';
import { generateCareInstructions } from '../services/geminiService';
import { supabase } from '../supabaseClient';

interface SessionsViewProps {
  sessions: SessionRecord[];
  setSessions: React.Dispatch<React.SetStateAction<SessionRecord[]>>;
  patients: Patient[];
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  role: UserRole;
  currentStaffId: string;
  settings: ClinicSettings;
  staff: ClinicStaff[];
}

const SessionsView: React.FC<SessionsViewProps> = ({ 
  sessions, setSessions, patients, appointments, setAppointments, role, currentStaffId, settings, staff 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAppId, setActiveAppId] = useState('');
  const [newSession, setNewSession] = useState({ 
    summary: '', 
    results: '', 
    nextSessionDate: '', 
    careInstructions: '' 
  });

  // Access Control: Filter logs if restricted
  const filteredSessions = (role === 'admin' || !settings.restrictStaffLogs) 
    ? sessions 
    : sessions.filter(s => s.doctorId === currentStaffId);

  const handleAISuggestCare = async () => {
    if (!newSession.summary || !newSession.results) {
      alert("Please enter session summary and results first so the AI has context.");
      return;
    }
    setLoading(true);
    try {
      const suggested = await generateCareInstructions(newSession.summary, newSession.results);
      setNewSession(prev => ({ ...prev, careInstructions: suggested }));
    } catch (error) {
      console.error("AI Error:", error);
      alert("Failed to connect to Gemini. Please type instructions manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const app = appointments.find(a => a.id === activeAppId);
    if (!app) {
      alert("Please select a valid scheduled appointment.");
      return;
    }

    const sessionData = {
      id: crypto.randomUUID(),
      appointment_id: activeAppId,
      patient_id: app.patientId,
      doctor_id: currentStaffId,
      treatment_type: app.type,
      summary: newSession.summary,
      results: newSession.results,
      care_instructions: newSession.careInstructions,
      next_session_date: newSession.nextSessionDate || null,
      timestamp: new Date().toISOString()
    };

    // 1. Save Session to Supabase
    const { error: sessionError } = await supabase.from('sessions').insert([sessionData]);

    if (sessionError) {
      alert("Error saving session: " + sessionError.message);
      return;
    }

    // 2. Update Appointment Status to 'completed' in Supabase
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', activeAppId);

    // 3. Update Local State
    const sessionRecord: SessionRecord = {
      id: sessionData.id,
      appointmentId: sessionData.appointment_id,
      patientId: sessionData.patient_id,
      doctorId: sessionData.doctor_id,
      treatmentType: sessionData.treatment_type,
      timestamp: sessionData.timestamp,
      summary: sessionData.summary,
      results: sessionData.results,
      careInstructions: sessionData.care_instructions,
      nextSessionDate: sessionData.next_session_date || undefined
    };

    setSessions(prev => [sessionRecord, ...prev]);
    setAppointments(prev => prev.map(a => a.id === activeAppId ? { ...a, status: 'completed' } : a));
    
    setIsAdding(false);
    setNewSession({ summary: '', results: '', nextSessionDate: '', careInstructions: '' });
    setActiveAppId('');
  };

  const eligibleApps = appointments.filter(a => 
    a.status === 'scheduled' && 
    (role === 'admin' || a.assignedStaffId === currentStaffId)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Clinical Records</h2>
          <p className="text-slate-500 font-medium">
            {settings.restrictStaffLogs && role !== 'admin' ? "Showing your private patient logs." : "Full access to clinic treatment history."}
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-xs"
        >
          <FileText size={18} />
          <span>New Treatment Log</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 border border-slate-100 overflow-hidden">
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Log Session</h3>
                <button type="button" onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-800 text-3xl font-light">&times;</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Link Scheduled Appointment</label>
                  <select 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-slate-700"
                    value={activeAppId}
                    onChange={e => setActiveAppId(e.target.value)}
                  >
                    <option value="">Select Appointment...</option>
                    {eligibleApps.map(app => {
                      const patient = patients.find(p => p.id === app.patientId);
                      return (
                        <option key={app.id} value={app.id}>
                          {patient?.name} — {app.type}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Procedure Summary</label>
                    <textarea 
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-medium h-32 text-sm"
                      placeholder="e.g., Patient tolerated laser well..."
                      value={newSession.summary}
                      onChange={e => setNewSession({...newSession, summary: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Clinical Results</label>
                    <textarea 
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-medium h-32 text-sm"
                      placeholder="e.g., Settings used: 15J/cm2..."
                      value={newSession.results}
                      onChange={e => setNewSession({...newSession, results: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Care Instructions</label>
                    
                    {/* Respect Admin AI Settings */}
                    {settings.aiStaffEnabled ? (
                      <button 
                        type="button"
                        onClick={handleAISuggestCare}
                        disabled={loading || !newSession.summary}
                        className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50"
                      >
                        <BrainCircuit size={14} /> {loading ? 'Thinking...' : 'AI Suggestion'}
                      </button>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-300 uppercase italic flex items-center gap-1">
                        <EyeOff size={10} /> AI Assistant Disabled
                      </span>
                    )}
                  </div>
                  <textarea 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-medium h-24 text-sm"
                    placeholder="Provide specific after-care steps..."
                    value={newSession.careInstructions}
                    onChange={e => setNewSession({...newSession, careInstructions: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Planned Follow-up</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold"
                    value={newSession.nextSessionDate}
                    onChange={e => setNewSession({...newSession, nextSessionDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-400 font-black border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-xs">
                  Save Clinical Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SESSIONS LIST --- */}
      <div className="space-y-6">
        {filteredSessions.map(session => {
          const patient = patients.find(p => p.id === session.patientId);
          const practitioner = staff.find(s => s.id === session.doctorId);
          return (
            <div key={session.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-md">
                    {patient?.name[0] || 'P'}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 text-xl tracking-tight uppercase">{patient?.name || 'Unknown Patient'}</span>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{session.treatmentType}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-5">
                  <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-tighter">
                    <User size={14} className="text-indigo-300" /> {practitioner?.name || 'Practitioner'}
                  </div>
                  <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 font-black text-[10px]">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <ClipboardList className="text-slate-400" size={20} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Summary</h4>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">{session.summary}</p>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <CheckCircle2 className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Results</h4>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">{session.results}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="text-indigo-400" size={18} />
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Patient Instructions</h4>
                    </div>
                    <div className="text-indigo-900 text-sm font-bold whitespace-pre-wrap leading-relaxed">
                      {session.careInstructions || "No instructions provided."}
                    </div>
                  </div>
                  {session.nextSessionDate && (
                    <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <CalendarCheck className="text-emerald-500" size={20} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-up Visit</p>
                        <p className="text-sm font-black text-slate-800">{new Date(session.nextSessionDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200">
            <History className="mx-auto text-slate-200 mb-6" size={64} />
            <p className="text-slate-400 font-black text-sm uppercase tracking-[0.3em]">Clear Records: No logs found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsView;
