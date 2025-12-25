
import React, { useState } from 'react';
import { History, FileText, BrainCircuit, CalendarCheck, ClipboardList, User, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { SessionRecord, Patient, Appointment, ClinicStaff, UserRole, ClinicSettings } from '../types';
import { generateCareInstructions } from '../services/geminiService';

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
      alert("Please enter session summary and results first.");
      return;
    }
    setLoading(true);
    try {
      const suggested = await generateCareInstructions(newSession.summary, newSession.results);
      setNewSession(prev => ({ ...prev, careInstructions: suggested }));
    } catch (error) {
      console.error("AI Error:", error);
      alert("Failed to generate AI instructions. Please type them manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const app = appointments.find(a => a.id === activeAppId);
    if (!app) {
      alert("Please select a valid scheduled appointment.");
      return;
    }

    const session: SessionRecord = {
      id: crypto.randomUUID(),
      appointmentId: activeAppId,
      patientId: app.patientId,
      doctorId: currentStaffId,
      treatmentType: app.type,
      timestamp: new Date().toISOString(),
      ...newSession
    };

    setSessions(prev => [session, ...prev]);
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Medical Sessions</h2>
          <p className="text-slate-500 font-medium italic">
            {settings.restrictStaffLogs && role !== 'admin' ? "Private View: Only your sessions are visible." : "Comprehensive clinic logs and history."}
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          <FileText size={18} />
          <span>Log New Session</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 border border-slate-100 overflow-hidden">
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Create Clinical Record</h3>
                <button type="button" onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-800 text-3xl font-light">&times;</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Link to Appointment</label>
                  <select 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700"
                    value={activeAppId}
                    onChange={e => setActiveAppId(e.target.value)}
                  >
                    <option value="">Select current scheduled visit...</option>
                    {eligibleApps.map(app => {
                      const patient = patients.find(p => p.id === app.patientId);
                      return (
                        <option key={app.id} value={app.id}>
                          {patient?.name} - {app.type} ({new Date(app.dateTime).toLocaleDateString()})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Clinical Summary</label>
                    <textarea 
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium h-32"
                      placeholder="Describe what happened during the session..."
                      value={newSession.summary}
                      onChange={e => setNewSession({...newSession, summary: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Treatment Results</label>
                    <textarea 
                      required
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium h-32"
                      placeholder="Medical results, observations, settings used..."
                      value={newSession.results}
                      onChange={e => setNewSession({...newSession, results: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Post-Session Care Instructions</label>
                    <button 
                      type="button"
                      onClick={handleAISuggestCare}
                      disabled={loading || !newSession.summary}
                      className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50"
                    >
                      <BrainCircuit size={14} /> {loading ? 'Synthesizing...' : 'AI Suggestion'}
                    </button>
                  </div>
                  <textarea 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium h-24"
                    placeholder="Instructions for the patient to follow at home..."
                    value={newSession.careInstructions}
                    onChange={e => setNewSession({...newSession, careInstructions: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Recommended Next Visit (Optional)</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold"
                    value={newSession.nextSessionDate}
                    onChange={e => setNewSession({...newSession, nextSessionDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-600 font-black border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest text-xs">
                  Finalize Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {filteredSessions.map(session => {
          const patient = patients.find(p => p.id === session.patientId);
          const practitioner = staff.find(s => s.id === session.doctorId);
          return (
            <div key={session.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black shadow-sm">
                    {patient?.name[0] || 'P'}
                  </div>
                  <div>
                    <span className="font-black text-slate-800 text-xl tracking-tight">{patient?.name || 'Unknown Patient'}</span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{session.treatmentType}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-5">
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100/50">
                    <User size={14} /> {practitioner?.name || 'Clinic Doctor'}
                  </div>
                  <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-inner">
                      <ClipboardList className="text-indigo-400" size={24} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Summary</h4>
                      <p className="text-slate-600 font-medium leading-relaxed">{session.summary}</p>
                    </div>
                  </div>
                  <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-inner">
                      <CheckCircle2 className="text-emerald-400" size={24} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Results</h4>
                      <p className="text-slate-600 font-medium leading-relaxed">{session.results}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="text-blue-500" size={20} />
                      <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Home Care Instructions</h4>
                    </div>
                    <div className="text-blue-800 text-sm font-bold whitespace-pre-wrap leading-relaxed">
                      {session.careInstructions}
                    </div>
                  </div>
                  {session.nextSessionDate && (
                    <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <CalendarCheck className="text-indigo-400" size={20} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-up Recommended</p>
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
            <p className="text-slate-400 font-black text-lg uppercase tracking-widest">No clinical logs recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsView;
