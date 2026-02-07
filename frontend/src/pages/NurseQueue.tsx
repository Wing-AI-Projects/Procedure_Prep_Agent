import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Loader2, AlertTriangle, User, Phone, Calendar } from 'lucide-react';
import type { PatientWithOutcome } from '../types';
import { api } from '../api';

export function NurseQueue() {
  const [followups, setFollowups] = useState<PatientWithOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const loadFollowups = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFollowups();
      setFollowups(data);
    } catch (err) {
      console.error('Failed to load followups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFollowups();
  }, []);

  const handleResolve = async (patientId: number) => {
    setResolvingId(patientId);
    try {
      await api.resolveFollowup(patientId);
      loadFollowups();
    } catch (err) {
      console.error('Failed to resolve followup:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nurse Follow-up Queue</h1>
              <p className="text-sm text-gray-500">Patients requiring callback</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : followups.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All Clear!</h3>
            <p className="text-gray-500">No patients need follow-up at this time.</p>
            <Link
              to="/"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {followups.map((patient) => (
              <div key={patient.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {patient.procedure_date} at {patient.procedure_time}
                        </span>
                      </div>

                      {/* Outcome details */}
                      {patient.outcome && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Verification Status:</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <OutcomeItem
                              label="Identity Verified"
                              checked={patient.outcome.identityVerified}
                            />
                            <OutcomeItem
                              label="Has Supplies"
                              checked={patient.outcome.hasSupplies}
                            />
                            <OutcomeItem
                              label="Understands Diet"
                              checked={patient.outcome.understandsDiet}
                            />
                            <OutcomeItem
                              label="Knows Timeline"
                              checked={patient.outcome.knowsTimeline}
                            />
                            <OutcomeItem
                              label="Has Transportation"
                              checked={patient.outcome.hasTransportation}
                            />
                          </div>
                          {patient.outcome.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">
                                <strong>Notes:</strong> {patient.outcome.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolve(patient.id)}
                    disabled={resolvingId === patient.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {resolvingId === patient.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface OutcomeItemProps {
  label: string;
  checked: boolean;
}

function OutcomeItem({ label, checked }: OutcomeItemProps) {
  return (
    <div className={`flex items-center gap-2 ${checked ? 'text-green-600' : 'text-red-600'}`}>
      {checked ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      <span>{label}</span>
    </div>
  );
}
