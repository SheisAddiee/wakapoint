// Adapted from React Bits BlurText (reactbits.dev/text-animations/blur-text).
// Only the one-time word reveal is used; see THIRD_PARTY_NOTICES.md.
import { useEffect, useRef, useState } from 'react';

export function BlurText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const words = text.split(' ');
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    observer.observe(element);
    const reveal = () => { if (reduced.matches) { setVisible(true); observer.disconnect(); } };
    reduced.addEventListener('change', reveal);
    return () => { observer.disconnect(); reduced.removeEventListener('change', reveal); };
  }, []);
  return <span ref={ref} className={`rb-blur-text ${className}`} aria-label={text} data-revealed={visible}>
    {words.map((word, index) => <span key={`${index}-${word}`} aria-hidden="true" style={{ transitionDelay: `${Math.min(index * 20, 80)}ms` }}>
      {word}{index < words.length - 1 ? '\u00a0' : ''}
    </span>)}
  </span>;
}
