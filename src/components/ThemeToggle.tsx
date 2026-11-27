import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Moon, Plane, Sun } from 'lucide-react';
import './theme-transition.css';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; setTheme: (value: Theme) => void; changeTheme: (value: Theme, animate: boolean) => void } | null>(null);
const ThemeFlightContext = createContext<Theme | null>(null);
const storageKey = 'wakapoint.theme.v1';
function initialTheme(): Theme { try { return localStorage.getItem(storageKey) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } }
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [flight, setFlight] = useState<Theme | null>(null);
  const pending = useRef(flight); pending.current = flight;
  const active = useRef<ViewTransition | null>(null), epoch = useRef(0);
  const stop = useCallback(() => { epoch.current += 1; active.current?.skipTransition(); active.current = null; pending.current = null; setFlight(null); delete document.documentElement.dataset.themeFlight; }, []);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151515' : '#f6f5f1');
    try { localStorage.setItem(storageKey, theme); } catch { /* Device persistence is optional. */ }
  }, [theme]);
  const changeTheme = useCallback((value: Theme, animate: boolean) => {
    if (!animate || pending.current || matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition) { stop(); setTheme(value); return; }
    const run = ++epoch.current;
    document.documentElement.dataset.themeFlight = value;
    pending.current = value;
    flushSync(() => setFlight(value));
    try {
      const transition = document.startViewTransition(() => { if (epoch.current === run) flushSync(() => setTheme(value)); });
      active.current = transition;
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {}).finally(() => {
        if (epoch.current !== run) return;
        active.current = null; pending.current = null; setFlight(null); delete document.documentElement.dataset.themeFlight;
      });
    } catch { stop(); setTheme(value); }
  }, [stop]);
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const end = () => { const value = pending.current; if (value) { stop(); setTheme(value); } };
    const stopMotion = () => { if (reduced.matches) end(); };
    const action = (event: Event) => { if (!(event.target instanceof Element) || !event.target.closest('.theme-toggle')) end(); };
    const sync = (event: StorageEvent) => { if (event.key === storageKey && (event.newValue === 'dark' || event.newValue === 'light')) { stop(); setTheme(event.newValue); } };
    reduced.addEventListener('change', stopMotion);
    window.addEventListener('storage', sync);
    document.addEventListener('click', action, true);
    document.addEventListener('keydown', action, true);
    window.addEventListener('wheel', end, { passive: true });
    return () => { epoch.current += 1; active.current?.skipTransition(); reduced.removeEventListener('change', stopMotion); window.removeEventListener('storage', sync); document.removeEventListener('click', action, true); document.removeEventListener('keydown', action, true); window.removeEventListener('wheel', end); };
  }, []);
  const value = useMemo(() => ({ theme, setTheme, changeTheme }), [theme, changeTheme]);
  return <ThemeContext.Provider value={value}><ThemeFlightContext.Provider value={flight}>{children}{flight && createPortal(<div className="theme-flight" data-destination={flight} aria-hidden="true"><span/><Plane size={58} strokeWidth={1.2}/></div>, document.body)}</ThemeFlightContext.Provider></ThemeContext.Provider>;
}
export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error('ThemeProvider is missing.'); return context; }
export function useThemeTransition() { return useContext(ThemeFlightContext); }
export function ThemeToggle({ flight = true }: { flight?: boolean }) {
  const { theme, changeTheme } = useTheme();
  const pendingTheme = useThemeTransition();
  const displayed = pendingTheme || theme;
  return <button className="theme-toggle" type="button" aria-label={`Switch to ${displayed === 'dark' ? 'light' : 'dark'} mode`} onClick={event => changeTheme(displayed === 'dark' ? 'light' : 'dark', flight && event.detail > 0)}><span className="theme-toggle-icon" aria-hidden="true">{displayed === 'dark' ? <Moon size={14}/> : <Sun size={14}/>}</span><span className="theme-toggle-state" aria-hidden="true">{displayed === 'dark' ? 'Dark' : 'Light'}</span></button>;
}
