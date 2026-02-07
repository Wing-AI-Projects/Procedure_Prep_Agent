import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Users, Phone, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { PatientCard } from '../components/PatientCard';
import { CallModal } from '../components/CallModal';
import type { Patient, Stats } from '../types';
import { api } from '../api';

export function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [patientsData, statsData] = await Promise.all([
        api.getPatientsTomorrow(),
        api.getStats(),
      ]);
      setPatients(patientsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCallComplete = () => {
    setSelectedPatient(null);
    loadData(); // Refresh data after call
  };

  const handleResetDemo = async () => {
    if (confirm('Reset all demo data? This will clear all call history.')) {
      await api.resetData();
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prep Pro Agent</h1>
              <p className="text-sm text-gray-500">Colonoscopy Preparation Calls</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/followups"
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
              >
                <AlertTriangle className="w-4 h-4" />
                Nurse Queue
                {stats && stats.needsFollowup > 0 && (
                  <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {stats.needsFollowup}
                  </span>
                )}
              </Link>
              <button
                onClick={loadData}
                disabled={isLoading}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleResetDemo}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              label="Total Patients"
              value={stats.totalPatients}
              color="blue"
            />
            <StatCard
              icon={<Phone className="w-6 h-6 text-yellow-600" />}
              label="Pending Calls"
              value={stats.pending}
              color="yellow"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6 text-green-600" />}
              label="Completed"
              value={stats.called}
              color="green"
            />
            <StatCard
              icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
              label="Needs Follow-up"
              value={stats.needsFollowup}
              color="red"
            />
          </div>
        )}

        {/* Patient List */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tomorrow's Procedures ({patients.length})
          </h2>
          <p className="text-sm text-gray-500">Click "Start Call" to connect with the voice agent</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            No patients scheduled for tomorrow
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onCallClick={setSelectedPatient}
              />
            ))}
          </div>
        )}
      </div>

      {/* Call Modal */}
      {selectedPatient && (
        <CallModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onComplete={handleCallComplete}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const bgColors = {
    blue: 'bg-blue-50',
    yellow: 'bg-yellow-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
  };

  return (
    <div className={`${bgColors[color]} rounded-lg p-4`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
