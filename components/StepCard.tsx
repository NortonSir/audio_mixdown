
import React from 'react';
import CodeBlock from './CodeBlock';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: React.ReactNode;
  command?: string;
}

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, description, command }) => {
  return (
    <div className="bg-white dark:bg-gray-800/50 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-500 text-white rounded-full text-xl font-bold ring-4 ring-indigo-500/20">
          {stepNumber}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <div className="mt-2 text-gray-600 dark:text-gray-300 space-y-2 prose prose-indigo dark:prose-invert max-w-none">
            {description}
          </div>
        </div>
      </div>
      {command && <div className="mt-4 pl-16"><CodeBlock command={command} /></div>}
    </div>
  );
};

export default StepCard;
