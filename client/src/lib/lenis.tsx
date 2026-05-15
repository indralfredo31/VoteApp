import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

/**
 * Initialize Lenis smooth scroll
 */
export function initLenis(): Lenis {
  if (lenisInstance) {
    return lenisInstance;
  }

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time: number) {
    lenisInstance!.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return lenisInstance;
}

/**
 * Get Lenis instance
 */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Stop Lenis smooth scroll
 */
export function stopLenis(): void {
  if (lenisInstance) {
    lenisInstance.stop();
  }
}

/**
 * Start Lenis smooth scroll
 */
export function startLenis(): void {
  if (lenisInstance) {
    lenisInstance.start();
  }
}

/**
 * Destroy Lenis instance
 */
export function destroyLenis(): void {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}