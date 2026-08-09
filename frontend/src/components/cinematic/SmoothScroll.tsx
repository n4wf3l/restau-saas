import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Wraps children with Lenis smooth scrolling.
 * - Auto-disables when user has prefers-reduced-motion enabled (accessibility)
 * - Bridges Lenis to GSAP ScrollTrigger so scrub animations stay in sync
 * - Uses lightweight settings (no aggressive inertia, no scroll-jack feeling)
 * - Native scroll behavior preserved on touch devices to keep mobile snappy
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,               // subtle inertia — not scroll-jacking
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1,            // native feel on touch
      wheelMultiplier: 1,
    });

    // Drive Lenis from GSAP's ticker so ScrollTrigger stays perfectly in sync
    const raf = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
