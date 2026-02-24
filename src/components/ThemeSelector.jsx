import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_META = {
  light:     { label: 'Light',     dot: '#3b82f6' },
  dark:      { label: 'Dark',      dot: '#60a5fa' },
  midnight:  { label: 'Midnight',  dot: '#64748b' },
  cyberpunk: { label: 'Cyberpunk', dot: '#ff00ff' },
  emerald:   { label: 'Emerald',   dot: '#10b981' },
};

export const ThemeSelector = () => {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glass p-2.5 sm:p-3 rounded-full text-theme hover:bg-accent-theme/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Change theme"
      >
        <Palette size={20} className="shrink-0" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 glass rounded-2xl p-2 min-w-[170px] max-w-[calc(100vw-2rem)] shadow-xl"
            >
              <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wider px-3 pt-1 pb-2">
                Theme
              </p>
              {themes.map((t) => {
                const meta = THEME_META[t] || { label: t, dot: '#888' };
                const isActive = theme === t;
                return (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-accent-theme/15 text-theme'
                        : 'text-theme hover:bg-accent-theme/10'
                    }`}
                  >
                    {/* Colored dot */}
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white/10"
                      style={{ backgroundColor: meta.dot }}
                    />
                    <span className="flex-1 text-sm font-medium text-left">{meta.label}</span>
                    {isActive && <Check size={14} className="text-accent-theme flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
