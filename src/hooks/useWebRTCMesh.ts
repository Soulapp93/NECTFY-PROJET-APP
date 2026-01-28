import { useState, useEffect, useRef, useCallback } from 'react';
import { webrtcSignalingService, WebRTCSignal, Participant } from '@/services/elearning/webrtcSignalingService';
import { useToast } from './use-toast';

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
}

interface UseWebRTCMeshOptions {
  classId: string;
  userId: string;
  audio?: boolean;
  video?: boolean;
}

interface MediaState {
  audio: boolean;
  video: boolean;
  screenShare: boolean;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export const useWebRTCMesh = ({ classId, userId, audio = true, video = true }: UseWebRTCMeshOptions) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [mediaState, setMediaState] = useState<MediaState>({ audio, video, screenShare: false });
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cleanupFnRef = useRef<(() => void) | null>(null);

  // Initialize local media
  const initializeMedia = useCallback(async () => {
    try {
      console.log('Requesting media with constraints:', { audio, video });
      
      // First try with both audio and video
      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
          video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
        });
      } catch (mediaError: any) {
        console.warn('Failed to get media with full constraints, trying fallback:', mediaError);
        
        // Fallback: try with just audio if video fails
        if (video && (mediaError.name === 'NotAllowedError' || mediaError.name === 'NotFoundError')) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
              video: false,
            });
            setMediaState(prev => ({ ...prev, video: false }));
            toast({
              title: "Caméra non disponible",
              description: "La session continue avec audio uniquement",
            });
          } catch (audioError) {
            console.error('Failed to get audio-only stream:', audioError);
            // Continue without media - allow joining anyway
            return null;
          }
        } else {
          // Re-throw if it's not a permission/device issue
          throw mediaError;
        }
      }

      console.log('Got media stream:', stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      
      // Show appropriate error message
      let message = "Impossible d'accéder à la caméra/microphone.";
      if (error.name === 'NotAllowedError') {
        message = "Accès refusé. Autorisez la caméra/micro dans les paramètres du navigateur.";
      } else if (error.name === 'NotFoundError') {
        message = "Aucun périphérique audio/vidéo trouvé.";
      } else if (error.name === 'NotReadableError') {
        message = "La caméra/micro est utilisée par une autre application.";
      }
      
      toast({
        title: "Erreur d'accès média",
        description: message,
        variant: "destructive",
      });
      
      // Return null but don't prevent joining - allow audio-only or view-only mode
      return null;
    }
  }, [audio, video, toast]);

  // Create peer connection for a remote user
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await webrtcSignalingService.sendSignal(
          classId,
          userId,
          peerId,
          'ice-candidate',
          { candidate: event.candidate.toJSON() }
        );
      }
    };

    // Handle remote tracks
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(peerId, remoteStream);
        return newMap;
      });
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        removePeer(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, { peerId, connection: peerConnection, stream: null });
    return peerConnection;
  }, [classId, userId]);

  // Remove a peer connection
  const removePeer = useCallback((peerId: string) => {
    const peer = peerConnectionsRef.current.get(peerId);
    if (peer) {
      peer.connection.close();
      peerConnectionsRef.current.delete(peerId);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(peerId);
        return newMap;
      });
    }
  }, []);

  // Handle incoming signals
  const handleSignal = useCallback(async (signal: WebRTCSignal) => {
    const { sender_id: senderId, signal_type: signalType, signal_data: signalData } = signal;

    switch (signalType) {
      case 'offer': {
        let peerConnection = peerConnectionsRef.current.get(senderId)?.connection;
        if (!peerConnection) {
          peerConnection = createPeerConnection(senderId);
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await webrtcSignalingService.sendSignal(
          classId,
          userId,
          senderId,
          'answer',
          { answer }
        );
        break;
      }

      case 'answer': {
        const peerConnection = peerConnectionsRef.current.get(senderId)?.connection;
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData.answer));
        }
        break;
      }

      case 'ice-candidate': {
        const peerConnection = peerConnectionsRef.current.get(senderId)?.connection;
        if (peerConnection && signalData.candidate) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signalData.candidate));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
        break;
      }

      case 'leave': {
        removePeer(senderId);
        break;
      }

      case 'mute':
      case 'unmute':
      case 'video-on':
      case 'video-off':
      case 'hand-raise':
      case 'hand-lower':
        // Participant state changes are handled by the subscription
        break;
    }
  }, [classId, userId, createPeerConnection, removePeer]);

  // Connect to a new participant
  const connectToPeer = useCallback(async (peerId: string) => {
    if (peerId === userId || peerConnectionsRef.current.has(peerId)) return;

    const peerConnection = createPeerConnection(peerId);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await webrtcSignalingService.sendSignal(
      classId,
      userId,
      peerId,
      'offer',
      { offer }
    );
  }, [classId, userId, createPeerConnection]);

  // Join the class
  const joinClass = useCallback(async () => {
    console.log('joinClass called with userId:', userId);
    
    if (!userId) {
      console.error('Cannot join class without userId');
      return false;
    }

    try {
      // Initialize media first (can be null if permissions denied)
      const stream = await initializeMedia();
      
      if (!stream) {
        console.warn('No media stream - joining in view-only mode');
        // Still allow joining without media
      }

      // Join as participant
      console.log('Joining class as participant...');
      await webrtcSignalingService.joinClass(classId, userId);

      // Subscribe to signals
      const cleanup = webrtcSignalingService.subscribeToClass(
        classId,
        userId,
        handleSignal,
        async (updatedParticipants) => {
          console.log('Participants updated:', updatedParticipants.length);
          setParticipants(updatedParticipants);
          
          // Connect to new participants (only if we have media)
          if (stream) {
            for (const participant of updatedParticipants) {
              if (participant.user_id !== userId && participant.status === 'Présent') {
                await connectToPeer(participant.user_id);
              }
            }
          }
        }
      );

      cleanupFnRef.current = cleanup;

      // Get initial participants and connect
      const initialParticipants = await webrtcSignalingService.getParticipants(classId);
      console.log('Initial participants:', initialParticipants.length);
      setParticipants(initialParticipants);

      // Connect to existing participants (only if we have media)
      if (stream) {
        for (const participant of initialParticipants) {
          if (participant.user_id !== userId && participant.status === 'Présent') {
            await connectToPeer(participant.user_id);
          }
        }
      }

      setIsConnected(true);
      console.log('Successfully joined class');
      return true;
    } catch (error) {
      console.error('Error joining class:', error);
      return false;
    }
  }, [classId, userId, initializeMedia, handleSignal, connectToPeer]);

  // Leave the class
  const leaveClass = useCallback(async () => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((peer) => {
      peer.connection.close();
    });
    peerConnectionsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Stop screen share
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    // Leave via signaling
    await webrtcSignalingService.leaveClass(classId, userId);

    // Cleanup subscription
    if (cleanupFnRef.current) {
      cleanupFnRef.current();
      cleanupFnRef.current = null;
    }

    setIsConnected(false);
    setRemoteStreams(new Map());
    setParticipants([]);
  }, [classId, userId, isRecording, screenStream]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMediaState(prev => ({ ...prev, audio: audioTrack.enabled }));
        
        await webrtcSignalingService.updateParticipantState(classId, userId, {
          is_muted: !audioTrack.enabled
        });
      }
    }
  }, [classId, userId]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setMediaState(prev => ({ ...prev, video: videoTrack.enabled }));
        
        await webrtcSignalingService.updateParticipantState(classId, userId, {
          is_video_off: !videoTrack.enabled
        });
      }
    }
  }, [classId, userId]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(stream);
      setMediaState(prev => ({ ...prev, screenShare: true }));

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach(({ connection }) => {
        const sender = connection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };

      toast({
        title: "Partage d'écran",
        description: "Votre écran est maintenant partagé",
      });
    } catch (error) {
      console.error('Error starting screen share:', error);
      toast({
        title: "Erreur",
        description: "Impossible de partager l'écran",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    setMediaState(prev => ({ ...prev, screenShare: false }));

    // Restore camera video track
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      peerConnectionsRef.current.forEach(({ connection }) => {
        const sender = connection.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }
  }, [screenStream]);

  // Toggle hand raise
  const toggleHandRaise = useCallback(async () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    
    await webrtcSignalingService.updateParticipantState(classId, userId, {
      is_hand_raised: newState
    });
  }, [classId, userId, isHandRaised]);

  // Start recording (local recording)
  const startRecording = useCallback(() => {
    if (!localStreamRef.current) return;

    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    try {
      mediaRecorderRef.current = new MediaRecorder(localStreamRef.current, options);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${classId}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      
      toast({
        title: "Enregistrement",
        description: "L'enregistrement a commencé",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'enregistrement",
        variant: "destructive",
      });
    }
  }, [classId, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Enregistrement terminé",
        description: "L'enregistrement a été sauvegardé",
      });
    }
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveClass();
    };
  }, []);

  return {
    // State
    isConnected,
    localStream,
    screenStream,
    remoteStreams,
    participants,
    mediaState,
    isHandRaised,
    isRecording,
    localVideoRef,

    // Actions
    joinClass,
    leaveClass,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    toggleHandRaise,
    startRecording,
    stopRecording,
  };
};
