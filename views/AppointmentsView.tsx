
import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, UserCheck, XCircle, Send, Plus, User, Trash2, Check } from 'lucide-react';
import { Appointment, Patient, Notification, UserRole, ClinicStaff, CLINIC_TREATMENTS } from '../types';
import { generateAppointmentReminder } from '../services/geminiService';

interface AppointmentsViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  patients: Patient[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  role: UserRole;
  currentStaffId: string;
  staff: ClinicStaff[];
}

const AppointmentsView: React.FC<AppointmentsViewProps> = ({ 
  appointments, setAppointments, patients, notifications, setNotifications, role, currentStaffId, staff 
}) => {
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [verificationData, setVerificationData] = useState({ staffId: '', dateTime: '' });
  
  const [newAppData, setNewAppData] = useState({
    patientId: '',
    type: '',
    dateTime: '',
    staffId: ''
  });

  // Role Filtering: Only Admin sees everything. Doctors see their own confirmed appointments.
  // Pending suggestions are only seen by Admin unless specified otherwise by logic.
  const displayedAppointments = (role === 'admin') 
    ? appointments 
    : appointments.filter(a => a.assignedStaffId === currentStaffId && a.status !== 'pending');

  const checkConflict = (staffId: string, newTime: string, currentAppId?: string) => {
    const newDate = new Date(newTime);
    const overlapLimit = 60 * 60 * 1000; // 1 hour in ms

    const conflict = appointments.find(a => {
      if (a.id === currentAppId) return false;
      if (a.assignedStaffId !== staffId || (a.status !== 'scheduled' && a.status !== 'completed')) return false;
      
      const appDate = new Date(a.dateTime);
      const diff = Math.abs(newDate.getTime() - appDate.getTime());
      return diff < overlapLimit;
    });

    if (conflict) {
      const diffMinutes = Math.floor(Math.abs(new Date(conflict.dateTime).getTime() - newDate.getTime()) / 60000);
      return `Warning: ${diffMinutes} minutes from another appointment with this staff. Proceed anyway?`;
    }
    return null;
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      alert("Only the Main Admin can schedule new appointments.");
      return;
    }

    const patient = patients.find(p => p.id === newAppData.patientId);
    if (!patient) return;

    const conflictMsg = checkConflict(newAppData.staffId, newAppData.dateTime);
    if (conflictMsg && !window.confirm(conflictMsg)) return;

    const appId = crypto.randomUUID();
    const newApp: Appointment = {
      id: appId,
      patientId: newAppData.patientId,
      dateTime: newAppData.dateTime,
      type: newAppData.type,
      status: 'scheduled',
      isVerified: true,
      assignedStaffId: newAppData.staffId
    };

    setAppointments(prev => [newApp, ...prev]);

    const confirmNote: Notification = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      appointmentId: appId,
      type: 'verification_confirm',
      channel: 'WhatsApp',
      content: `Your appointment for ${newAppData.type} has been scheduled for ${new Date(newAppData.dateTime).toLocaleString()}. We look forward to seeing you!`,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    const reminder24Content = await generateAppointmentReminder(patient, newAppData.dateTime, "24 hours");
    const reminder2Content = await generateAppointmentReminder(patient, newAppData.dateTime, "2 hours");

    setNotifications(prev => [
      confirmNote,
      { id: crypto.randomUUID(), patientId: patient.id, appointmentId: appId, type: 'reminder_24h', channel: 'WhatsApp', content: reminder24Content, sentAt: 'Scheduled (Auto)', status: 'pending' },
      { id: crypto.randomUUID(), patientId: patient.id, appointmentId: appId, type: 'reminder_2h', channel: 'WhatsApp', content: reminder2Content, sentAt: 'Scheduled (Auto)', status: 'pending' },
      ...prev
    ]);

    setIsAdding(false);
    setNewAppData({ patientId: '', type: '', dateTime: '', staffId: '' });
  };

  const handleVerify = async (appId: string, isModified: boolean) => {
    if (role !== 'admin') {
      alert("Only the Main Admin can verify appointments.");
      return;
    }

    const app = appointments.find(a => a.id === appId);
    const patient = patients.find(p => p.id === app?.patientId);
    if (!app || !patient) return;

    const finalDateTime = isModified ? verificationData.dateTime : app.dateTime;
    const finalStaffId = verificationData.staffId;

    if (!finalStaffId) {
      alert("Please assign a doctor/master.");
      return;
    }

    const conflictMsg = checkConflict(finalStaffId, finalDateTime, appId);
    if (conflictMsg && !window.confirm(conflictMsg)) return;

    const updatedApp: Appointment = {
      ...app,
      dateTime: finalDateTime,
      assignedStaffId: finalStaffId,
      status: 'scheduled',
      isVerified: true
    };

    setAppointments(prev => prev.map(a => a.id === appId ? updatedApp : a));

    let msgContent = isModified 
      ? `The time you have chosen is full, your new appointment is ${new Date(finalDateTime).toLocaleString()}, please send تایید so we can fix your new appointment.`
      : `Your appointment for ${app.type} has been fixed for ${new Date(finalDateTime).toLocaleString()}. See you soon!`;

    const verificationNote: Notification = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      appointmentId: appId,
      type: isModified ? 'verification_request' : 'verification_confirm',
      channel: 'WhatsApp',
      content: msgContent,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    const reminder24Content = await generateAppointmentReminder(patient, finalDateTime, "24 hours");
    const reminder2Content = await generateAppointmentReminder(patient, finalDateTime, "2 hours");

    setNotifications(prev => [
      verificationNote,
      { id: crypto.randomUUID(), patientId: patient.id, appointmentId: appId, type: 'reminder_24h', channel: 'WhatsApp', content: reminder24Content, sentAt: 'Scheduled (Auto)', status: 'pending' },
      { id: crypto.randomUUID(), patientId: patient.id, appointmentId: appId, type: 'reminder_2h', channel: 'WhatsApp', content: reminder2Content, sentAt: 'Scheduled (Auto)', status: 'pending' },
      ...prev
    ]);
    setVerifyingId(null);
  };

  const handleReject = (appId: string) => {
    if (role !== 'admin') {
      alert("Only the Main Admin can reject/delete appointments.");
      return;
    }
    if (!window.confirm("Delete this pending suggestion? It will remain grayed out for records.")) return;
    
    const app = appointments.find(a => a.id === appId);
    if (!app) return;

    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected', isVerified: false } : a));

    const rejectionNote: Notification = {
      id: crypto.randomUUID(),
      patientId: app.patientId,
      appointmentId: appId,
      type: 'rejection',
      channel: 'WhatsApp',
      content: `Unfortunately, your suggested appointment time for ${app.type} could not be accommodated. Please suggest another time through the portal.`,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    setNotifications(prev => [rejectionNote, ...prev]);
  };

  const handleCancel = (appId: string) => {
    if (role !== 'admin') {
      alert("Only the Main Admin can cancel scheduled appointments.");
      return;
    }
    if (!window.confirm("Cancel this appointment? A message will be sent to the patient and reminders will be removed.")) return;
    
    const app = appointments.find(a => a.id === appId);
    if (!app) return;

    setAppointments(prev => prev.map(a => a.id === appId ? { ...a, status: 'cancelled' } : a));
    
    setNotifications(prev => prev.filter(n => n.appointmentId !== appId || n.status === 'sent'));
    
    const cancelNote: Notification = {
      id: crypto.randomUUID(),
      patientId: app.patientId,
      appointmentId: appId,
      type: 'rejection', 
      channel: 'WhatsApp',
      content: `Your scheduled appointment for ${app.type} on ${new Date(app.dateTime).toLocaleString()} has been cancelled by the clinic. We apologize for the inconvenience.`,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    setNotifications(prev => [cancelNote, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Clinic Schedule</h2>
          <p className="text-slate-500 font-medium">
            {role === 'admin' ? "Full control over all patient visits and staff rotations." : "Review your personal schedule and verified visits."}
          </p>
        </div>
        {role === 'admin' && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
          >
            <Plus size={20} />
            <span>Schedule New Visit</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl animate-in zoom-in duration-300 border border-slate-100 overflow-hidden">
            <form onSubmit={handleCreateAppointment} className="p-10 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Schedule New Visit</h3>
                <button type="button" onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-800 transition-colors">&times;</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Patient</label>
                  <select 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium"
                    value={newAppData.patientId}
                    onChange={e => setNewAppData({...newAppData, patientId: e.target.value})}
                  >
                    <option value="">Choose patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Treatment Type</label>
                  <select 
                    required 
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium"
                    value={newAppData.type}
                    onChange={e => setNewAppData({...newAppData, type: e.target.value})}
                  >
                    <option value="">Select service...</option>
                    {CLINIC_TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date & Time</label>
                    <input 
                      required 
                      type="datetime-local" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium"
                      value={newAppData.dateTime}
                      onChange={e => setNewAppData({...newAppData, dateTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Doctor</label>
                    <select 
                      required 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-medium"
                      value={newAppData.staffId}
                      onChange={e => setNewAppData({...newAppData, staffId: e.target.value})}
                    >
                      <option value="">Select doctor...</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-600 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                  Fix Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Appointment Time</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff / Service</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayedAppointments.map(app => {
              const patient = patients.find(p => p.id === app.patientId);
              const assignedStaff = staff.find(s => s.id === app.assignedStaffId);
              const isVerifying = verifyingId === app.id;
              const isDead = app.status === 'cancelled' || app.status === 'rejected';

              return (
                <tr key={app.id} className={`transition-all ${app.status === 'pending' ? 'bg-amber-50/40' : ''} ${isDead ? 'opacity-25 grayscale' : 'hover:bg-slate-50/80'}`}>
                  <td className="px-8 py-5">
                    <div className={`font-bold text-slate-800 ${isDead ? 'line-through blur-[0.5px]' : ''}`}>{patient?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-slate-400 font-medium tracking-tight">{patient?.phone}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`flex flex-col ${isDead ? 'line-through blur-[0.5px]' : ''}`}>
                      <span className="text-sm font-bold text-slate-700">{new Date(app.dateTime).toLocaleDateString()}</span>
                      <span className="text-[10px] text-slate-500 font-medium uppercase">{new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`space-y-1.5 ${isDead ? 'line-through blur-[0.5px]' : ''}`}>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${isDead ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                        {app.type}
                      </span>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-bold">
                        <UserCheck size={12} className="text-slate-300" /> {assignedStaff?.name || 'Unassigned'}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        app.status === 'scheduled' ? 'bg-green-50 text-green-600 border border-green-100' :
                        app.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse' :
                        app.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {app.status === 'scheduled' ? <CheckCircle size={10} /> : app.status === 'pending' ? <Clock size={10} /> : <AlertCircle size={10} />}
                        {app.status}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {!isDead ? (
                      app.status === 'pending' ? (
                        isVerifying ? (
                          <div className="flex flex-col gap-3 min-w-[240px] animate-in slide-in-from-right-4 bg-white p-5 rounded-3xl shadow-2xl border border-slate-100 opacity-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Verify Suggestion</p>
                            <input 
                              type="datetime-local" 
                              className="text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={e => setVerificationData({...verificationData, dateTime: e.target.value})}
                            />
                            <select 
                              required
                              className="text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={e => setVerificationData({...verificationData, staffId: e.target.value})}
                            >
                              <option value="">Assign Doctor...</option>
                              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <div className="flex gap-2 justify-end pt-2">
                              <button onClick={() => setVerifyingId(null)} className="px-3 py-2 text-slate-400 hover:text-red-500 font-bold text-xs uppercase">Cancel</button>
                              <button 
                                disabled={role !== 'admin'}
                                onClick={() => handleVerify(app.id, !!verificationData.dateTime)}
                                className="px-4 py-2 bg-green-600 text-white text-[10px] font-black rounded-xl shadow-md shadow-green-100 uppercase tracking-widest disabled:opacity-50"
                              >Approve</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <button 
                              disabled={role !== 'admin'}
                              onClick={() => handleReject(app.id)}
                              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                              title="Delete Suggestion"
                            ><Trash2 size={18} /></button>
                            <button 
                              disabled={role !== 'admin'}
                              onClick={() => setVerifyingId(app.id)}
                              className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                              <Check size={14} /> Handle & Approve
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-3 justify-end">
                          {(app.status === 'scheduled') && role === 'admin' && (
                            <button 
                              onClick={() => handleCancel(app.id)}
                              className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                              title="Cancel Appointment"
                            >
                              <XCircle size={14} /> Cancel Visit
                            </button>
                          )}
                          <span className="text-[10px] font-black text-slate-300 flex items-center gap-1.5 uppercase tracking-widest">
                            {app.isVerified ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} />}
                            {app.status === 'completed' ? 'Logged' : 'Active'}
                          </span>
                        </div>
                      )
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 italic uppercase tracking-widest">Archived Record</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayedAppointments.length === 0 && (
          <div className="text-center py-28 bg-slate-50/30">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Queue is empty</p>
            <p className="text-slate-300 text-sm mt-1">Assignments appear here once verified.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsView;
