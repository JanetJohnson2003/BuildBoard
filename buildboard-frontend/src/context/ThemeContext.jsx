import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [performanceMode, setPerformanceMode] = useState(() => {
    return localStorage.getItem('cyberboard-performance-mode') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Add transition class before changing theme to animate it
    root.classList.add('theme-transition');
    
    // Allow a small delay for the browser to register the transition class
    const timeoutId = setTimeout(() => {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
      
      // Remove transition class after animation completes (300ms)
      setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 300);
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cyberboard-performance-mode', performanceMode.toString());
    // Trigger storage event for hooks listening to this across tabs/components
    window.dispatchEvent(new Event('storage'));
  }, [performanceMode]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const togglePerformanceMode = () => {
    setPerformanceMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, performanceMode, togglePerformanceMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

