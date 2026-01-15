import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Maximize2, Minimize2, Volume2, VolumeX, Play, Pause, ExternalLink } from 'lucide-react';
import { Button } from '../button';
import { toast } from 'sonner';

interface EnhancedMediaViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: 'video' | 'audio' | 'image';
  onClose: () => void;
}

const EnhancedMediaViewer: React.FC<EnhancedMediaViewerProps> = ({
  fileUrl,
  fileName,
  fileType,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isPlaying, isMuted]);

  const togglePlayPause = () => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    mediaRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast.error('Erreur mode plein écran');
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      toast.error('Impossible de télécharger le fichier');
    }
  };

  const openInNewTab = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur lors de l\'ouverture');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Fichier ouvert dans un nouvel onglet');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Erreur d\'ouverture:', error);
      toast.error('Impossible d\'ouvrir le fichier');
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMedia = () => {
    if (fileType === 'image') {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center bg-black">
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={fileUrl}
              className="max-w-full max-h-full"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
          {renderControls()}
        </div>
      );
    }

    if (fileType === 'audio') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Volume2 className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">{fileName}</h3>
            </div>
            
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={fileUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {renderControls()}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderControls = () => {
    if (fileType === 'image') return null;

    return (
      <div className="bg-[#323639] p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400 min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gray-400 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#525659] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#323639] border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-200 truncate max-w-md">
          {fileName}
        </h2>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <div className="h-6 w-px bg-gray-600 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media Content */}
      <div className="flex-1 overflow-hidden">
        {renderMedia()}
      </div>
    </div>
  );
};

export default EnhancedMediaViewer;
