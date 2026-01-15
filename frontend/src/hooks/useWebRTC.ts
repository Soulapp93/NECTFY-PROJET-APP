import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

interface MediaState {
  audio: boolean;
  video: boolean;
}

interface StreamState {
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  isConnected: boolean;
  isScreenSharing: boolean;
}

interface WebRTCConfig {
  audio: boolean;
  video: boolean;
  iceServers?: RTCIceServer[];
}

export const useWebRTC = (config: WebRTCConfig = { audio: true, video: true }) => {
  const { toast } = useToast();
  const [mediaState, setMediaState] = useState<MediaState>({ audio: config.audio, video: config.video });
  const [streamState, setStreamState] = useState<StreamState>({
    localStream: null,
    remoteStreams: [],
    isConnected: false,
    isScreenSharing: false
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = config.iceServers || [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // Request media permissions
  const requestMediaAccess = useCallback(async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: mediaState.audio,
        video: mediaState.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      });

      localStreamRef.current = stream;
      setStreamState(prev => ({ ...prev, localStream: stream }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setPermissionGranted(true);
      
      toast({
        title: "Accès autorisé",
        description: "Caméra et microphone activés avec succès",
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      let message = "Impossible d'accéder à la caméra/microphone";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          message = "Veuillez autoriser l'accès à la caméra et au microphone";
        } else if (error.name === 'NotFoundError') {
          message = "Aucune caméra ou microphone détecté";
        }
      }

      toast({
        title: "Erreur d'accès",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [mediaState, toast]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMediaState(prev => ({ ...prev, audio: !prev.audio }));
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMediaState(prev => ({ ...prev, video: !prev.video }));
    }
  }, []);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in peer connection
      if (peerConnectionRef.current && localStreamRef.current) {
        const videoTrack = displayStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Handle screen share end
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      setStreamState(prev => ({ ...prev, isScreenSharing: true }));
      
      toast({
        title: "Partage d'écran activé",
        description: "Votre écran est maintenant partagé",
      });
    } catch (error) {
      console.error('Error starting screen share:', error);
      let message = "Impossible de partager l'écran";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          message = "Veuillez autoriser le partage d'écran dans votre navigateur";
        } else if (error.name === 'NotFoundError') {
          message = "Aucun écran disponible pour le partage";
        }
      }
      
      toast({
        title: "Partage d'écran",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        
        if (peerConnectionRef.current && videoTrack) {
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }

      setStreamState(prev => ({ ...prev, isScreenSharing: false }));
      
      toast({
        title: "Partage d'écran arrêté",
        description: "Le partage d'écran a été désactivé",
      });
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, [toast]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection({ iceServers });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer
        console.log('ICE candidate:', event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      setStreamState(prev => ({
        ...prev,
        remoteStreams: [...prev.remoteStreams, event.streams[0]]
      }));
    };

    peerConnection.onconnectionstatechange = () => {
      setStreamState(prev => ({
        ...prev,
        isConnected: peerConnection.connectionState === 'connected'
      }));
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [iceServers]);

  // Add local stream to peer connection
  const addLocalStreamToPeerConnection = useCallback(() => {
    if (localStreamRef.current && peerConnectionRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, localStreamRef.current!);
      });
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setPermissionGranted(false);
    setStreamState({
      localStream: null,
      remoteStreams: [],
      isConnected: false,
      isScreenSharing: false
    });
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // States
    mediaState,
    streamState,
    permissionGranted,
    isLoading,
    localVideoRef,
    
    // Actions
    requestMediaAccess,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    createPeerConnection,
    addLocalStreamToPeerConnection,
    cleanup
  };
};