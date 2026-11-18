import { useEffect, useRef } from 'react';
import { Plane, Satellite } from 'lucide-react';

const orbitText = Array.from('WAKAPOINT · LOCAL KNOWLEDGE · ');

export function HeroOrbit({ paused }: { paused: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => { if (root.current) root.current.dataset.hidden = String(document.hidden); };
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return <div className="hero-orbit" aria-hidden="true" ref={root} data-paused={paused}>
    <div className="hero-flight-path"><svg viewBox="0 0 250 180" fill="none"><path d="M 8 164 Q 36 14 230 32" stroke="currentColor" strokeDasharray="3 7"/><circle cx="230" cy="32" r="3" fill="currentColor"/></svg><span className="hero-airplane"><Plane size={29} strokeWidth={1.2}/></span></div>
    <div className="hero-satellite"><div className="hero-orbit-ring">{orbitText.map((letter, index) => <span key={index} style={{ transform: `rotate(${index * 360 / orbitText.length}deg)` }}>{letter}</span>)}</div><span className="hero-satellite-core"><Satellite size={32} strokeWidth={1.1}/><i/></span></div>
  </div>;
}
