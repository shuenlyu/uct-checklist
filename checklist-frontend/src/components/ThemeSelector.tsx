// src/components/ThemeSelector.tsx - CSS Variables Version
import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSelector = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(4px)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
    >
      <div style={{ position: 'relative', width: '20px', height: '20px' }}>
        {/* Sun Icon */}
        <FaSun 
          style={{
            position: 'absolute',
            inset: '0',
            width: '20px',
            height: '20px',
            color: '#fbbf24',
            transition: 'all 0.3s ease',
            opacity: isDarkMode ? 0 : 1,
            transform: isDarkMode ? 'scale(0) rotate(180deg)' : 'scale(1) rotate(0deg)',
          }}
        />
        
        {/* Moon Icon */}
        <FaMoon 
          style={{
            position: 'absolute',
            inset: '0',
            width: '20px',
            height: '20px',
            color: '#93c5fd',
            transition: 'all 0.3s ease',
            opacity: isDarkMode ? 1 : 0,
            transform: isDarkMode ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
          }}
        />
      </div>
    </button>
  );
};

export default ThemeSelector;