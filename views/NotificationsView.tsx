
import React from 'react';
import { MessageSquare, CheckCircle2, Clock, Smartphone, MessageCircle } from 'lucide-react';
import { Notification, Patient } from '../types';

interface NotificationsViewProps {
  notifications: Notification[];
  patients: Patient[];
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, patients }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Message Log</h2>
        <p className="text-slate-500">Track all sent and scheduled communications with patients.</p>
      </div>

      <div className="space-y-4">
        {notifications.map(n => {
          const patient = patients.find(p => p.id === n.patientId);
          return (
            <div key={n.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4 transition-all hover:shadow-md">
              <div className={`p-3 rounded-xl self-start ${n.status === 'sent' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                {n.channel === 'WhatsApp' ? <MessageCircle size={20} /> : <Smartphone size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{patient?.name || 'Unknown Patient'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                      {n.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {n.status === 'sent' ? (
                      <>
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-green-600 font-medium">Sent at {new Date(n.sentAt).toLocaleString()}</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} className="text-amber-500" />
                        <span className="text-amber-600 font-medium italic">Scheduled for delivery</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 border border-slate-100 relative italic">
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-50 border-l border-t border-slate-100 rotate-45" />
                  "{n.content}"
                </div>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
            <MessageSquare className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400 font-medium">No messages have been logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;
