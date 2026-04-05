import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

/**
 * Fades/slides content in when it enters the viewport. Respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className,
  /** Delay after becoming visible (ms) — stack with child stagger */
  delay = 0,
  once = true,
  threshold = 0.12,
  rootMargin = '0px 0px -32px 0px',
}) {
  const ref = useRef(null);
  const [active, setActive] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setActive(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold, rootMargin]);

  return (
    <div
      ref={ref}
      className={cn(
        'will-change-[opacity,transform]',
        active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        'transition-[opacity,transform] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        'motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none',
        className,
      )}
      style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
