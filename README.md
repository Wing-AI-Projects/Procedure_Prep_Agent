# Prep Pro Agent - Colonoscopy Preparation Voice Agent

A hackathon demo web application that uses an AI voice agent (Ali) to help medical staff call colonoscopy patients and deliver preparation instructions.

## Features

- **Patient Dashboard**: View patients scheduled for tomorrow's procedures
- **Voice Agent Integration**: Connect to Vocal Bridge's "Prep Pro Agent" via LiveKit WebRTC
- **Outcome Tracking**: Checklist to verify patient compliance with prep instructions
- **Nurse Follow-up Queue**: Track patients who need additional assistance

## Quick Start

### Prerequisites

- Node.js 18+
- Vocal Bridge API key (set in `backend/.env`)

### Setup

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Configure API key** (edit `backend/.env`):
   ```
   VOCAL_BRIDGE_API_KEY=vb_your_api_key_here
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

1. Open the dashboard to see patients scheduled for tomorrow
2. Click "Start Call" on a patient card
3. The voice agent connects and greets the patient
4. Staff marks checklist items as verified during the call
5. Click "Complete Call" to save the outcome
6. Patients needing follow-up appear in the Nurse Queue

## Project Structure

```
Procedure_Prep_Agent/
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts        # API endpoints
│   │   └── db.ts           # JSON file database
│   └── .env                # API key config
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/          # Dashboard, NurseQueue
│   │   ├── components/     # PatientCard, CallModal
│   │   └── hooks/          # useVoiceAgent
│   └── .env                # API URL config
└── MCP_Server/             # Existing prep instructions server
```

## API Endpoints

- `GET /api/patients/tomorrow` - List tomorrow's patients
- `POST /api/livekit/token` - Get Vocal Bridge token for voice connection
- `POST /api/calls/:patientId/outcome` - Submit call outcome
- `GET /api/followups` - List patients needing follow-up
- `GET /api/stats` - Call statistics
- `POST /api/reset` - Reset demo data

## Demo Data

The app seeds 5 demo patients automatically. Use the "Reset Demo" button to restore initial data.

## Voice Agent

The "Prep Pro Agent" (Ali) is configured to:
- Verify patient identity (DOB)
- Explain colonoscopy prep timeline
- Confirm patient has required supplies
- Answer questions about the procedure
- Escalate to a nurse when needed

## Tech Stack

- **Backend**: Express, TypeScript, JSON file storage
- **Frontend**: React, Vite, Tailwind CSS, LiveKit Client
- **Voice**: Vocal Bridge API with LiveKit WebRTC
