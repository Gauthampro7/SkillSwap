import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('skillswap-theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
    document.body.className = `bg-theme`;
    localStorage.setItem('skillswap-theme', theme);
  }, [theme]);

  const themes = ['light', 'dark', 'midnight', 'cyberpunk', 'emerald'];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
