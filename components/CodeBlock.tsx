
import React, { useState } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface CodeBlockProps {
  command: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ command }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command.replace(/\n/g, ' && '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 my-2 flex items-center justify-between group">
      <pre className="text-sm md:text-base font-mono overflow-x-auto whitespace-pre-wrap">
        <code>{command}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="p-2 ml-2 rounded-md bg-gray-700/50 opacity-50 group-hover:opacity-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-200"
        aria-label="Copy command to clipboard"
      >
        {copied ? (
          <CheckIcon className="w-5 h-5 text-green-400" />
        ) : (
          <ClipboardIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </div>
  );
};

export default CodeBlock;
