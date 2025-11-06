import React, { useState } from 'react';
import Header from './components/Header';
import AudioUploader from './components/AudioUploader';
import AudioVisualizer from './components/AudioVisualizer';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setAudioFile(file);
  };

  const handleReset = () => {
    setAudioFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-all duration-300">
          {audioFile ? (
            <AudioVisualizer file={audioFile} onReset={handleReset} />
          ) : (
            <AudioUploader onFileSelect={handleFileSelect} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;