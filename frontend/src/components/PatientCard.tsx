import { Phone, Clock, Calendar, User } from 'lucide-react';
import type { Patient } from '../types';

interface PatientCardProps {
  patient: Patient;
  onCallClick: (patient: Patient) => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  called: 'bg-green-100 text-green-800',
  needs_followup: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'Pending',
  called: 'Called',
  needs_followup: 'Needs Follow-up',
};

export function PatientCard({ patient, onCallClick }: PatientCardProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDob = (dob: string) => {
    const date = new Date(dob + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-500">DOB: {formatDob(patient.dob)}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[patient.status]}`}>
          {statusLabels[patient.status]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4" />
          <span className="text-sm">{patient.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{patient.procedure_date}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatTime(patient.procedure_time)}</span>
        </div>
      </div>

      <button
        onClick={() => onCallClick(patient)}
        disabled={patient.status !== 'pending'}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          patient.status === 'pending'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Phone className="w-4 h-4" />
        {patient.status === 'pending' ? 'Start Call' : 'Already Called'}
      </button>
    </div>
  );
}
