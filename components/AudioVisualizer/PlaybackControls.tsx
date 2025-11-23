import React from 'react';
import { PlayIcon, PauseIcon, VolumeHighIcon, VolumeMediumIcon, VolumeLowIcon, VolumeMuteIcon, ZoomInIcon, ZoomOutIcon, ZoomResetIcon } from '../icons';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: string;
  duration: string;
  volume: number;
  onPlayPause: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isLoading,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onVolumeChange,
  onToggleMute,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const getVolumeIcon = () => {
    const iconProps = { className: "w-6 h-6" };
    if (volume === 0) return <VolumeMuteIcon {...iconProps} />;
    if (volume < 0.4) return <VolumeLowIcon {...iconProps} />;
    if (volume < 0.8) return <VolumeMediumIcon {...iconProps} />;
    return <VolumeHighIcon {...iconProps} />;
  };

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-mono text-gray-500 dark:text-gray-400 w-20 text-center">{currentTime}</span>
        <button
          onClick={onPlayPause}
          disabled={isLoading}
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
              onClick={onZoomOut}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="축소"
              disabled={isLoading}
            >
              <ZoomOutIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onZoomIn}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="확대"
              disabled={isLoading}
            >
              <ZoomInIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onResetZoom}
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
            onClick={onToggleMute}
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
            onChange={onVolumeChange}
            className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            aria-label="볼륨 조절"
          />
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;
