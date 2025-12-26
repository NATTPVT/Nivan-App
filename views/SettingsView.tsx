import React, { useState } from 'react';
import { Settings, Sparkles, ShieldCheck, ToggleLeft, ToggleRight, UserPlus, Lock, Eye, EyeOff, UserCheck, Trash2, Activity } from 'lucide-react';
import { ClinicSettings, ClinicStaff, UserRole } from '../types';
import { supabase } from '../supabaseClient'; // Ensure this path is correct

interface SettingsViewProps {
  settings: ClinicSettings;
  setSettings: React.Dispatch<React.SetStateAction<ClinicSettings>>;
  staff: ClinicStaff[];
  setStaff: React.Dispatch<React.SetStateAction<ClinicStaff[]>>;
  role: UserRole;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings, staff, setStaff, role }) => {
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', specialty: 'General' });

  // --- NEW: Helper to update Supabase and State simultaneously ---
  const updateGlobalSetting = async (columnName: string, value: any, settingsKey: string) => {
    // 1. Update UI immediately
    setSettings(prev => ({ ...prev, [settingsKey]: value }));

    // 2. Persist to Supabase
    const { error } = await supabase
      .from('settings')
      .update({ [columnName]: value })
      .eq('id', 1);

    if (error) console.error(`Error updating ${columnName}:`, error);
  };

  const togglePatientVisibility = async (part: key0f ClinicSettings['patientVisibility']) => {
    const newVisibility = {
      ...settings.patientVisibility,
      [part]: !settings.patientVisibility[part]
    };
    
    setSettings(prev => ({ ...prev, patientVisibility: newVisibility }));

    await supabase
      .from('settings')
      .update({ patient_visibility: newVisibility })
      .eq('id', 1);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `doc${Date.now()}`;
    const staffMember: ClinicStaff = { ...newStaff, id, role: 'doctor' };
    setStaff(prev => [...prev, staffMember]);
    setNewStaff({ name: '', username: '', password: '', specialty: 'General' });
    setIsAddingStaff(false);
  };

  const removeStaff = (id: string) => {
    if (id === 'admin') return;
    if (window.confirm('Delete this staff account forever?')) {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Clinic Governance</h2>
        <p className="text-slate-500 font-medium">Configure operational protocols and manage medical staff accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          {/* Auth & Privacy Section */}
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                <ShieldCheck size={28} />
              </div>
              <h3 className="font-black text-slate-800 text-2xl tracking-tight">Auth & Privacy</h3>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="flex items-center justify-between group">
                <div className="max-w-[70%]">
                  <p className="font-black text-slate-800 text-lg tracking-tight">Secure Staff Encapsulation</p>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed mt-1">
                    Practitioners can only view records they authored.
                  </p>
                </div>
                <button 
                  onClick={() => updateGlobalSetting('restrict_staff_logs', !settings.restrictStaffLogs, 'restrictStaffLogs')}
                  className={`transition-all ${settings.restrictStaffLogs ? 'text-blue-600' : 'text-slate-300'}`}
                >
                  {settings.restrictStaffLogs ? <ToggleRight size={56} /> : <ToggleLeft size={56} />}
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Eye size={18} className="text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Portal Transparency</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {['summary', 'results', 'careInstructions'].map((itemId) => {
                    const isVisible = settings.patientVisibility[itemId as keyof typeof settings.patientVisibility];
                    return (
                      <button 
                        key={itemId}
                        onClick={() => togglePatientVisibility(itemId as any)}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isVisible ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-70'}`}
                      >
                        <span className="font-bold capitalize">{itemId.replace(/([A-Z])/g, ' $1')}</span>
                        {isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* AI Clinical Modules Section */}
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                <Sparkles size={28} />
              </div>
              <h3 className="font-black text-slate-800 text-2xl tracking-tight">Active Clinical Modules</h3>
            </div>
            
            <div className="space-y-8">
              {/* Patient AI Toggle */}
              <div className="flex items-center justify-between group">
                <div className="max-w-[70%]">
                  <p className="font-black text-slate-800 text-lg tracking-tight">Patient AI Consultant</p>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">Offers treatment synthesis and service recommendations to patients.</p>
                </div>
                <button 
                  onClick={() => updateGlobalSetting('ai_patient_enabled', !settings.aiPatientEnabled, 'aiPatientEnabled')}
                  className={`transition-all ${settings.aiPatientEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
                >
                  {settings.aiPatientEnabled ? <ToggleRight size={56} /> : <ToggleLeft size={56} />}
                </button>
              </div>

              {/* Staff AI Toggle */}
              <div className="flex items-center justify-between group">
                <div className="max-w-[70%]">
                  <p className="font-black text-slate-800 text-lg tracking-tight">Staff AI Assistant</p>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">Helps practitioners generate after-session care instructions.</p>
                </div>
                <button 
                  onClick={() => updateGlobalSetting('ai_staff_enabled', !settings.aiStaffEnabled, 'aiStaffEnabled')}
                  className={`transition-all ${settings.aiStaffEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
                >
                  {settings.aiStaffEnabled ? <ToggleRight size={56} /> : <ToggleLeft size={56} />}
                </button>
              </div>

              {/* Photo Consultation Toggle */}
              <div className="flex items-center justify-between group">
                <div className="max-w-[70%]">
                  <p className="font-black text-slate-800 text-lg tracking-tight">Distance Diagnostic Images</p>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">Allow patient photo uploads for consultation.</p>
                </div>
                <button 
                  onClick={() => updateGlobalSetting('photo_consultation_enabled', !settings.photoConsultationEnabled, 'photoConsultationEnabled')}
                  className={`transition-all ${settings.photoConsultationEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
                >
                  {settings.photoConsultationEnabled ? <ToggleRight size={56} /> : <ToggleLeft size={56} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Management Section */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                <UserCheck size={28} />
              </div>
              <h3 className="font-black text-slate-800 text-2xl tracking-tight">Staff Account Management</h3>
            </div>
            <button 
              onClick={() => setIsAddingStaff(true)}
              className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <UserPlus size={20} />
            </button>
          </div>

          <div className="flex-1 p-8 space-y-4 overflow-y-auto max-h-[800px]">
            {isAddingStaff && (
              <form onSubmit={handleAddStaff} className="p-8 bg-slate-50 rounded-[32px] border border-slate-200 animate-in slide-in-from-top-4 mb-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Clinician Account</p>
                  <button type="button" onClick={() => setIsAddingStaff(false)} className="text-slate-300 hover:text-slate-800 text-xl font-light">&times;</button>
                </div>
                <input required className="w-full px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold" placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required className="w-full px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold" placeholder="Username" value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} />
                  <input required type="password" className="w-full px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold" placeholder="Password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                </div>
                <input className="w-full px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold" placeholder="Clinical Specialty" value={newStaff.specialty} onChange={e => setNewStaff({...newStaff, specialty: e.target.value})} />
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100">Establish Account</button>
              </form>
            )}

            {staff.map(s => (
              <div key={s.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-slate-50 hover:border-blue-100 hover:bg-white transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 text-blue-600 flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800 tracking-tight leading-tight">{s.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{s.role}</span>
                      <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">• {s.username}</span>
                    </div>
                  </div>
                </div>
                {s.id !== 'admin' && (
                  <button onClick={() => removeStaff(s.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
