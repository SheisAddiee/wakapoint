import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Moon, Plane, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; setTheme: (value: Theme) => void; changeTheme: (value: Theme, animate: boolean) => void } | null>(null);
const storageKey = 'wakapoint.theme.v1';
function initialTheme(): Theme {
  try { return localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [flight, setFlight] = useState<Theme | null>(null);
  const activeTransition = useRef<ViewTransition | null>(null);
  const epoch = useRef(0);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151515' : '#f6f5f1');
    try { localStorage.setItem(storageKey, theme); } catch { /* The current theme remains usable. */ }
  }, [theme]);
  const changeTheme = (value: Theme, animate: boolean) => {
    // A second toggle takes effect immediately, cancelling the in-flight reveal.
    if (activeTransition.current) {
      epoch.current += 1;
      activeTransition.current.skipTransition(); activeTransition.current = null;
      delete document.documentElement.dataset.themeFlight;
      setFlight(null); setTheme(value); return;
    }
    if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition) {
      setTheme(value); return;
    }
    const run = ++epoch.current;
    document.documentElement.dataset.themeFlight = value;
    flushSync(() => setFlight(value));
    try {
      const transition = document.startViewTransition(() => { flushSync(() => setTheme(value)); });
      activeTransition.current = transition;
      void transition.ready.catch(() => { /* The theme still applies if snapshots are unavailable. */ });
      void transition.finished.catch(() => {}).finally(() => {
        if (epoch.current !== run) return;
        activeTransition.current = null; setFlight(null);
        delete document.documentElement.dataset.themeFlight;
      });
    } catch {
      activeTransition.current = null; setFlight(null); setTheme(value);
      delete document.documentElement.dataset.themeFlight;
    }
  };
  useEffect(() => () => { epoch.current += 1; activeTransition.current?.skipTransition(); }, []);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === storageKey && (event.newValue === 'dark' || event.newValue === 'light')) setTheme(event.newValue); };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);
  return <ThemeContext.Provider value={{ theme, setTheme, changeTheme }}>{children}{flight && createPortal(<div className="theme-flight" data-destination={flight} aria-hidden="true"><span/><Plane size={58} strokeWidth={1.2}/></div>, document.body)}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider is missing.');
  return context;
}
export function ThemeToggle({ flight = false }: { flight?: boolean }) {
  const { theme, changeTheme } = useTheme();
  return <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={event => changeTheme(theme === 'dark' ? 'light' : 'dark', flight && event.detail > 0)}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button>;
}
