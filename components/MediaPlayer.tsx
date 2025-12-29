
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, X, MoreHorizontal, PictureInPicture, ChevronDown } from 'lucide-react';
import { QUALITIES, SPEEDS } from '../constants';

interface MediaPlayerProps {
  url: string;
  onClose: () => void;
  title: string;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ url, onClose, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState('1080p');
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const p = (video.currentTime / video.duration) * 100;
      setProgress(p);
      setCurrentTime(formatTime(video.currentTime));
    };

    const handleLoadedMetadata = () => {
      setDuration(formatTime(video.duration));
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * (videoRef.current?.duration || 0);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (videoRef.current) {
      await videoRef.current.requestPictureInPicture();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-sans overflow-hidden">
      <div 
        className="relative w-full h-full max-w-5xl group"
        onMouseMove={() => { setShowControls(true); }}
        onMouseLeave={() => { setShowControls(false); }}
      >
        <video 
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          playsInline
        />

        {/* Top Overlay */}
        <div className={`absolute top-0 left-0 right-0 p-4 transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-gold font-luxury font-bold text-lg drop-shadow-lg">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={togglePiP} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <PictureInPicture className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Settings className={`w-5 h-5 ${showSettings ? 'text-gold' : ''}`} />
            </button>
          </div>
        </div>

        {/* Settings Menu */}
        {showSettings && (
          <div className="absolute top-16 right-4 w-48 bg-charcoal border border-gold/30 rounded-lg p-3 z-50 animate-in fade-in zoom-in duration-200 shadow-2xl">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Quality</p>
                <div className="grid grid-cols-2 gap-1">
                  {QUALITIES.map(q => (
                    <button 
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`text-xs p-1.5 rounded transition-colors ${quality === q ? 'bg-gold text-black font-bold' : 'hover:bg-white/10 text-gray-300'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Speed</p>
                <div className="grid grid-cols-3 gap-1">
                  {SPEEDS.map(s => (
                    <button 
                      key={s}
                      onClick={() => {
                        setSpeed(s);
                        if (videoRef.current) videoRef.current.playbackRate = s;
                      }}
                      className={`text-xs p-1.5 rounded transition-colors ${speed === s ? 'bg-gold text-black font-bold' : 'hover:bg-white/10 text-gray-300'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center Play/Pause */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-gold/20 backdrop-blur-md rounded-full flex items-center justify-center border border-gold/50 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <Play className="w-10 h-10 text-gold fill-gold ml-1" />
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 bg-gradient-to-t from-black/80 to-transparent ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xs text-gray-300 font-mono">{currentTime}</span>
            <div className="relative flex-1 group/bar">
              <input 
                type="range"
                value={progress}
                onChange={handleSeek}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gold group-hover/bar:h-2 transition-all"
              />
              <div className="absolute top-0 left-0 h-1 bg-gold rounded-lg pointer-events-none group-hover/bar:h-2" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-gray-300 font-mono">{duration}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button className="text-white hover:text-gold transition-colors"><SkipBack className="w-6 h-6" /></button>
              <button onClick={togglePlay} className="text-white hover:text-gold transition-colors">
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
              </button>
              <button className="text-white hover:text-gold transition-colors"><SkipForward className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-2 group/vol">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-gold transition-colors">
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    setIsMuted(v === 0);
                    if (videoRef.current) videoRef.current.volume = v;
                  }}
                  className="w-0 group-hover/vol:w-20 transition-all duration-300 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-gold"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded border border-gold/30 font-bold">{quality}</span>
              <button onClick={toggleFullscreen} className="text-white hover:text-gold transition-colors">
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
