import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
        <div className="bg-gradient-to-r from-transparent via-gray-500 to-transparent h-full w-full animate-shimmer"></div>
    </div>
  );
};

export default Loader;