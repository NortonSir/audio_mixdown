import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import UploadIcon from './icons/UploadIcon';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError('오디오 파일(MP3, WAV, OGG)만 업로드할 수 있습니다.');
      return;
    }
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg'],
    },
    multiple: false,
  });

  return (
    <div className="p-8 md:p-12 text-center">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center p-10 md:p-20 border-3 border-dashed rounded-xl cursor-pointer transition-all duration-300
        ${isDragActive ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
            <UploadIcon className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-xl font-semibold mb-2">
            {isDragActive ? '여기에 파일을 놓으세요!' : '오디오 파일을 드래그 앤 드롭하세요.'}
            </p>
            <p className="text-sm">또는 클릭하여 파일을 선택하세요.</p>
            <p className="text-xs mt-4 text-gray-400 dark:text-gray-500">(MP3, WAV, OGG 파일 지원)</p>
        </div>
      </div>
       {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default AudioUploader;
