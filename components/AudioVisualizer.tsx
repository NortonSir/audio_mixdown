import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { GoogleGenAI } from "@google/genai";
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
import SparklesIcon from './icons/SparklesIcon';
import UsersIcon from './icons/UsersIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';

interface AudioVisualizerProps {
  file: File;
  onReset: () => void;
}

// 네온 파형 스타일
const neonWaveformConfig = {
  waveColor: '#EC4899',
  progressColor: '#A855F7',
  cursorColor: '#FBBF24',
  barWidth: 3,
  barRadius: 3,
};


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
  const [volume, setVolume] = useState(0.8);
  const [lastVolume, setLastVolume] = useState(0.8);
  const [isAnalyzingGender, setIsAnalyzingGender] = useState(false);
  const [genderResult, setGenderResult] = useState<string | null>(null);
  const [isAnalyzingSpeakers, setIsAnalyzingSpeakers] = useState(false);
  const [speakerCountResult, setSpeakerCountResult] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);


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
      ...neonWaveformConfig,
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
        waveColor: '#CBD5E1', // Magnifier has a fixed color for clarity
        progressColor: '#818CF8', // Magnifier has a fixed color for clarity
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyzeGender = async () => {
    setIsAnalyzingGender(true);
    setGenderResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const base64Audio = await fileToBase64(file);

      const audioPart = {
        inlineData: {
          mimeType: file.type,
          data: base64Audio,
        },
      };
      
      const prompt = "이 오디오 파일에 사람의 목소리가 있다면, 그 목소리의 성별이 남성인지 여성인지 판단해주세요. 가능한 답변은 '남성', '여성' 또는 '판단 불가' 중 하나여야 합니다. 다른 설명은 추가하지 마세요.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, {text: prompt}] },
      });

      setGenderResult(response.text);

    } catch (error) {
      console.error("Error analyzing audio for gender:", error);
      setGenderResult('분석에 실패했습니다.');
    } finally {
      setIsAnalyzingGender(false);
    }
  };

  const handleAnalyzeSpeakers = async () => {
    setIsAnalyzingSpeakers(true);
    setSpeakerCountResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const base64Audio = await fileToBase64(file);

      const audioPart = {
        inlineData: {
          mimeType: file.type,
          data: base64Audio,
        },
      };
      
      const prompt = "이 오디오 파일에서 뚜렷하게 구분되는 화자의 수를 알려주세요. 가능한 답변은 '1명', '2명', '3명 이상', '판단 불가' 중 하나여야 합니다. 다른 설명은 추가하지 마세요.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, {text: prompt}] },
      });

      setSpeakerCountResult(response.text);

    } catch (error) {
      console.error("Error analyzing audio for speakers:", error);
      setSpeakerCountResult('분석에 실패했습니다.');
    } finally {
      setIsAnalyzingSpeakers(false);
    }
  };

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    setTranscriptionResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const base64Audio = await fileToBase64(file);

      const audioPart = {
        inlineData: {
          mimeType: file.type,
          data: base64Audio,
        },
      };
      
      const prompt = "이 오디오 파일의 음성을 텍스트로 변환해주세요. 만약 노래라면 가사 형식으로 작성해주세요.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, {text: prompt}] },
      });

      setTranscriptionResult(response.text);

    } catch (error) {
      console.error("Error transcribing audio:", error);
      setTranscriptionResult('텍스트 생성에 실패했습니다.');
    } finally {
      setIsTranscribing(false);
    }
  };


  return (
    <div className="p-8">
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate" title={file.name}>{file.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      
      <div className="mb-6">
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
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onReset}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="다른 파일 업로드"
            >
              <ResetIcon className="w-5 h-5"/>
              <span>다른 파일</span>
            </button>
            <button
              onClick={handleAnalyzeGender}
              disabled={isAnalyzingGender || isAnalyzingSpeakers || isTranscribing || isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="성별 분석하기"
            >
              <SparklesIcon className="w-5 h-5"/>
              <span>{isAnalyzingGender ? '분석 중...' : '성별 분석하기'}</span>
            </button>
            <button
              onClick={handleAnalyzeSpeakers}
              disabled={isAnalyzingGender || isAnalyzingSpeakers || isTranscribing || isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="화자 구분하기"
            >
              <UsersIcon className="w-5 h-5"/>
              <span>{isAnalyzingSpeakers ? '분석 중...' : '화자 구분하기'}</span>
            </button>
             <button
              onClick={handleTranscribe}
              disabled={isAnalyzingGender || isAnalyzingSpeakers || isTranscribing || isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="텍스트생성"
            >
              <DocumentTextIcon className="w-5 h-5"/>
              <span>{isTranscribing ? '생성 중...' : '텍스트생성'}</span>
            </button>
          </div>
          
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
      {(genderResult || speakerCountResult || transcriptionResult) && (
        <div className="mt-6 p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">AI 분석 결과</h3>
          <div className="space-y-4">
            {genderResult && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">예상 성별</h4>
                <p className="text-indigo-500 dark:text-indigo-400 font-medium">{genderResult}</p>
              </div>
            )}
            {speakerCountResult && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">예상 화자 수</h4>
                <p className="text-teal-500 dark:text-teal-400 font-medium">{speakerCountResult}</p>
              </div>
            )}
            {transcriptionResult && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">텍스트 변환 내용</h4>
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans bg-white dark:bg-gray-800 p-4 rounded-md shadow-inner max-h-60 overflow-y-auto">{transcriptionResult}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;