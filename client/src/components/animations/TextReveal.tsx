import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  threshold?: number;
}

export default function TextReveal({
  children,
  className = '',
  delay = 0,
  stagger = 0.08,
  threshold = 0.85,
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(containerRef.current.querySelectorAll('.reveal-line'), {
        opacity: 1,
        y: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      const lines = containerRef.current!.querySelectorAll('.reveal-line');

      gsap.fromTo(
        lines,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger,
          delay,
          scrollTrigger: {
            trigger: containerRef.current,
            start: `top ${threshold * 100}%`,
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [delay, stagger, threshold]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Helper component for individual lines
export function RevealLine({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal-line ${className}`}>{children}</div>;
}