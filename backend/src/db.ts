import fs from 'fs';
import path from 'path';
import os from 'os';

const isVercel = !!process.env.VERCEL;
const dataPath = isVercel
  ? path.join(os.tmpdir(), 'data.json')
  : path.join(__dirname, '..', 'data.json');

export interface Patient {
  id: number;
  name: string;
  phone: string;
  dob: string;
  procedure_date: string;
  procedure_time: string;
  status: 'pending' | 'called' | 'needs_followup';
}

export interface Call {
  id: number;
  patient_id: number;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  outcome: CallOutcome | null;
}

export interface CallOutcome {
  identityVerified: boolean;
  hasSupplies: boolean;
  understandsDiet: boolean;
  knowsTimeline: boolean;
  hasTransportation: boolean;
  completedAllSteps: boolean;
  needsFollowup: boolean;
  notes: string;
}

interface Database {
  patients: Patient[];
  calls: Call[];
}

// Helper to get tomorrow's date
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Initialize with seed data
function createInitialData(): Database {
  const tomorrow = getTomorrowDate();

  return {
    patients: [
      { id: 1, name: 'Wing Ho', phone: '+1234567890', dob: '1980-01-01', procedure_date: tomorrow, procedure_time: '10:00', status: 'pending' },
      { id: 2, name: 'Jane Smith', phone: '+1234567891', dob: '1972-07-22', procedure_date: tomorrow, procedure_time: '09:30', status: 'pending' },
      { id: 3, name: 'Bob Johnson', phone: '+1234567892', dob: '1990-11-08', procedure_date: tomorrow, procedure_time: '11:00', status: 'pending' },
      { id: 4, name: 'Maria Garcia', phone: '+1234567893', dob: '1965-05-20', procedure_date: tomorrow, procedure_time: '13:00', status: 'pending' },
      { id: 5, name: 'David Lee', phone: '+1234567894', dob: '1988-12-03', procedure_date: tomorrow, procedure_time: '14:30', status: 'pending' },
    ],
    calls: [],
  };
}

// Load database from file or create new
function loadDatabase(): Database {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database, creating new:', error);
  }

  const initialData = createInitialData();
  saveDatabase(initialData);
  console.log(`Created new database with ${initialData.patients.length} demo patients for ${getTomorrowDate()}`);
  return initialData;
}

// Save database to file
function saveDatabase(data: Database): void {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// In-memory database
let db: Database = loadDatabase();

// Database operations
export const database = {
  // Patients
  getPatients(filter?: { date?: string; status?: string }): Patient[] {
    let patients = db.patients;
    if (filter?.date) {
      patients = patients.filter(p => p.procedure_date === filter.date);
    }
    if (filter?.status) {
      patients = patients.filter(p => p.status === filter.status);
    }
    return patients.sort((a, b) => a.procedure_time.localeCompare(b.procedure_time));
  },

  getPatientById(id: number): Patient | undefined {
    return db.patients.find(p => p.id === id);
  },

  updatePatientStatus(id: number, status: Patient['status']): void {
    const patient = db.patients.find(p => p.id === id);
    if (patient) {
      patient.status = status;
      saveDatabase(db);
    }
  },

  // Calls
  createCall(patientId: number): Call {
    const newCall: Call = {
      id: db.calls.length + 1,
      patient_id: patientId,
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_seconds: null,
      outcome: null,
    };
    db.calls.push(newCall);
    saveDatabase(db);
    return newCall;
  },

  getCallsByPatientId(patientId: number): Call[] {
    return db.calls.filter(c => c.patient_id === patientId);
  },

  updateCallOutcome(patientId: number, outcome: CallOutcome): Call | undefined {
    // Find most recent call for this patient
    const calls = db.calls.filter(c => c.patient_id === patientId);
    const call = calls[calls.length - 1];

    if (call) {
      call.ended_at = new Date().toISOString();
      call.outcome = outcome;
      if (call.started_at) {
        call.duration_seconds = Math.floor(
          (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000
        );
      }
      saveDatabase(db);
    }

    return call;
  },

  // Stats
  getStats(date: string) {
    const patients = db.patients.filter(p => p.procedure_date === date);
    return {
      totalPatients: patients.length,
      pending: patients.filter(p => p.status === 'pending').length,
      called: patients.filter(p => p.status === 'called').length,
      needsFollowup: patients.filter(p => p.status === 'needs_followup').length,
    };
  },

  // Reset (for demo)
  reset(): void {
    db = createInitialData();
    saveDatabase(db);
  },
};

export default database;
