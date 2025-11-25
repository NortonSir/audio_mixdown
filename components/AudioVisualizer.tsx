import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { analyzeGender, transcribeAudio, isAiConfigured } from '../src/services/geminiService';

import AnalysisResults from './AudioVisualizer/AnalysisResults';
import PlaybackControls from './AudioVisualizer/PlaybackControls';
import AnalysisControls from './AudioVisualizer/AnalysisControls';


interface AudioVisualizerProps {
  file: File;
  onReset: () => void;
}

// 모던 파형 스타일
const waveformConfig = {
  waveColor: 'rgb(148, 163, 184)', // slate-400
  progressColor: 'rgb(71, 85, 105)', // slate-600
  cursorColor: '#FBBF24',
  barWidth: 3,
  barRadius: 3,
};

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(Math.floor((time % 1) * 100)).padStart(2, '0')}`;
};

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ file, onReset }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const initialZoomRef = useRef<number | null>(null);
  const currentZoomRef = useRef<number | null>(null);

  const [currentAudioFile, setCurrentAudioFile] = useState<File>(file);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00.00');
  const [duration, setDuration] = useState('00:00.00');
  const [volume, setVolume] = useState(0.8);
  const [lastVolume, setLastVolume] = useState(0.8);

  const [isAnalyzingGender, setIsAnalyzingGender] = useState(false);
  const [genderResult, setGenderResult] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [isAiAvailable, setIsAiAvailable] = useState(false);

  useEffect(() => {
    setIsAiAvailable(isAiConfigured());
  }, []);


  const handleResetZoom = useCallback(() => {
    if (initialZoomRef.current && wavesurferRef.current) {
        wavesurferRef.current.zoom(initialZoomRef.current);
        currentZoomRef.current = initialZoomRef.current;
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (currentZoomRef.current && wavesurferRef.current) {
        const newZoom = currentZoomRef.current * 1.2;
        wavesurferRef.current.zoom(newZoom);
        currentZoomRef.current = newZoom;
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
          }
      }
  }, [handleResetZoom]);
  
  useEffect(() => {
    if (!waveformRef.current) return;

    setIsLoading(true);
    setGenderResult(null);
    setTranscriptionResult(null);

    const audioUrl = URL.createObjectURL(currentAudioFile);

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      ...waveformConfig,
      responsive: true,
      height: 130,
      normalize: true,
      url: audioUrl,
      dragToSeek: true,
    });
    wavesurferRef.current = wavesurfer;
    wavesurfer.setVolume(volume);

    wavesurfer.on('ready', () => {
      setIsLoading(false);
      setDuration(formatTime(wavesurfer.getDuration()));
      if (waveformRef.current) {
        const initialZoom = waveformRef.current.clientWidth / wavesurfer.getDuration();
        initialZoomRef.current = initialZoom;
        currentZoomRef.current = initialZoom;
      }
    });
    
    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('timeupdate', (time) => setCurrentTime(formatTime(time)));
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      wavesurfer.seekTo(0);
      setCurrentTime(formatTime(0));
    });
    wavesurfer.on('dblclick', handleResetZoom);
    
    return () => {
      wavesurfer.destroy();
      URL.revokeObjectURL(audioUrl);
    };
  }, [currentAudioFile, handleResetZoom, volume]);

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

  const handleAnalyzeGender = async () => {
    setIsAnalyzingGender(true);
    setGenderResult(null);
    const result = await analyzeGender(currentAudioFile);
    setGenderResult(result);
    setIsAnalyzingGender(false);
  };

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    setTranscriptionResult(null);
    const result = await transcribeAudio(currentAudioFile);
    setTranscriptionResult(result);
    setIsTranscribing(false);
  };

  return (
    <div className="p-8">
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate" title={currentAudioFile.name}>{currentAudioFile.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{(currentAudioFile.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      
      <div className="mb-2">
        <div className="relative">
          <div ref={waveformRef} className="w-full h-[130px] relative">
              {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-700/50 rounded-lg z-30">
                      <p className="text-gray-500 dark:text-gray-400">파형 분석 중...</p>
                  </div>
              )}
          </div>
        </div>
        
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
          팁: 타임라인을 드래그하여 이동할 수 있습니다. 더블 클릭 시 줌이 초기화됩니다.
        </p>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <AnalysisControls
            isAnalyzingGender={isAnalyzingGender}
            isTranscribing={isTranscribing}
            isLoading={isLoading}
            isAiAvailable={isAiAvailable}
            onReset={onReset}
            onAnalyzeGender={handleAnalyzeGender}
            onTranscribe={handleTranscribe}
          />
          
          <PlaybackControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onPlayPause={handlePlayPause}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
          />
        </div>
      </div>
      <AnalysisResults genderResult={genderResult} transcriptionResult={transcriptionResult} />
    </div>
  );
};

export default AudioVisualizer;
