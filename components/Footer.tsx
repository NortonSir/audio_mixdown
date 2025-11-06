import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} 오디오 파형 분석기. All Rights Reserved.
        </p>
    </footer>
  );
};

export default Footer;
