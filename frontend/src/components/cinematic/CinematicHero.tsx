import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface CinematicHeroProps {
  image: string;
  imageAlt?: string;
  restaurantName: string;
  tagline?: string;
  scrollHint?: string;   // e.g. "SCROLL"
}

/**
 * Fullscreen cinematic hero.
 * - 100svh (mobile-safe viewport)
 * - Slow scale-in on mount (feels like a curtain lift)
 * - Text staggers in
 * - When user scrolls away, image slowly darkens + title floats up (scrub)
 */
export function CinematicHero({ image, imageAlt = '', restaurantName, tagline, scrollHint = 'SCROLL' }: CinematicHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      // ─── Entrance animation (curtain lift) ───
      const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } });
      entrance.fromTo(imgRef.current, { scale: 1.08, opacity: 0.4 }, { scale: 1.02, opacity: 1, duration: 1.6 }, 0);
      entrance.fromTo(titleRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.5);
      if (taglineRef.current) {
        entrance.fromTo(taglineRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.85);
      }
      if (hintRef.current) {
        entrance.fromTo(hintRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 0.7, duration: 0.7 }, 1.1);
      }

      // ─── Scroll-linked exit (parallax + text rise, no full-black overlay) ───
      gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        },
      })
        .to(imgRef.current, { scale: 1.15, y: '10%', ease: 'none' }, 0)
        .to(contentRef.current, { y: -80, opacity: 0, ease: 'none' }, 0);
    }, heroRef);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100svh' }}
    >
      {/* Background */}
      <div ref={imgRef} className="absolute inset-0 will-change-transform">
        <img
          src={image}
          alt={imageAlt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {/* Vignette — heavy radial darken. Center barely visible, edges full black. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 75% 75% at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.8) 55%, rgba(0,0,0,1) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Bottom-heavy gradient for text readability over the vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 h-full flex flex-col justify-end items-start pb-20 md:pb-28 px-6 sm:px-10 md:px-20 lg:px-28 max-w-7xl mx-auto"
      >
        <h1
          ref={titleRef}
          className="text-white font-display font-medium leading-[0.95] tracking-tight"
          style={{
            fontSize: 'clamp(3rem, 10vw, 9rem)',
            opacity: reduced ? 1 : 0,
            textShadow: '0 2px 30px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {restaurantName}
        </h1>
        {tagline && (
          <p
            ref={taglineRef}
            className="mt-4 md:mt-6 text-white/85 font-body text-base md:text-xl max-w-xl leading-relaxed"
            style={{ opacity: reduced ? 1 : 0, textShadow: '0 2px 20px rgba(0,0,0,0.7)' }}
          >
            {tagline}
          </p>
        )}
      </div>

      {/* Scroll hint */}
      <div
        ref={hintRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 text-white/70 hidden md:flex"
        style={{ opacity: reduced ? 0.7 : 0 }}
      >
        <span className="text-[10px] tracking-[0.4em] uppercase font-body">{scrollHint}</span>
        <div className="w-px h-12 bg-white/40 relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-4 bg-white/80 animate-scroll-hint" />
        </div>
      </div>
    </section>
  );
}
