
import React from 'react';
import { Camera, Search, User, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { Patient, ClinicSettings, UserRole } from '../types';

interface PhotosViewProps {
  patients: Patient[];
  settings: ClinicSettings;
  role: UserRole;
  currentStaffId: string;
}

const PhotosView: React.FC<PhotosViewProps> = ({ patients, settings, role, currentStaffId }) => {
  const patientsWithPhotos = patients.filter(p => p.photos && p.photos.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Photo Consultations</h2>
          <p className="text-slate-500">Review patient-submitted images for distance diagnostics.</p>
        </div>
        {!settings.photoConsultationEnabled && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-xs font-bold">
            <AlertTriangle size={14} /> System Disabled
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {patientsWithPhotos.map(patient => (
          patient.photos?.map(photo => (
            <div key={photo.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group">
              <div className="aspect-video relative overflow-hidden bg-slate-900">
                <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold rounded-lg shadow-sm">
                    {new Date(photo.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {patient.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{patient.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Patient ID: {patient.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 italic">
                  "{photo.note || 'No description provided.'}"
                </div>
                <button className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare size={14} /> Send Clinical Feedback
                </button>
              </div>
            </div>
          ))
        ))}

        {patientsWithPhotos.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
            <Camera className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400 font-bold">No photo consultation requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotosView;
