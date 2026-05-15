import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseTextRevealOptions {
  threshold?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
}

/**
 * Text reveal hook - reveals text with staggered fade-up on scroll entry
 */
export function useTextReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseTextRevealOptions = {}
) {
  const {
    threshold = 0.8,
    stagger = 0.08,
    duration = 0.8,
    delay = 0,
    once = true,
  } = options;

  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check for reduced motion preference
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

    ctxRef.current = gsap.context(() => {
      const lines = containerRef.current!.querySelectorAll('.reveal-line');

      gsap.fromTo(
        lines,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          ease: 'power3.out',
          stagger,
          delay,
          scrollTrigger: {
            trigger: containerRef.current,
            start: `top ${threshold * 100}%`,
            toggleActions: once ? 'play none none reverse' : 'play none none none',
          },
        }
      );
    }, containerRef);

    return () => ctxRef.current?.revert();
  }, [containerRef, threshold, stagger, duration, delay, once]);
}

/**
 * Character-by-character reveal for headlines
 */
export function useCharReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseTextRevealOptions = {}
) {
  const {
    threshold = 0.8,
    stagger = 0.03,
    duration = 0.6,
    delay = 0,
    once = true,
  } = options;

  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(containerRef.current.querySelectorAll('.reveal-char'), {
        opacity: 1,
        y: 0,
      });
      return;
    }

    ctxRef.current = gsap.context(() => {
      const chars = containerRef.current!.querySelectorAll('.reveal-char');

      gsap.fromTo(
        chars,
        { y: '100%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          duration,
          ease: 'power3.out',
          stagger,
          delay,
          scrollTrigger: {
            trigger: containerRef.current,
            start: `top ${threshold * 100}%`,
            toggleActions: once ? 'play none none reverse' : 'play none none none',
          },
        }
      );
    }, containerRef);

    return () => ctxRef.current?.revert();
  }, [containerRef, threshold, stagger, duration, delay, once]);
}

/**
 * Split text into spans for animation
 */
export function splitTextToChars(text: string): React.ReactNode {
  return (
    <>
      {text.split('').map((char, i) => (
        <span key={i} className="reveal-char inline-block overflow-hidden">
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </>
  );
}

/**
 * Split text into lines for animation
 */
export function splitTextToLines(text: string): React.ReactNode[] {
  return text.split('\n').map((line, i) => (
    <span key={i} className="reveal-line block">
      {line}
    </span>
  ));
}