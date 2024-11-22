import React from 'react';
import './SpinnerComponent.css'; // Make sure to import the CSS

const SpinnerComponent: React.FC = () => (
  <div className="sjs-spinner">
    <div className="sjs-spinner__circle"></div>
  </div>
);

export default SpinnerComponent;