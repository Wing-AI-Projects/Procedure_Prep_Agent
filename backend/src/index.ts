import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import database, { CallOutcome } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to get tomorrow's date
function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// GET /api/patients - List patients (optionally filter by date and status)
app.get('/api/patients', (req, res) => {
  try {
    const { date, status } = req.query;
    const patients = database.getPatients({
      date: date as string,
      status: status as string,
    });
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/tomorrow - Get patients scheduled for tomorrow
app.get('/api/patients/tomorrow', (req, res) => {
  try {
    const tomorrow = getTomorrowDate();
    const patients = database.getPatients({ date: tomorrow });
    res.json(patients);
  } catch (error) {
    console.error('Error fetching tomorrow patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id - Get single patient
app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = database.getPatientById(parseInt(req.params.id));
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// POST /api/livekit/token - Get Vocal Bridge token for LiveKit connection
app.post('/api/livekit/token', async (req, res) => {
  try {
    const apiKey = process.env.VOCAL_BRIDGE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'VOCAL_BRIDGE_API_KEY not configured' });
    }

    const { patientName } = req.body;
    const participantName = patientName || 'Staff';

    const response = await fetch('https://vocalbridgeai.com/api/v1/token', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participant_name: participantName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vocal Bridge API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to get token from Vocal Bridge' });
    }

    const tokenData = await response.json();
    res.json(tokenData);
  } catch (error) {
    console.error('Error getting LiveKit token:', error);
    res.status(500).json({ error: 'Failed to get LiveKit token' });
  }
});

// POST /api/calls - Create a new call record
app.post('/api/calls', (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }

    const call = database.createCall(patientId);
    res.json(call);
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// POST /api/calls/:patientId/outcome - Save call outcome and update patient status
app.post('/api/calls/:patientId/outcome', (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    const outcome: CallOutcome = req.body;

    // Update call with outcome
    const call = database.updateCallOutcome(patientId, outcome);

    // Update patient status
    const newStatus = outcome.needsFollowup ? 'needs_followup' : 'called';
    database.updatePatientStatus(patientId, newStatus);

    res.json({ success: true, status: newStatus, call });
  } catch (error) {
    console.error('Error saving outcome:', error);
    res.status(500).json({ error: 'Failed to save outcome' });
  }
});

// GET /api/followups - Get patients needing follow-up
app.get('/api/followups', (req, res) => {
  try {
    const patients = database.getPatients({ status: 'needs_followup' });

    // Get call outcomes for each patient
    const followups = patients.map(patient => {
      const calls = database.getCallsByPatientId(patient.id);
      const lastCall = calls[calls.length - 1];
      return {
        ...patient,
        outcome: lastCall?.outcome || null,
        callEndedAt: lastCall?.ended_at || null,
      };
    });

    res.json(followups);
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ error: 'Failed to fetch followups' });
  }
});

// PUT /api/followups/:patientId/resolve - Mark follow-up as resolved
app.put('/api/followups/:patientId/resolve', (req, res) => {
  try {
    const patientId = parseInt(req.params.patientId);
    database.updatePatientStatus(patientId, 'called');
    res.json({ success: true });
  } catch (error) {
    console.error('Error resolving followup:', error);
    res.status(500).json({ error: 'Failed to resolve followup' });
  }
});

// GET /api/stats - Get call statistics
app.get('/api/stats', (req, res) => {
  try {
    const tomorrow = getTomorrowDate();
    const stats = database.getStats(tomorrow);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/reset - Reset demo data (useful for demos)
app.post('/api/reset', (req, res) => {
  try {
    database.reset();
    res.json({ success: true, message: 'Database reset to initial demo data' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Prep Pro Backend running on http://localhost:${PORT}`);
  console.log(`📅 Tomorrow's date: ${getTomorrowDate()}`);
});
