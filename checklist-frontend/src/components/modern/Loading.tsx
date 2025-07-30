import React from 'react';

const Loading: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="relative">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="sr-only">Loading...</div>
    </div>
  </div>
);

export default Loading;