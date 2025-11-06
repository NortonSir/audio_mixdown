import React from 'react';
import WaveformIcon from './icons/WaveformIcon';

const Header: React.FC = () => {
  // Mock user data
  const user = {
    name: 'Jihun Kim',
    avatarUrl: 'https://i.pravatar.cc/150?u=jihunkim',
  };

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <WaveformIcon className="w-8 h-8 text-indigo-500" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              오디오 파형 분석기
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
              {user.name} 님, 환영합니다.
            </span>
            <img
              className="w-10 h-10 rounded-full ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800 ring-indigo-500"
              src={user.avatarUrl}
              alt="User avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;