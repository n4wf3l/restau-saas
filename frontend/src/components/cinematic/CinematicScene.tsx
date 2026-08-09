import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface CinematicSceneProps {
  /** Full-screen background image (must be reachable via <img src>). */
  image: string;
  /** Small uppercase label above the title (e.g. "OUR STORY"). */
  eyebrow?: string;
  /** Large editorial headline. */
  title: string;
  /** Optional body paragraph under the title. */
  body?: string;
  /** Text alignment inside the sticky viewport. */
  alignment?: 'left' | 'center' | 'right';
  /** How tall the scroll trigger is, in viewport heights. Higher = slower scroll. */
  scrollLength?: number;
  /** Alt text for accessibility. */
  imageAlt?: string;
  /** Additional CTA rendered under the body (e.g. reserve button). */
  cta?: React.ReactNode;
}

/**
 * A single cinematic scene:
 *   ┌────────────────────────────── outer (200vh–300vh)
 *   │  ┌───────────────────── sticky (100vh) ─┐
 *   │  │  <img>       ← pinned                │
 *   │  │  <overlay>   ← opacity scrubs 0→0.65 │
 *   │  │  <content>   ← text rises up & fades │
 *   │  │  <nextImg>   ← optional crossfade    │
 *   │  └──────────────────────────────────────┘
 *   └────────────────────────────────────────
 *
 * All animations are scroll-scrubbed (no auto-play): the user drives them
 * with the scroll wheel/trackpad. Respects prefers-reduced-motion (static fallback).
 */
export function CinematicScene({
  image,
  eyebrow,
  title,
  body,
  alignment = 'left',
  scrollLength = 1.6,
  imageAlt = '',
  cta,
}: CinematicSceneProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const outer = outerRef.current;
    const image = imageWrapRef.current;
    const content = contentRef.current;
    if (!outer || !image || !content) return;

    const ctx = gsap.context(() => {
      // Pin is handled by CSS `position: sticky` on stickyRef — ScrollTrigger only
      // computes progress so we get a scrub-driven timeline without GSAP taking over
      // DOM layout.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      // Subtle Ken Burns zoom (barely perceptible)
      tl.fromTo(image, { scale: 1.00 }, { scale: 1.05, ease: 'none' }, 0);
      // Content: quick rise-in, then float upward and fade out
      tl.fromTo(content, { y: 100, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out', duration: 0.3 }, 0);
      tl.to(content, { y: -80, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0.5);
    }, outer);

    return () => ctx.revert();
  }, [reduced, scrollLength]);

  const alignClass =
    alignment === 'center'
      ? 'items-center text-center'
      : alignment === 'right'
      ? 'items-end text-right'
      : 'items-start text-left';

  return (
    <section
      ref={outerRef}
      className="relative w-full"
      style={{ height: `${scrollLength * 100}vh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background image */}
        <div ref={imageWrapRef} className="absolute inset-0 will-change-transform">
          <img
            src={image}
            alt={imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Vignette — heavy radial darken. Even the center is muted so text dominates;
            edges fade to full black. No scroll-driven overlay. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 75% 75% at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,1) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div
          ref={contentRef}
          className={`relative z-10 h-full flex flex-col justify-center ${alignClass} px-6 sm:px-10 md:px-20 lg:px-28 max-w-7xl mx-auto`}
          style={{ opacity: reduced ? 1 : 0 }}
        >
          {eyebrow && (
            <p
              className="text-white/75 text-xs md:text-sm tracking-[0.4em] uppercase mb-6 md:mb-8 font-body"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
            >
              {eyebrow}
            </p>
          )}
          <h2
            className="text-white font-display font-medium leading-[1.05] tracking-tight max-w-4xl"
            style={{
              fontSize: 'clamp(2.5rem, 6.5vw, 5.5rem)',
              textShadow: '0 2px 30px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {title}
          </h2>
          {body && (
            <p
              className="mt-6 md:mt-8 text-white/85 font-body text-base md:text-lg max-w-xl leading-relaxed"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.6)' }}
            >
              {body}
            </p>
          )}
          {cta && <div className="mt-8 md:mt-10">{cta}</div>}
        </div>
      </div>
    </section>
  );
}
