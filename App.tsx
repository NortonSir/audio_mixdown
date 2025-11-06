import React, { useState } from 'react';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount(prevCount => prevCount + 1);
  const decrement = () => setCount(prevCount => prevCount - 1);
  const reset = () => setCount(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">카운터 앱</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">버튼을 눌러 숫자를 변경하세요.</p>
        
        <div className="text-8xl font-bold text-indigo-500 dark:text-indigo-400 my-10" aria-live="polite">
          {count}
        </div>
        
        <div className="flex justify-center items-center space-x-4">
          <button 
            onClick={decrement}
            className="px-8 py-4 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
            aria-label="Decrement count"
          >
            -1
          </button>
          <button 
            onClick={increment}
            className="px-8 py-4 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
            aria-label="Increment count"
          >
            +1
          </button>
        </div>

        <div className="mt-8">
            <button 
                onClick={reset}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-all"
                aria-label="Reset count"
            >
                초기화
            </button>
        </div>
      </div>
       <footer className="absolute bottom-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Simple Counter App. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default App;