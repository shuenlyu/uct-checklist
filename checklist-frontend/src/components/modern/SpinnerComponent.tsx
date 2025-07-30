import React from 'react';

const SpinnerComponent: React.FC = () => (
  <div className="inline-flex items-center">
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span className="sr-only">Loading...</span>
  </div>
);

export default SpinnerComponent;