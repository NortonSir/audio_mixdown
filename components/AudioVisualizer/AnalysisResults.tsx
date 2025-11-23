import React from 'react';

interface AnalysisResultsProps {
  genderResult: string | null;
  transcriptionResult: string | null;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ genderResult, transcriptionResult }) => {
  if (!genderResult && !transcriptionResult) {
    return null;
  }

  return (
    <div className="mt-6 p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">AI 분석 결과</h3>
      <div className="space-y-4">
        {genderResult && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">예상 성별</h4>
            <p className="text-indigo-500 dark:text-indigo-400 font-medium">{genderResult}</p>
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
  );
};

export default AnalysisResults;
