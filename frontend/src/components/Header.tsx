import React from 'react';
import { HiSparkles } from 'react-icons/hi2';

const Header: React.FC = () => {
  return (
    <header className="hidden lg:block bg-white border-b border-gray-200 px-4 lg:px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg">
              {HiSparkles({ className: "w-5 h-5 lg:w-6 lg:h-6 text-white" }) as React.ReactElement}
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Meet Minutes AI
            </h1>
            <p className="text-xs lg:text-sm text-gray-600 font-medium">
              Insurance Policy Document analysis & insights
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 