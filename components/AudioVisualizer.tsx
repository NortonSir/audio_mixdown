import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ResetIcon from './icons/ResetIcon';
import VolumeHighIcon from './icons/VolumeHighIcon';
import VolumeMediumIcon from './icons/VolumeMediumIcon';
import VolumeLowIcon from './icons/VolumeLowIcon';
import VolumeMuteIcon from './icons/VolumeMuteIcon';
import ZoomInIcon from './icons/ZoomInIcon';
import ZoomOutIcon from './icons/ZoomOutIcon';
import ZoomResetIcon from './icons/ZoomResetIcon';

interface AudioVisualizerProps {
  file: File;
  onReset: () => void;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ file, onReset }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const magnifierContainerRef = useRef<HTMLDivElement>(null);
  const magnifierWaveformRef = useRef<HTMLDivElement>(null);
  const magnifierWavesurferRef = useRef<WaveSurfer | null>(null);
  const initialZoomRef = useRef<number | null>(null);
  const currentZoomRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [volume, setVolume] = useState(1);
  const [lastVolume, setLastVolume] = useState(1);

  const handleResetZoom = useCallback(() => {
    if (initialZoomRef.current && wavesurferRef.current) {
        wavesurferRef.current.zoom(initialZoomRef.current);
        currentZoomRef.current = initialZoomRef.current;
        magnifierWavesurferRef.current?.zoom(initialZoomRef.current);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (currentZoomRef.current && wavesurferRef.current) {
        const newZoom = currentZoomRef.current * 1.2;
        wavesurferRef.current.zoom(newZoom);
        currentZoomRef.current = newZoom;
        magnifierWavesurferRef.current?.zoom(newZoom);
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
      if (currentZoomRef.current && wavesurferRef.current && initialZoomRef.current) {
          const newZoom = currentZoomRef.current / 1.2;
          if (newZoom < initialZoomRef.current) {
              handleResetZoom();
          } else {
              wavesurferRef.current.zoom(newZoom);
              currentZoomRef.current = newZoom;
              magnifierWavesurferRef.current?.zoom(newZoom);
          }
      }
  }, [handleResetZoom]);

  useEffect(() => {
    if (!waveformRef.current || !magnifierWaveformRef.current) return;

    const audioUrl = URL.createObjectURL(file);

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#A8B5FE',
      progressColor: '#6366F1',
      cursorColor: '#4F46E5',
      barWidth: 2,
      barRadius: 2,
      responsive: true,
      height: 130,
      normalize: true,
      url: audioUrl,
      interact: true,
      dragToSeek: true,
    });
    wavesurferRef.current = wavesurfer;
    wavesurfer.setVolume(volume);

    const magnifierWavesurfer = WaveSurfer.create({
        container: magnifierWaveformRef.current,
        waveColor: '#CBD5E1',
        progressColor: '#818CF8',
        cursorWidth: 0,
        responsive: true,
        height: 400, // 400% vertical zoom
        url: audioUrl,
        interact: false,
        hideScrollbar: true,
    });
    magnifierWavesurferRef.current = magnifierWavesurfer;


    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    let mainReady = false;
    let magnifierReady = false;
    const setInitialMagnifierZoom = () => {
        if(mainReady && magnifierReady && initialZoomRef.current && magnifierWavesurferRef.current) {
            magnifierWavesurferRef.current.zoom(initialZoomRef.current);
        }
    };

    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setDuration(formatTime(wavesurfer.getDuration()));
      if (waveformRef.current) {
        const initialZoom = waveformRef.current.clientWidth / wavesurfer.getDuration();
        initialZoomRef.current = initialZoom;
        currentZoomRef.current = initialZoom;
      }
      mainReady = true;
      setInitialMagnifierZoom();
    });
    
    magnifierWavesurfer.on('ready', () => {
        magnifierReady = true;
        setInitialMagnifierZoom();
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('audioprocess', (time) => setCurrentTime(formatTime(time)));
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      wavesurfer.seekTo(0);
      setCurrentTime(formatTime(0));
    });

    wavesurfer.on('dblclick', handleResetZoom);
    
    return () => {
      wavesurfer.destroy();
      magnifierWavesurfer.destroy();
      URL.revokeObjectURL(audioUrl);
    };
  }, [file, handleResetZoom]);

  const handlePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    wavesurferRef.current?.setVolume(newVolume);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setLastVolume(volume);
      setVolume(0);
      wavesurferRef.current?.setVolume(0);
    } else {
      setVolume(lastVolume);
      wavesurferRef.current?.setVolume(lastVolume);
    }
  };

  const getVolumeIcon = () => {
    const iconProps = { className: "w-6 h-6" };
    if (volume === 0) return <VolumeMuteIcon {...iconProps} />;
    if (volume < 0.4) return <VolumeLowIcon {...iconProps} />;
    if (volume < 0.8) return <VolumeMediumIcon {...iconProps} />;
    return <VolumeHighIcon {...iconProps} />;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const mainWaveformEl = waveformRef.current;
    const magnifierContainerEl = magnifierContainerRef.current;
    
    if (isLoading || !wavesurferRef.current || !magnifierWavesurferRef.current || !mainWaveformEl || !magnifierContainerEl) return;

    const bounds = mainWaveformEl.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    const waveformHeight = bounds.height;
    const verticalCenter = waveformHeight / 2;
    const activationThreshold = 30; // 30px

    // Hide magnifier if mouse is outside the horizontal bounds or the vertical activation area
    if (
        mouseX < 0 || 
        mouseX > bounds.width ||
        mouseY < (verticalCenter - activationThreshold) ||
        mouseY > (verticalCenter + activationThreshold)
    ) {
        magnifierContainerEl.style.display = 'none';
        return;
    }
    
    const progress = mouseX / bounds.width;
    
    const magnifierWidth = magnifierContainerEl.offsetWidth;
    let left = mouseX - magnifierWidth / 2;
    left = Math.max(0, Math.min(bounds.width - magnifierWidth, left));

    magnifierContainerEl.style.left = `${left}px`;
    magnifierContainerEl.style.display = 'block';

    magnifierWavesurferRef.current.seekTo(progress);
  };

  const handleMouseLeave = () => {
      if (magnifierContainerRef.current) {
          magnifierContainerRef.current.style.display = 'none';
      }
  };

  return (
    <div className="p-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate" title={file.name}>{file.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      
      <div 
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Magnifier View */}
        <div
            ref={magnifierContainerRef}
            className="absolute top-[-110px] h-[100px] w-[200px] bg-white dark:bg-gray-800 border-2 border-indigo-400 rounded-lg shadow-lg z-20 pointer-events-none overflow-hidden hidden"
        >
            <div 
              ref={magnifierWaveformRef} 
              className="w-full absolute"
              style={{ height: '400px', top: '-150px' }}
            ></div>
            {/* Center line indicator */}
            <div className="absolute top-0 left-1/2 w-px h-full bg-red-500 z-10 -translate-x-1/2"></div>
            {/* Horizontal center line (baseline) */}
            <div className="absolute left-0 top-1/2 w-full h-px bg-gray-400 dark:bg-gray-500 z-10 -translate-y-1/2"></div>
        </div>

        <div ref={waveformRef} className="w-full h-[130px] relative cursor-pointer">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">파형 분석 중...</p>
                </div>
            )}
        </div>
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
        팁: 파형 중앙에 마우스를 올리면 돋보기 기능이 활성화됩니다.
      </p>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="다른 파일 업로드"
        >
          <ResetIcon className="w-5 h-5"/>
          <span>다른 파일</span>
        </button>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-12 text-center">{currentTime}</span>
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
          </button>
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-12 text-center">{duration}</span>
        </div>
        
        <div className="flex items-center space-x-4">
           {/* Zoom Controls */}
           <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1 hidden sm:inline">줌</span>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="축소"
                disabled={isLoading}
              >
                <ZoomOutIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="확대"
                disabled={isLoading}
              >
                <ZoomInIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="줌 초기화"
                disabled={isLoading}
              >
                <ZoomResetIcon className="w-5 h-5" />
              </button>
            </div>

          {/* Volume Controls */}
          <div className="flex items-center space-x-2 w-[120px]">
            <button
              onClick={toggleMute}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
              aria-label={volume === 0 ? '소리 켜기' : '음소거'}>
              {getVolumeIcon()}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              aria-label="볼륨 조절"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;