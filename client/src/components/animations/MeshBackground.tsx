import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface MeshBackgroundProps {
  scrollReactive?: boolean;
}

export default function MeshBackground({ scrollReactive = true }: MeshBackgroundProps) {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollReactive) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Orb 1 - subtle scroll parallax
      gsap.to(orb1Ref.current, {
        x: 80,
        y: 60,
        rotation: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom top',
          scrub: 2,
        },
      });

      // Orb 2 - opposite direction parallax
      gsap.to(orb2Ref.current, {
        x: -60,
        y: -80,
        rotation: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom top',
          scrub: 2.5,
        },
      });

      // Orb 3 - subtle movement
      gsap.to(orb3Ref.current, {
        x: 40,
        y: -40,
        scale: 1.15,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom top',
          scrub: 3,
        },
      });
    });

    return () => ctx.revert();
  }, [scrollReactive]);

  return (
    <div className="mesh-bg">
      <div ref={orb1Ref} className="mesh-orb-1" />
      <div ref={orb2Ref} className="mesh-orb-2" />
      <div ref={orb3Ref} className="mesh-orb-3" />
    </div>
  );
}