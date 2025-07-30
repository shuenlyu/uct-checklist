// src/components/ThemeSelector.tsx - SurveyJS Theme Selector
import React, { useState } from 'react';
import { FaPalette, FaChevronDown } from 'react-icons/fa';

// SurveyJS Theme Options
const surveyThemes = [
  { name: 'Default', value: 'default', description: 'Classic SurveyJS theme' },
  { name: 'Modern', value: 'modern', description: 'Clean modern design' },
  { name: 'Sharp', value: 'sharp', description: 'Sharp edges and contrasts' },
  { name: 'Borderless', value: 'borderless', description: 'Minimal borderless design' },
  { name: 'Flat', value: 'flat', description: 'Flat design style' },
  { name: 'Plain', value: 'plain', description: 'Simple plain theme' },
  { name: 'Double Border', value: 'doubleborder', description: 'Double border styling' },
  { name: 'Layered', value: 'layered', description: 'Layered visual design' },
  { name: 'Solid', value: 'solid', description: 'Solid color scheme' },
  { name: 'Three Dimensional', value: 'threedimensional', description: '3D visual effects' },
  { name: 'Contrast', value: 'contrast', description: 'High contrast theme' },
  
  // Color-based themes
  { name: 'Blue', value: 'blue', description: 'Blue color scheme' },
  { name: 'Orange', value: 'orange', description: 'Orange color scheme' },
  { name: 'Green', value: 'green', description: 'Green color scheme' },
  { name: 'Purple', value: 'purple', description: 'Purple color scheme' },
  { name: 'Red', value: 'red', description: 'Red color scheme' },
  { name: 'Yellow', value: 'yellow', description: 'Yellow color scheme' },
  { name: 'Teal', value: 'teal', description: 'Teal color scheme' },
  { name: 'Pink', value: 'pink', description: 'Pink color scheme' },
  { name: 'Indigo', value: 'indigo', description: 'Indigo color scheme' },
  
  // Dark themes
  { name: 'Dark Blue', value: 'darkblue', description: 'Dark blue theme' },
  { name: 'Dark Green', value: 'darkgreen', description: 'Dark green theme' },
  { name: 'Dark Rose', value: 'darkrose', description: 'Dark rose theme' },
  { name: 'Stone', value: 'stone', description: 'Stone color theme' },
  { name: 'Winter', value: 'winter', description: 'Winter theme' },
];

interface ThemeSelectorProps {
  onThemeChange?: (theme: string) => void;
  currentTheme?: string;
  compact?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  onThemeChange, 
  currentTheme = 'default',
  compact = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const handleThemeSelect = (themeValue: string) => {
    setSelectedTheme(themeValue);
    setIsOpen(false);
    if (onThemeChange) {
      onThemeChange(themeValue);
    }
  };

  const selectedThemeObj = surveyThemes.find(theme => theme.value === selectedTheme) || surveyThemes[0];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium theme-text-white theme-bg-header hover:bg-white/20 rounded-lg transition-colors duration-200"
          title="Change Survey Theme"
        >
          <FaPalette className="w-4 h-4 mr-2" />
          Theme
          <FaChevronDown className={`w-3 h-3 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-64 theme-bg-secondary theme-border-light border rounded-lg theme-shadow-lg z-20 max-h-80 overflow-y-auto">
              {surveyThemes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handleThemeSelect(theme.value)}
                  className={`w-full text-left px-4 py-3 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                    selectedTheme === theme.value 
                      ? 'theme-bg-tertiary theme-text-primary' 
                      : 'theme-text-primary hover:theme-bg-tertiary'
                  }`}
                >
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-sm theme-text-secondary mt-1">{theme.description}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium theme-text-primary">
        Survey Theme
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 theme-bg-secondary theme-border-light border rounded-lg theme-text-primary hover:theme-border-medium transition-colors duration-200"
        >
          <div className="flex items-center">
            <FaPalette className="w-4 h-4 mr-3 text-blue-500" />
            <div>
              <div className="font-medium">{selectedThemeObj.name}</div>
              <div className="text-sm theme-text-secondary">{selectedThemeObj.description}</div>
            </div>
          </div>
          <FaChevronDown className={`w-4 h-4 theme-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full mt-2 w-full theme-bg-secondary theme-border-light border rounded-lg theme-shadow-lg z-20 max-h-64 overflow-y-auto">
              {surveyThemes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handleThemeSelect(theme.value)}
                  className={`w-full text-left px-4 py-3 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                    selectedTheme === theme.value 
                      ? 'theme-bg-tertiary theme-text-primary' 
                      : 'theme-text-primary hover:theme-bg-tertiary'
                  }`}
                >
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-sm theme-text-secondary mt-1">{theme.description}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ThemeSelector;