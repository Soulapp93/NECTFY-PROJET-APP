import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Play, Pause, Volume2, VolumeX, 
  SkipBack, SkipForward, Repeat, Shuffle, 
  Maximize2, Minimize2, Music2, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface AudioViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (url: string) => void;
}

const AudioViewer: React.FC<AudioViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose,
  onShare
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const audioContextRef = useRef<AudioContext>();

  useEffect(() => {
    if (isOpen && audioRef.current) {
      setLoading(true);
      setError(false);
    }
  }, [isOpen, fileUrl]);

  // Initialize audio visualizer
  useEffect(() => {
    if (!audioRef.current || !isOpen) return;

    const initVisualizer = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;
        
        if (!analyserRef.current) {
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          const source = audioContext.createMediaElementSource(audioRef.current!);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContext.destination);
        }
      } catch (err) {
        console.log('Audio visualizer not supported');
      }
    };

    if (isPlaying) {
      initVisualizer();
      visualize();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isOpen]);

  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'hsl(var(--card))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(1, 'hsl(var(--primary) / 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    };

    draw();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }

      if (e.key === 'm') {
        toggleMute();
      }

      if (e.key === 'ArrowLeft') {
        skip(-10);
      }

      if (e.key === 'ArrowRight') {
        skip(10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, isPlaying, onClose]);

  if (!isOpen) return null;

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const vol = value[0];
    audioRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const time = value[0];
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    toast.error('Impossible de charger le fichier audio');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Téléchargement démarré');
      })
      .catch(() => {
        window.open(fileUrl, '_blank');
      });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(fileUrl);
    } else {
      navigator.clipboard.writeText(fileUrl).then(() => {
        toast.success('Lien copié dans le presse-papier');
      });
    }
  };

  const getFileExtension = () => {
    return fileName.split('.').pop()?.toUpperCase() || 'AUDIO';
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-muted/50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Music2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-medium truncate max-w-md">{fileName}</h2>
            <span className="text-xs text-muted-foreground">{getFileExtension()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {loading && !error && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse">
              <Music2 className="h-12 w-12 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Chargement...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center">
              <Music2 className="h-12 w-12 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-destructive">Erreur de lecture</h3>
              <p className="text-sm text-muted-foreground">Impossible de charger ce fichier audio</p>
            </div>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="w-full max-w-2xl space-y-8">
            {/* Visualizer */}
            <div className="relative">
              <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/50 flex items-center justify-center shadow-2xl shadow-primary/30 relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={200}
                  height={200}
                  className="absolute inset-0 rounded-full opacity-50"
                />
                <div className={`relative z-10 ${isPlaying ? 'animate-pulse' : ''}`}>
                  <Music2 className="h-20 w-20 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Track info */}
            <div className="text-center">
              <h3 className="text-xl font-semibold truncate">{fileName}</h3>
              <p className="text-sm text-muted-foreground">{getFileExtension()} Audio</p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRepeat(!isRepeat)}
                className={`h-10 w-10 ${isRepeat ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Repeat className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-10)}
                className="h-12 w-12"
              >
                <SkipBack className="h-6 w-6" />
              </Button>

              <Button
                onClick={togglePlayPause}
                size="icon"
                className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <Play className="h-8 w-8 text-primary-foreground ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(10)}
                className="h-12 w-12"
              >
                <SkipForward className="h-6 w-6" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-10 w-10"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        )}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={fileUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
};

export default AudioViewer;