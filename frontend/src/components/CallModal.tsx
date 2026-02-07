import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';
import type { Patient, CallOutcome } from '../types';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import { api } from '../api';
import { COLONOSCOPY_PREP_INSTRUCTIONS } from '../constants/prepInstructions';

interface CallModalProps {
  patient: Patient;
  onClose: () => void;
  onComplete: () => void;
}

const initialOutcome: CallOutcome = {
  identityVerified: false,
  hasSupplies: false,
  understandsDiet: false,
  knowsTimeline: false,
  hasTransportation: false,
  completedAllSteps: false,
  needsFollowup: false,
  notes: '',
};

export function CallModal({ patient, onClose, onComplete }: CallModalProps) {
  const { isConnected, isConnecting, isMicEnabled, error, connect, disconnect, toggleMic, sendActionToAgent, setOnAgentAction } = useVoiceAgent();
  const [outcome, setOutcome] = useState<CallOutcome>(initialOutcome);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const hasSentContext = useRef(false);

  // Auto-connect when modal opens
  useEffect(() => {
    if (!callStarted) {
      handleStartCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send patient context to agent after connection is established
  useEffect(() => {
    if (isConnected && !hasSentContext.current) {
      hasSentContext.current = true;

      // Send patient info and prep instructions to the voice agent
      sendActionToAgent('get_patient_context', {
        patientName: patient.name,
        dateOfBirth: patient.dob,
        procedureDate: patient.procedure_date,
        procedureTime: patient.procedure_time,
        prepInstructions: COLONOSCOPY_PREP_INSTRUCTIONS
      });
    }
  }, [isConnected, patient, sendActionToAgent]);

  const handleStartCall = async () => {
    setCallStarted(true);
    // Create call record in backend
    await api.createCall(patient.id);
    // Connect to voice agent
    await connect(patient.name);
  };

  const handleEndCall = async () => {
    await disconnect();
  };

  const handleSubmitOutcome = async () => {
    setIsSubmitting(true);
    try {
      await api.submitOutcome(patient.id, outcome);
      onComplete();
    } catch (err) {
      console.error('Failed to submit outcome:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = (field: keyof CallOutcome) => {
    if (typeof outcome[field] === 'boolean') {
      setOutcome((prev) => ({ ...prev, [field]: !prev[field] }));
    }
  };

  // update_steps function to update checklist from agent payload
  const update_steps = useCallback((payload: Record<string, unknown>) => {
    setOutcome(prev => ({
      ...prev,
      identityVerified: typeof payload.identityVerified === 'boolean' ? payload.identityVerified : prev.identityVerified,
      hasSupplies: typeof payload.hasSupplies === 'boolean' ? payload.hasSupplies : prev.hasSupplies,
      understandsDiet: typeof payload.understandsDiet === 'boolean' ? payload.understandsDiet : prev.understandsDiet,
      knowsTimeline: typeof payload.knowsTimeline === 'boolean' ? payload.knowsTimeline : prev.knowsTimeline,
      hasTransportation: typeof payload.hasTransportation === 'boolean' ? payload.hasTransportation : prev.hasTransportation,
      completedAllSteps: typeof payload.completedAllSteps === 'boolean' ? payload.completedAllSteps : prev.completedAllSteps,
      needsFollowup: typeof payload.needsFollowup === 'boolean' ? payload.needsFollowup : prev.needsFollowup,
      notes: typeof payload.notes === 'string' ? payload.notes : prev.notes,
    }));
  }, []);

  // Register handler for agent actions
  useEffect(() => {
    setOnAgentAction((action, payload) => {
      if (action === 'update_steps') {
        update_steps(payload);
      }
    });
  }, [setOnAgentAction, update_steps]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Call with {patient.name}</h2>
            <p className="text-sm text-gray-500">DOB: {patient.dob}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Call Status */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-center gap-4">
            {isConnecting ? (
              <div className="flex items-center gap-3 text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">Connecting to voice agent...</span>
              </div>
            ) : isConnected ? (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">Connected - Voice Agent Active</span>
                </div>
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full ${
                    isMicEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleEndCall}
                  className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {error ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Call ended or not connected</span>
                )}
                <button
                  onClick={handleStartCall}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Phone className="w-4 h-4" />
                  Reconnect
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Prep Instructions Summary */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-3">Prep Instructions Summary</h3>
          <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2">
            <p><strong>Day Before:</strong> Clear liquids only, no solid foods</p>
            <p><strong>3:00 PM:</strong> Take 2 Dulcolax pills with 8oz liquid</p>
            <p><strong>4:00 PM:</strong> Mix 8 capfuls MiraLax with 28oz Gatorade, drink over 1 hour, then Gas-X</p>
            <p><strong>7:00 PM:</strong> Repeat MiraLax mixture + Gas-X</p>
            <p><strong>Day Of (4:00 AM):</strong> Final MiraLax mixture + Gas-X, then no more liquids</p>
          </div>
        </div>

        {/* Outcome Checklist */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900 mb-4">Verification Checklist</h3>
          <div className="space-y-3">
            <CheckboxItem
              checked={outcome.identityVerified}
              onChange={() => handleCheckboxChange('identityVerified')}
              label="Identity Verified (DOB confirmed)"
            />
            <CheckboxItem
              checked={outcome.hasSupplies}
              onChange={() => handleCheckboxChange('hasSupplies')}
              label="Has all prep supplies (MiraLax, Dulcolax, Gatorade, Gas-X)"
            />
            <CheckboxItem
              checked={outcome.understandsDiet}
              onChange={() => handleCheckboxChange('understandsDiet')}
              label="Understands clear liquid diet restrictions"
            />
            <CheckboxItem
              checked={outcome.knowsTimeline}
              onChange={() => handleCheckboxChange('knowsTimeline')}
              label="Knows the next prep time"
            />
            <CheckboxItem
              checked={outcome.hasTransportation}
              onChange={() => handleCheckboxChange('hasTransportation')}
              label="Has transportation arranged (adult 18+ driver)"
            />
            <CheckboxItem
              checked={outcome.completedAllSteps}
              onChange={() => handleCheckboxChange('completedAllSteps')}
              label="Patient completed all required steps"
            />
            <div className="pt-2 border-t">
              <CheckboxItem
                checked={outcome.needsFollowup}
                onChange={() => handleCheckboxChange('needsFollowup')}
                label="Needs nurse follow-up"
                className="text-red-600"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-6 border-b">
          <label className="block font-semibold text-gray-900 mb-2">Notes</label>
          <textarea
            value={outcome.notes}
            onChange={(e) => setOutcome((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional notes about the call..."
            className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitOutcome}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Call'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CheckboxItemProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  className?: string;
}

function CheckboxItem({ checked, onChange, label, className = '' }: CheckboxItemProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className={checked ? 'line-through text-gray-400' : ''}>{label}</span>
    </label>
  );
}
