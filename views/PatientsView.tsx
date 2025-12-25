
import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, Calendar as CalendarIcon, UserPlus, Edit2, Check, X } from 'lucide-react';
import { Patient, Notification, SessionRecord, UserRole } from '../types';
import { generateWelcomeMessage } from '../services/geminiService';

interface PatientsViewProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  sessions: SessionRecord[];
  role: UserRole;
}

const PatientsView: React.FC<PatientsViewProps> = ({ patients, setPatients, notifications, setNotifications, role }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Patient>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', email: '', dob: '', notes: '', password: '123' });
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const id = crypto.randomUUID();
    const patient: Patient = {
      ...newPatient,
      id,
      createdAt: new Date().toISOString(),
    };
    
    setPatients(prev => [patient, ...prev]);

    const welcomeContent = await generateWelcomeMessage(patient);
    setNotifications(prev => [{
      id: crypto.randomUUID(),
      patientId: id,
      type: 'welcome',
      channel: 'WhatsApp',
      content: welcomeContent,
      sentAt: new Date().toISOString(),
      status: 'sent'
    }, ...prev]);

    setNewPatient({ name: '', phone: '', email: '', dob: '', notes: '', password: '123' });
    setIsAdding(false);
    setLoading(false);
  };

  const handleEditSave = (id: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...editData } : p));
    setEditingId(null);
    setEditData({});
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Patient Registry</h2>
          <p className="text-slate-500 font-medium">Manage clinical profiles and intake records.</p>
        </div>
        {role === 'admin' && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
          >
            <UserPlus size={18} />
            <span>Add Intake</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Lookup patients by name or digital identity..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[32px] focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all shadow-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-100">
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">New Intake Registry</h3>
                <button type="button" onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-800 transition-colors text-3xl font-light">&times;</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Identity Name</label>
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phone (WhatsApp)</label>
                    <input required type="tel" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Password</label>
                    <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold" value={newPatient.password} onChange={e => setNewPatient({...newPatient, password: e.target.value})} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">Age and Email can be finalized later by medical staff.</p>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-600 font-black border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button disabled={loading} type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs">
                  {loading ? 'Synthesizing...' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredPatients.map(patient => {
          const isEditing = editingId === patient.id;
          return (
            <div key={patient.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {patient.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-xl tracking-tight leading-tight">{patient.name}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Registry ID: {patient.id.slice(0, 8)}</p>
                  </div>
                </div>
                {role === 'admin' && !isEditing && (
                  <button onClick={() => { setEditingId(patient.id); setEditData(patient); }} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all shadow-sm">
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                   <Phone size={14} className="text-blue-400" />
                   <span className="text-xs font-bold text-slate-600">{patient.phone}</span>
                </div>
                
                {isEditing ? (
                  <div className="space-y-4 pt-2 border-t border-slate-50 animate-in fade-in">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                      <input 
                        type="email"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold"
                        value={editData.email || ''}
                        onChange={e => setEditData({...editData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Birth Date (Profile Completion)</label>
                      <input 
                        type="date"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold"
                        value={editData.dob || ''}
                        onChange={e => setEditData({...editData, dob: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-3 text-slate-400 font-black uppercase tracking-widest text-[10px] bg-slate-50 rounded-xl">Discard</button>
                      <button onClick={() => handleEditSave(patient.id)} className="flex-1 py-3 bg-green-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-green-100 flex items-center justify-center gap-2">
                        <Check size={14} /> Finalize
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                       <Mail size={14} className="text-indigo-400" />
                       <span className={`text-xs font-bold ${patient.email ? 'text-slate-600' : 'text-slate-300 italic'}`}>
                         {patient.email || 'Email Pending Completion'}
                       </span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                       <CalendarIcon size={14} className="text-emerald-400" />
                       <span className={`text-xs font-bold ${patient.dob ? 'text-slate-600' : 'text-slate-300 italic'}`}>
                         {patient.dob ? `Born: ${patient.dob}` : 'Birth Date Pending'}
                       </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatientsView;
