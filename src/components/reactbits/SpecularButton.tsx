// Adapted from React Bits SpecularButton (reactbits.dev/components/specular-button).
// A fixed gradient replaces the shader while preserving the pointer highlight,
// native button semantics and WakaPoint's existing sizes/colors.
import { useRef, type ButtonHTMLAttributes } from 'react';

export function SpecularButton({ children, className = '', type = 'button', disabled, onPointerMove, onPointerLeave, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const light = useRef<HTMLSpanElement>(null);
  return <button {...props} type={type} disabled={disabled} className={`specular-button ${className}`}
    onPointerMove={event => {
      onPointerMove?.(event);
      if (disabled || event.pointerType !== 'mouse' || !light.current || !matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      light.current.style.transform = `translate(${event.clientX - rect.left}px, ${event.clientY - rect.top}px)`;
      light.current.style.opacity = '1';
    }}
    onPointerLeave={event => { onPointerLeave?.(event); if (light.current) light.current.style.opacity = '0'; }}>
    <span className="specular-light" ref={light} aria-hidden="true"/>
    <span className="specular-label">{children}</span>
  </button>;
}
