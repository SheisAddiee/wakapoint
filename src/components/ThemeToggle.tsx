import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; setTheme: (value: Theme) => void } | null>(null);
const storageKey = 'wakapoint.theme.v1';
function initialTheme(): Theme {
  try { return localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151515' : '#f6f5f1');
    try { localStorage.setItem(storageKey, theme); } catch { /* The current theme remains usable. */ }
  }, [theme]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === storageKey && (event.newValue === 'dark' || event.newValue === 'light')) setTheme(event.newValue); };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider is missing.');
  return context;
}
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button>;
}
