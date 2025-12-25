
import React, { useState } from 'react';
import { Stethoscope, User, Lock, Phone, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { Patient, ClinicStaff, UserRole } from '../types';

interface AuthViewProps {
  patients: Patient[];
  staff: ClinicStaff[];
  onLogin: (role: UserRole, id: string) => void;
  onRegisterPatient: (name: string, phone: string, pass: string) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ patients, staff, onLogin, onRegisterPatient }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authType, setAuthType] = useState<'patient' | 'staff'>('patient');
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (authType === 'patient') {
        const found = patients.find(p => p.phone === phone && p.password === password);
        if (found) onLogin('patient', found.id);
        else setError('Invalid phone or password.');
      } else {
        const found = staff.find(s => s.username === username && s.password === password);
        if (found) onLogin(found.role, found.id);
        else setError('Invalid username or password.');
      }
    } else {
      // Registration (Patient Only)
      if (patients.some(p => p.phone === phone)) {
        setError('A patient with this phone number already exists.');
        return;
      }
      onRegisterPatient(name, phone, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-12">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-100 mb-6">
              <Stethoscope className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">MedPulse Connect</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Clinic Management Protocol</p>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setAuthType('patient'); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isLogin && authType === 'patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >Patient</button>
            <button 
              onClick={() => { setIsLogin(true); setAuthType('staff'); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isLogin && authType === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >Staff</button>
            {!isLogin && (
               <div className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-center text-blue-600 bg-white rounded-xl shadow-sm">Join</div>
            )}
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            {authType === 'patient' || !isLogin ? (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            ) : (
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  required
                  type="text"
                  placeholder="Staff Username"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                required
                type="password"
                placeholder="Password"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-700"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-xs font-black uppercase text-center">{error}</p>}

            <button 
              type="submit"
              className="w-full py-5 bg-blue-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3"
            >
              {isLogin ? (
                <><LogIn size={18} /> Secure Entry</>
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            {authType === 'patient' && (
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
              >
                {isLogin ? "No account? Sign up here" : "Already registered? Sign in"}
              </button>
            )}
            {authType === 'staff' && (
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                 Staff accounts are managed by administration only.
               </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
