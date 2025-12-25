
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  History, 
  Bell,
  Stethoscope,
  Settings,
  UserCircle,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';
import { View, UserRole, Patient, ClinicStaff } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  role: UserRole;
  currentUser: Patient | ClinicStaff | undefined;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, role, currentUser, onLogout }) => {
  const doctorItems = [
    { id: 'dashboard', label: 'My Schedule', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients Records', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'sessions', label: 'Session Logs', icon: History },
    { id: 'photos', label: 'Photo Consults', icon: ImageIcon },
  ];

  const adminItems = [
    ...doctorItems,
    { id: 'notifications', label: 'Message Log', icon: Bell },
    { id: 'settings', label: 'Clinic Protocol', icon: Settings },
  ];

  const patientItems = [
    { id: 'patient-portal', label: 'My Care Portal', icon: UserCircle },
  ];

  const items = role === 'admin' ? adminItems : (role === 'doctor' ? doctorItems : patientItems);

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0 shadow-sm z-40">
      <div className="p-8 flex items-center gap-3 border-b border-slate-100">
        <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
          <Stethoscope className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter">MedPulse</h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Connect</p>
        </div>
      </div>
      
      <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 px-2">Main Registry</label>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                isActive 
                ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-100 scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md ${role === 'patient' ? 'bg-indigo-500' : 'bg-blue-600'}`}>
                {currentUser?.name[0] || '?'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {role === 'admin' ? 'Master Admin' : role === 'doctor' ? 'Clinician' : 'Patient'}
                </p>
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 justify-center py-2.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
