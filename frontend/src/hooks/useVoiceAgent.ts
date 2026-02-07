import { useState, useCallback, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant } from 'livekit-client';
import { api } from '../api';

export interface UseVoiceAgentReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isMicEnabled: boolean;
  error: string | null;
  connect: (patientName?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMic: () => Promise<void>;
  sendActionToAgent: (action: string, payload?: Record<string, unknown>) => void;
  setOnAgentAction: (handler: (action: string, payload: Record<string, unknown>) => void) => void;
}

export function useVoiceAgent(): UseVoiceAgentReturn {
  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onAgentActionRef = useRef<((action: string, payload: Record<string, unknown>) => void) | null>(null);

  // Initialize room on mount
  useEffect(() => {
    roomRef.current = new Room();

    const room = roomRef.current;

    // Handle agent audio tracks
    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication, _participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.id = 'agent-audio';
        document.body.appendChild(audioElement);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Audio) {
        track.detach().forEach((el) => el.remove());
      }
    });

    room.on(RoomEvent.Connected, () => {
      console.log('Connected to LiveKit room');
      setIsConnected(true);
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log('Disconnected from LiveKit room');
      setIsConnected(false);
      setIsMicEnabled(false);
      // Clean up audio element
      const audioEl = document.getElementById('agent-audio');
      if (audioEl) audioEl.remove();
    });

    room.on(RoomEvent.MediaDevicesError, (e: Error) => {
      console.error('Media device error:', e);
      setError(`Microphone error: ${e.message}`);
    });

    // Listen for actions FROM the agent (Agent to App)
    room.on(RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
      if (topic === 'client_actions') {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          if (data.type === 'client_action' && onAgentActionRef.current) {
            console.log('Received action from agent:', data.action, data.payload);
            onAgentActionRef.current(data.action, data.payload);
          }
        } catch (e) {
          console.error('Error parsing agent action:', e);
        }
      }
    });

    return () => {
      room.disconnect();
      roomRef.current = null;
    };
  }, []);

  const connect = useCallback(async (patientName?: string) => {
    if (!roomRef.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get token from backend
      const tokenData = await api.getLiveKitToken(patientName);

      // Connect to LiveKit room
      await roomRef.current.connect(tokenData.livekit_url, tokenData.token);

      // Enable microphone
      await roomRef.current.localParticipant.setMicrophoneEnabled(true);
      setIsMicEnabled(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
      console.error('Error connecting to voice agent:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!roomRef.current) return;
    await roomRef.current.disconnect();
  }, []);

  const toggleMic = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return;

    const newState = !isMicEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    setIsMicEnabled(newState);
  }, [isMicEnabled]);

  // Send data/actions to the voice agent via LiveKit data channel
  const sendActionToAgent = useCallback((action: string, payload: Record<string, unknown> = {}) => {
    if (!roomRef.current?.localParticipant) {
      console.warn('Cannot send action: not connected to room');
      return;
    }

    const message = JSON.stringify({
      type: 'client_action',
      action: action,
      payload: payload
    });

    roomRef.current.localParticipant.publishData(
      new TextEncoder().encode(message),
      { reliable: true, topic: 'client_actions' }
    );

    console.log('Sent action to agent:', action, payload);
  }, []);

  // Set callback for receiving actions from agent
  const setOnAgentAction = useCallback((handler: (action: string, payload: Record<string, unknown>) => void) => {
    onAgentActionRef.current = handler;
  }, []);

  return {
    isConnected,
    isConnecting,
    isMicEnabled,
    error,
    connect,
    disconnect,
    toggleMic,
    sendActionToAgent,
    setOnAgentAction,
  };
}
