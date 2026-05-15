import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Pinned section scroll animation
 */
export function usePinnedSection(
  sectionRef: React.RefObject<HTMLElement | null>,
  options: {
    pin?: boolean;
    pinSpacing?: boolean;
    end?: string;
    anticipatePin?: number;
    onUpdate?: () => void;
  } = {}
) {
  const { pin = true, pinSpacing = true, end = '+=150%', anticipatePin = 1, onUpdate } = options;
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    ctxRef.current = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end,
        pin,
        pinSpacing,
        anticipatePin,
        onUpdate: onUpdate ? onUpdate : undefined,
      });
    }, sectionRef);

    return () => ctxRef.current?.revert();
  }, [sectionRef, pin, pinSpacing, end, anticipatePin, onUpdate]);

  return ctxRef;
}

/**
 * Staggered card reveal on scroll
 */
export function useStaggerReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  options: {
    selector?: string;
    stagger?: number;
    y?: number;
    duration?: number;
    threshold?: number;
  } = {}
) {
  const {
    selector = '.stagger-item',
    stagger = 0.1,
    y = 80,
    duration = 0.8,
    threshold = 0.85,
  } = options;
  const ctxRef = useRef<gsap.Context | null>(null);

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

    ctxRef.current = gsap.context(() => {
      const items = containerRef.current!.querySelectorAll(selector);

      gsap.fromTo(
        items,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
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

    return () => ctxRef.current?.revert();
  }, [containerRef, selector, stagger, y, duration, threshold]);

  return ctxRef;
}

/**
 * Progress bar animation on scroll
 */
export function useProgressBar(
  barRef: React.RefObject<HTMLElement | null>,
  targetValue: number,
  options: { threshold?: number; duration?: number } = {}
) {
  const { threshold = 0.9, duration = 1.2 } = options;
  const ctxRef = useRef<gsap.Context | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!barRef.current || hasAnimatedRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(barRef.current, { scaleX: targetValue / 100 });
      return;
    }

    ctxRef.current = gsap.context(() => {
      ScrollTrigger.create({
        trigger: barRef.current,
        start: `top ${threshold * 100}%`,
        onEnter: () => {
          if (hasAnimatedRef.current) return;
          hasAnimatedRef.current = true;

          gsap.to(barRef.current, {
            scaleX: targetValue / 100,
            duration,
            ease: 'power3.out',
          });
        },
      });
    }, barRef);

    return () => ctxRef.current?.revert();
  }, [barRef, targetValue, threshold, duration]);

  return ctxRef;
}

/**
 * Count-up number animation
 */
export function useCountUp(
  elementRef: React.RefObject<HTMLElement | null>,
  target: number,
  options: { duration?: number; threshold?: number; prefix?: string; suffix?: string } = {}
) {
  const { duration = 1.5, threshold = 0.9, prefix = '', suffix = '' } = options;
  const hasAnimatedRef = useRef(false);
  const objRef = useRef({ value: 0 });

  useEffect(() => {
    if (!elementRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      elementRef.current.textContent = `${prefix}${target}${suffix}`;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;

            gsap.to(objRef.current, {
              value: target,
              duration,
              ease: 'power2.out',
              onUpdate: () => {
                if (elementRef.current) {
                  elementRef.current.textContent = `${prefix}${Math.round(objRef.current.value)}${suffix}`;
                }
              },
            });
          }
        });
      },
      { threshold }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [elementRef, target, duration, threshold, prefix, suffix]);
}