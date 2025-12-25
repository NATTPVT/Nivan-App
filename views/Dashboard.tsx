
import React from 'react';
import { Users, Calendar, Clock, CheckCircle2, ShieldCheck, Stethoscope, PlusCircle, History } from 'lucide-react';
import { Patient, Appointment, View, UserRole } from '../types';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  onNavigate: (view: View) => void;
  role: UserRole;
  staffName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ patients, appointments, onNavigate, role, staffName }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Only count appointments that are actually happening (scheduled or completed)
  const activeAppointments = appointments.filter(a => a.status === 'scheduled' || a.status === 'completed');
  const todaysAppointments = activeAppointments.filter(a => a.dateTime.startsWith(today));
  const pendingVerification = appointments.filter(a => a.status === 'pending').length;

  const stats = [
    { label: 'Total Patients', value: patients.length, icon: Users, color: 'bg-blue-600' },
    { label: 'Today\'s Workload', value: todaysAppointments.length, icon: Calendar, color: 'bg-indigo-600' },
    { label: 'Pending Verification', value: pendingVerification, icon: Clock, color: 'bg-amber-600' },
    { label: 'Sessions Logged', value: appointments.filter(a => a.status === 'completed').length, icon: CheckCircle2, color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-4 py-1.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-100">
              {role === 'admin' ? 'Master Administration' : 'Practitioner Portal'}
            </span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <h2 className="text-5xl font-black text-slate-800 tracking-tighter">
            {staffName || 'Clinician'}
          </h2>
          <p className="text-slate-500 font-medium text-lg">Managing the clinical heartbeat of MedPulse Wellness.</p>
        </div>
        <div className="hidden lg:flex gap-4">
           <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-inner">
                <ShieldCheck size={24} />
              </div>
              <div className="pr-6 border-r border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Auth Status</p>
                <p className="text-sm font-black text-slate-800">Secure/Logged</p>
              </div>
              <div className="pl-2">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Environment</p>
                <p className="text-sm font-black text-slate-800">Clinical-V1</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className={`${stat.color} p-4 rounded-3xl text-white shadow-xl mb-6 w-fit group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                <p className="text-5xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[48px] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />
          <div className="flex items-center justify-between mb-12 relative z-10">
            <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4 tracking-tight">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <PlusCircle size={28} />
              </div>
              Clinical Operations
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            <button 
              onClick={() => onNavigate('patients')}
              className="p-10 text-left border-2 border-slate-50 rounded-[40px] hover:border-blue-200 hover:bg-blue-50 transition-all group shadow-sm bg-white"
            >
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <p className="font-black text-slate-800 text-xl leading-tight">New Intake</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">Add Patient</p>
            </button>
            <button 
              onClick={() => onNavigate('appointments')}
              className="p-10 text-left border-2 border-slate-50 rounded-[40px] hover:border-indigo-200 hover:bg-indigo-50 transition-all group shadow-sm bg-white"
            >
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <p className="font-black text-slate-800 text-xl leading-tight">Booking</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">Manage Visits</p>
            </button>
            <button 
              onClick={() => onNavigate('sessions')}
              className="p-10 text-left border-2 border-slate-50 rounded-[40px] hover:border-emerald-200 hover:bg-emerald-50 transition-all group shadow-sm bg-white"
            >
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <History size={28} />
              </div>
              <p className="font-black text-slate-800 text-xl leading-tight">Recording</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">Log Sessions</p>
            </button>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-4 tracking-tight">
            <Clock className="text-blue-600" /> Today's Visits
          </h3>
          <div className="space-y-6">
            {todaysAppointments.length > 0 ? (
              todaysAppointments.slice(0, 5).map((app) => {
                const patient = patients.find(p => p.id === app.patientId);
                return (
                  <div key={app.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[32px] border border-slate-50 hover:border-blue-100 transition-all hover:bg-white group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 text-blue-600 flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {patient?.name[0]}
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-800 tracking-tight leading-tight">{patient?.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black px-3 py-1.5 bg-white text-slate-500 rounded-xl uppercase tracking-widest border border-slate-100 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600">
                        {app.type}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                <p className="text-slate-400 font-black text-sm uppercase tracking-[0.2em] italic">Queue is clear</p>
              </div>
            )}
            {todaysAppointments.length > 5 && (
              <button onClick={() => onNavigate('appointments')} className="w-full py-4 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 rounded-2xl transition-colors">
                View Entire Schedule &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
