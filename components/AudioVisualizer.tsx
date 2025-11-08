import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import type { Region } from 'wavesurfer.js/dist/plugins/regions.js';
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
import ScissorsIcon from './icons/ScissorsIcon';
import XCircleIcon from './icons/XCircleIcon';
import Bars3BottomLeftIcon from './icons/Bars3BottomLeftIcon';


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

// A helper function to convert AudioBuffer to a WAV Blob
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  // "RIFF"
  setUint32(0x46464952);
  // file length - 8
  setUint32(length - 8);
  // "WAVE"
  setUint32(0x45564157);
  // "fmt " chunk
  setUint32(0x20746d66);
  // length = 16
  setUint32(16);
  // PCM (uncompressed)
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  // avg. bytes/sec
  setUint32(buffer.sampleRate * 2 * numOfChan);
  // block-align
  setUint16(numOfChan * 2);
  // 16-bit
  setUint16(16);
  // "data" - chunk
  setUint32(0x61746164);
  // chunk length
  setUint32(length - pos - 4);

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next source sample
  }
  
  return new Blob([view], { type: "audio/wav" });
};


const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ file, onReset }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const wsRegionsRef = useRef<RegionsPlugin | null>(null);
  const initialZoomRef = useRef<number | null>(null);
  const currentZoomRef = useRef<number | null>(null);

  const [currentAudioFile, setCurrentAudioFile] = useState<File>(file);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00.00');
  const [duration, setDuration] = useState('00:00.00');
  const [volume, setVolume] = useState(0.8);
  const [lastVolume, setLastVolume] = useState(0.8);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);

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
  
  const manualRegionCreateHandler = useCallback((region: Region) => {
    // Manually created regions are given a specific color for visibility.
    region.color = 'rgba(168, 85, 247, 0.4)'; // A semi-transparent purple.
    if (wsRegionsRef.current) {
      wsRegionsRef.current.getRegions().forEach((r) => {
        if (r.id !== region.id) {
          r.remove();
        }
      });
    }
    setSelectedRegion(region);
  }, []);

  useEffect(() => {
    if (!waveformRef.current) return;

    setIsLoading(true);
    setSelectedRegion(null);
    setGenderResult(null);
    setSpeakerCountResult(null);
    setTranscriptionResult(null);

    const audioUrl = URL.createObjectURL(currentAudioFile);

    wsRegionsRef.current = RegionsPlugin.create();

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      ...waveformConfig,
      responsive: true,
      height: 130,
      normalize: true,
      url: audioUrl,
      interact: true,
      // dragToSeek must be false to enable region selection by dragging.
      // Click to seek is still enabled.
      dragToSeek: false,
      plugins: [wsRegionsRef.current],
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

    // Regions plugin events
    wsRegionsRef.current.on('region-created', manualRegionCreateHandler);
    wsRegionsRef.current.on('region-updated', (region) => {
        setSelectedRegion(region);
    });
    wsRegionsRef.current.on('region-removed', () => {
        setSelectedRegion(null);
    });
    wsRegionsRef.current.on('region-clicked', (region, e) => {
      e.stopPropagation()
      region.play()
    })
    
    return () => {
      wavesurfer.destroy();
      URL.revokeObjectURL(audioUrl);
    };
  }, [currentAudioFile, handleResetZoom, volume, manualRegionCreateHandler]);

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

  const handleClearSelection = () => {
    if (selectedRegion) {
        selectedRegion.remove();
    }
  };

  const handleTrim = async () => {
    if (!selectedRegion || !wavesurferRef.current) return;
    
    setIsTrimming(true);

    const originalBuffer = wavesurferRef.current.getDecodedData();
    if (!originalBuffer) {
        setIsTrimming(false);
        return;
    }

    const start = selectedRegion.start;
    const end = selectedRegion.end;
    const { sampleRate, numberOfChannels } = originalBuffer;

    const startOffset = Math.round(start * sampleRate);
    const endOffset = Math.round(end * sampleRate);
    const frameCount = endOffset - startOffset;

    if (frameCount <= 0) {
        setIsTrimming(false);
        return;
    }

    // Use a temporary AudioContext for processing
    // FIX: Cast window to 'any' to access vendor-prefixed 'webkitAudioContext' without TypeScript errors.
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newBuffer = audioContext.createBuffer(numberOfChannels, frameCount, sampleRate);

    for (let i = 0; i < numberOfChannels; i++) {
        const channelData = originalBuffer.getChannelData(i);
        const newChannelData = newBuffer.getChannelData(i);
        newChannelData.set(channelData.subarray(startOffset, endOffset));
    }

    const wavBlob = audioBufferToWav(newBuffer);
    const trimmedFile = new File([wavBlob], `trimmed_${currentAudioFile.name}.wav`, { type: 'audio/wav' });
    
    setCurrentAudioFile(trimmedFile);
    setIsTrimming(false);
  };

  const fileToBase64 = (fileToConvert: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileToConvert);
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
      const base64Audio = await fileToBase64(currentAudioFile);

      const audioPart = {
        inlineData: {
          mimeType: currentAudioFile.type,
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
      const base64Audio = await fileToBase64(currentAudioFile);

      const audioPart = {
        inlineData: {
          mimeType: currentAudioFile.type,
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
      const base64Audio = await fileToBase64(currentAudioFile);

      const audioPart = {
        inlineData: {
          mimeType: currentAudioFile.type,
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

  const handleDetectSilenceAndSplit = async () => {
    if (!wavesurferRef.current || !wsRegionsRef.current) return;
    setIsSplitting(true);
    // Clear previous results and selections
    setGenderResult(null);
    setSpeakerCountResult(null);
    setTranscriptionResult(null);
    wsRegionsRef.current.clearRegions();
    setSelectedRegion(null);

    try {
        await new Promise(resolve => setTimeout(resolve, 10)); // Yield to allow UI update

        const audioBuffer = wavesurferRef.current.getDecodedData();
        if (!audioBuffer) {
            console.error("Could not get audio buffer");
            return;
        }

        const sampleRate = audioBuffer.sampleRate;
        // Use the first channel for silence detection
        const channelData = audioBuffer.getChannelData(0); 

        const SILENCE_THRESHOLD = 0.02; // -34dBFS, a reasonable starting point
        const MIN_SILENCE_DURATION_S = 0.4; // 400ms of silence
        const MIN_SEGMENT_DURATION_S = 0.2; // 200ms minimum segment length
        const MERGE_GAP_S = 0.15; // Merge segments separated by less than 150ms

        const minSilenceSamples = Math.floor(MIN_SILENCE_DURATION_S * sampleRate);
        const minSegmentSamples = Math.floor(MIN_SEGMENT_DURATION_S * sampleRate);
        
        let silentRegions = [];
        let silenceStart = -1;
        
        // 1. Find all silent regions that are long enough
        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) < SILENCE_THRESHOLD) {
                if (silenceStart === -1) {
                    silenceStart = i;
                }
            } else {
                if (silenceStart !== -1) {
                    if (i - silenceStart >= minSilenceSamples) {
                        silentRegions.push({ start: silenceStart, end: i });
                    }
                    silenceStart = -1;
                }
            }
        }
        if (silenceStart !== -1 && (channelData.length - silenceStart) >= minSilenceSamples) {
            silentRegions.push({ start: silenceStart, end: channelData.length });
        }
        
        // 2. Derive sound segments from the gaps between silent regions
        let soundSegments = [];
        let lastEnd = 0;
        silentRegions.forEach(silentRegion => {
            const start = lastEnd;
            const end = silentRegion.start;
            if (end - start > minSegmentSamples) {
                soundSegments.push({ start: start / sampleRate, end: end / sampleRate });
            }
            lastEnd = silentRegion.end;
        });
        
        if (channelData.length - lastEnd > minSegmentSamples) {
             soundSegments.push({ start: lastEnd / sampleRate, end: channelData.length / sampleRate });
        }

        // 3. Merge segments that are very close to each other
        if (soundSegments.length > 1) {
            const mergedSegments = [soundSegments[0]];
            for (let i = 1; i < soundSegments.length; i++) {
                const lastMerged = mergedSegments[mergedSegments.length - 1];
                const current = soundSegments[i];
                if (current.start - lastMerged.end < MERGE_GAP_S) {
                    lastMerged.end = current.end; // merge by extending the previous segment
                } else {
                    mergedSegments.push(current);
                }
            }
            soundSegments = mergedSegments;
        }

        // 4. Add regions to wavesurfer for visualization
        if (wsRegionsRef.current) {
            wsRegionsRef.current.un('region-created', manualRegionCreateHandler);
            const colors = [
                'rgba(250, 204, 21, 0.3)', // amber
                'rgba(59, 130, 246, 0.3)', // blue
                'rgba(16, 185, 129, 0.3)', // emerald
                'rgba(239, 68, 68, 0.3)', // red
                'rgba(139, 92, 246, 0.3)', // violet
            ];

            soundSegments.forEach((segment, index) => {
                wsRegionsRef.current?.addRegion({
                    start: segment.start,
                    end: segment.end,
                    color: colors[index % colors.length],
                    drag: false,
                    resize: true,
                    content: `구간 ${index + 1}`
                });
            });
            wsRegionsRef.current.on('region-created', manualRegionCreateHandler);
        }

    } catch (error) {
        console.error("Error splitting audio by silence:", error);
    } finally {
        setIsSplitting(false);
    }
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
              {(isLoading || isTrimming || isSplitting) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-700/50 rounded-lg z-30">
                      <p className="text-gray-500 dark:text-gray-400">{isTrimming ? '오디오 자르는 중...' : isSplitting ? '자동으로 구간 나누는 중...' : '파형 분석 중...'}</p>
                  </div>
              )}
          </div>
        </div>
        
        {selectedRegion && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2 font-mono">
                선택 영역: {formatTime(selectedRegion.start)} &mdash; {formatTime(selectedRegion.end)}
            </div>
        )}

        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">
          팁: 파형 위에서 드래그하여 영역을 선택하고 자를 수 있습니다.
        </p>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onReset}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="다른 파일 업로드"
            >
              <ResetIcon className="w-5 h-5"/>
              <span>다른 파일</span>
            </button>
            <div className="flex items-center border-l border-gray-200 dark:border-gray-600 ml-2 pl-2 space-x-1">
                 <button
                    onClick={handleTrim}
                    disabled={!selectedRegion || isTrimming || isLoading || isSplitting}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-pink-600 dark:text-pink-300 bg-pink-100 dark:bg-pink-900/50 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="선택 영역 자르기"
                    title="선택 영역 자르기"
                >
                    <ScissorsIcon className="w-5 h-5"/>
                    <span className="hidden sm:inline">자르기</span>
                </button>
                {selectedRegion && (
                    <button
                        onClick={handleClearSelection}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        aria-label="선택 해제"
                        title="선택 해제"
                    >
                        <XCircleIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
          </div>
           <div className="flex items-center space-x-2">
            <button
              onClick={handleAnalyzeGender}
              disabled={isAnalyzingGender || isAnalyzingSpeakers || isTranscribing || isLoading || isTrimming || isSplitting}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="성별 분석하기"
            >
              <SparklesIcon className="w-5 h-5"/>
              <span>{isAnalyzingGender ? '분석 중...' : '성별'}</span>
            </button>
            <button
              onClick={handleAnalyzeSpeakers}
              disabled={isAnalyzingGender || isAnalyzingSpeakers || isTranscribing || isLoading || isTrimming || isSplitting}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-teal-600 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="화자 구분하기"
            >
              <UsersIcon className="w-5 h-5"/>
              <span>{isAnalyzingSpeakers ? '분석 중...' : '화자'}</span>
            </button>
             <button
              onClick={handleTranscribe}
              disabled={isAnalyzingGender || isAnalyzingSpeakers || isTranscribing || isLoading || isTrimming || isSplitting}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="텍스트생성"
            >
              <DocumentTextIcon className="w-5 h-5"/>
              <span>{isTranscribing ? '생성 중...' : '텍스트'}</span>
            </button>
            <button
              onClick={handleDetectSilenceAndSplit}
              disabled={isAnalyzingGender || isAnalyzingSpeakers || isTranscribing || isLoading || isTrimming || isSplitting}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-orange-600 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/50 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="자동 구간 나누기"
            >
              <Bars3BottomLeftIcon className="w-5 h-5"/>
              <span>{isSplitting ? '분석 중...' : '구간 나누기'}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-20 text-center">{currentTime}</span>
            <button
              onClick={handlePlayPause}
              disabled={isLoading || isTrimming || isSplitting}
              className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
            </button>
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-20 text-center">{duration}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1 hidden sm:inline">줌</span>
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="축소"
                  disabled={isLoading || isTrimming || isSplitting}
                >
                  <ZoomOutIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="확대"
                  disabled={isLoading || isTrimming || isSplitting}
                >
                  <ZoomInIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="줌 초기화"
                  disabled={isLoading || isTrimming || isSplitting}
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