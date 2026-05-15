import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
  selector?: string;
  stagger?: number;
  y?: number;
  threshold?: number;
}

export default function StaggerReveal({
  children,
  className = '',
  selector = '.stagger-item',
  stagger = 0.12,
  y = 80,
  threshold = 0.85,
}: StaggerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(containerRef.current.querySelectorAll(selector), {
        opacity: 1,
        y: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      const items = containerRef.current!.querySelectorAll(selector);

      gsap.fromTo(
        items,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger,
          scrollTrigger: {
            trigger: containerRef.current,
            start: `top ${threshold * 100}%`,
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [selector, stagger, y, threshold]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}