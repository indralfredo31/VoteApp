import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
}

export default function ProgressBar({
  value,
  className = '',
  barClassName = '',
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!barRef.current || hasAnimatedRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(barRef.current, { scaleX: value / 100 });
      return;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: barRef.current,
        start: 'top 90%',
        onEnter: () => {
          if (hasAnimatedRef.current) return;
          hasAnimatedRef.current = true;

          gsap.to(barRef.current, {
            scaleX: value / 100,
            duration: 1.2,
            ease: 'power3.out',
          });
        },
      });
    }, barRef);

    return () => ctx.revert();
  }, [value]);

  return (
    <div className={`h-2 bg-surface-light rounded-full overflow-hidden ${className}`}>
      <div
        ref={barRef}
        className={`h-full bg-gradient-to-r from-primary to-primary-light rounded-full ${barClassName}`}
        style={{ transformOrigin: 'left', transform: 'scaleX(0)' }}
      />
    </div>
  );
}