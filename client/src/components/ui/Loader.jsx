import React from 'react';

const Loader = ({ fullScreen = false, text = "Loading..." }) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-14 h-14">
        {/* Outer subtle ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 opacity-30"></div>
        {/* Fast spinning gradient main ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-l-purple-500 animate-[spin_0.8s_linear_infinite]"></div>
        {/* Inner pulsing core */}
        <div className="absolute inset-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-40 animate-pulse"></div>
      </div>
      {text && (
        <span className="text-gray-600 font-semibold tracking-wider text-sm uppercase animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-md transition-all duration-300">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-6 w-full">
      {loaderContent}
    </div>
  );
};

export default Loader;
