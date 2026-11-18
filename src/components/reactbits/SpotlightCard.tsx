// Adapted from React Bits SpotlightCard. The light uses a direct transform,
// with no global pointer listeners or React renders on pointer movement.
import { useRef, type ReactNode } from 'react';

export function SpotlightCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const light = useRef<HTMLSpanElement>(null);
  const bounds = useRef<DOMRect | null>(null);
  return <div className={`rb-spotlight ${className}`}
    onPointerEnter={event => { bounds.current = event.currentTarget.getBoundingClientRect(); }}
    onPointerMove={event => {
      if (!light.current || !bounds.current || event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
      light.current.style.transform = `translate(${event.clientX - bounds.current.left}px, ${event.clientY - bounds.current.top}px)`;
      light.current.style.opacity = '1';
    }}
    onPointerLeave={() => { if (light.current) light.current.style.opacity = '0'; bounds.current = null; }}>
    <span className="rb-spotlight-light" ref={light} aria-hidden="true"/>{children}
  </div>;
}
