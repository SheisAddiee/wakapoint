// Adapted from React Bits BlurText (reactbits.dev/text-animations/blur-text).
// Only the one-time word reveal is used; see THIRD_PARTY_NOTICES.md.
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';

export function BlurText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.15 });
  const reduced = useReducedMotion();
  return <span ref={ref} className={`rb-blur-text ${className}`} aria-label={text}>
    {text.split(' ').map((word, index) => <motion.span key={`${index}-${word}`} aria-hidden="true"
      initial={false}
      animate={visible || reduced ? { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' } : { opacity: 0, filter: 'blur(4px)', transform: 'translateY(8px)' }}
      transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : Math.min(index * 0.045, 0.22), ease: [0.23, 1, 0.32, 1] }}>
      {word}{index < text.split(' ').length - 1 ? '\u00a0' : ''}
    </motion.span>)}
  </span>;
}
