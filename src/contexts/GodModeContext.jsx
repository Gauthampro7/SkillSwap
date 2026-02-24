import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'skillswap-ultra-mode';

const GodModeContext = createContext();

export const useGodMode = () => {
  const ctx = useContext(GodModeContext);
  if (!ctx) throw new Error('useGodMode must be used within GodModeProvider');
  return ctx;
};

export const GodModeProvider = ({ children }) => {
  const [godMode, setGodModeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (godMode) localStorage.setItem(STORAGE_KEY, 'true');
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [godMode]);

  const setGodMode = (value) => setGodModeState(Boolean(value));
  const toggleGodMode = () => setGodModeState((v) => !v);

  return (
    <GodModeContext.Provider value={{ godMode, setGodMode, toggleGodMode }}>
      {children}
    </GodModeContext.Provider>
  );
};
