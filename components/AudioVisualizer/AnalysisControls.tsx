import React from 'react';
import { ResetIcon, SparklesIcon, DocumentTextIcon } from '../icons';

interface AnalysisControlsProps {
  isAnalyzingGender: boolean;
  isTranscribing: boolean;
  isLoading: boolean;
  isAiAvailable: boolean;
  onReset: () => void;
  onAnalyzeGender: () => void;
  onTranscribe: () => void;
}

const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  isAnalyzingGender,
  isTranscribing,
  isLoading,
  isAiAvailable,
  onReset,
  onAnalyzeGender,
  onTranscribe,
}) => {
  return (
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
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onAnalyzeGender}
          disabled={!isAiAvailable || isAnalyzingGender || isTranscribing || isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="성별 분석하기"
          title={!isAiAvailable ? 'Gemini API 키가 필요합니다.' : '성별 분석하기'}
        >
          <SparklesIcon className="w-5 h-5"/>
          <span>{isAnalyzingGender ? '분석 중...' : '성별'}</span>
        </button>
        <button
          onClick={onTranscribe}
          disabled={!isAiAvailable || isAnalyzingGender || isTranscribing || isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="텍스트생성"
          title={!isAiAvailable ? 'Gemini API 키가 필요합니다.' : '텍스트 생성하기'}
        >
          <DocumentTextIcon className="w-5 h-5"/>
          <span>{isTranscribing ? '생성 중...' : '텍스트'}</span>
        </button>
      </div>
    </div>
  );
};

export default AnalysisControls;
