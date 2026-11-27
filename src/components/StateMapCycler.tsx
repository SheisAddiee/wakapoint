import { useEffect, useRef, useState } from 'react';
import { nigeriaMaps } from '../data/nigeriaMaps';
import './state-maps.css';
import { useThemeTransition } from './ThemeToggle';

// A fixed inline slot keeps the headline still while only its map changes.
export function StateMapCycler({ paused = false, initialIndex = 0, phaseDelay = 0 }: { paused?: boolean; initialIndex?: number; phaseDelay?: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [frame, setFrame] = useState({ index: initialIndex, previous: -1, animate: false });
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(true), [pageVisible, setPageVisible] = useState(!document.hidden);
  const [manualChange, setManualChange] = useState(0);
  const themeTransition = useThemeTransition();
  const active = !paused && !reduced && visible && pageVisible && !themeTransition;
  const advance = (animate: boolean) => setFrame(current => ({ index: (current.index + 1) % nigeriaMaps.length, previous: animate ? current.index : -1, animate }));
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(preference.matches), visibility = () => setPageVisible(!document.hidden);
    preference.addEventListener('change', motion); document.addEventListener('visibilitychange', visibility);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 }) : null;
    if (ref.current) observer?.observe(ref.current);
    return () => { preference.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); observer?.disconnect(); };
  }, []);
  useEffect(() => {
    if (!active) { setFrame(current => current.animate || current.previous >= 0 ? { ...current, previous: -1, animate: false } : current); return; }
    let timer: number | undefined;
    const first = window.setTimeout(() => { advance(true); timer = window.setInterval(() => advance(true), 2400); }, 2400 + (manualChange ? 0 : phaseDelay));
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [active, manualChange, phaseDelay]);
  const current = nigeriaMaps[frame.index];
  const animate = active && frame.animate;
  return <button ref={ref} type="button" className="hero-state-map" data-state={current.name} data-animated={animate} title={`${current.name} — show next map`} aria-label={`Show next Nigerian map. Currently ${current.name}.`} onClick={event => { advance(event.detail > 0 && active); setManualChange(value => value + 1); }}>
    <span className="hero-map-window" aria-hidden="true">
      {animate && frame.previous >= 0 && <span className="hero-map-layer hero-map-outgoing" key={`out-${frame.previous}`} onAnimationEnd={() => setFrame(value => ({ ...value, previous: -1 }))}><svg viewBox="0 0 100 100"><path d={nigeriaMaps[frame.previous].path} fillRule="evenodd"/></svg></span>}
      <span className={`hero-map-layer ${animate ? 'hero-map-incoming' : ''}`} key={`in-${frame.index}`}><svg viewBox="0 0 100 100"><path d={current.path} fillRule="evenodd"/></svg></span>
    </span>
  </button>;
}
