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

export interface PatientWithOutcome extends Patient {
  outcome: CallOutcome | null;
  callEndedAt: string | null;
}

export interface Stats {
  totalPatients: number;
  pending: number;
  called: number;
  needsFollowup: number;
}

export interface LiveKitToken {
  livekit_url: string;
  token: string;
  room_name: string;
  participant_identity: string;
  expires_in: number;
}
