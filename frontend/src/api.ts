import type { Patient, PatientWithOutcome, Stats, CallOutcome, LiveKitToken, Call } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Patients
  getPatientsTomorrow: () => fetchAPI<Patient[]>('/patients/tomorrow'),

  getPatient: (id: number) => fetchAPI<Patient>(`/patients/${id}`),

  // Calls
  createCall: (patientId: number) =>
    fetchAPI<Call>('/calls', {
      method: 'POST',
      body: JSON.stringify({ patientId }),
    }),

  submitOutcome: (patientId: number, outcome: CallOutcome) =>
    fetchAPI<{ success: boolean; status: string }>(`/calls/${patientId}/outcome`, {
      method: 'POST',
      body: JSON.stringify(outcome),
    }),

  // LiveKit token
  getLiveKitToken: (patientName?: string) =>
    fetchAPI<LiveKitToken>('/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ patientName }),
    }),

  // Follow-ups
  getFollowups: () => fetchAPI<PatientWithOutcome[]>('/followups'),

  resolveFollowup: (patientId: number) =>
    fetchAPI<{ success: boolean }>(`/followups/${patientId}/resolve`, {
      method: 'PUT',
    }),

  // Stats
  getStats: () => fetchAPI<Stats>('/stats'),

  // Reset demo data
  resetData: () =>
    fetchAPI<{ success: boolean }>('/reset', {
      method: 'POST',
    }),
};
