import { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface LightboxImage {
  src: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  onClose: () => void;
}

export function ImageLightbox({ images, currentIndex, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(currentIndex);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [animating, setAnimating] = useState(false);

  // Reset index if currentIndex changes externally
  useEffect(() => { setIndex(currentIndex); }, [currentIndex]);

  const total = images.length;
  const single = total <= 1;

  const goNext = useCallback(() => {
    if (single || animating) return;
    setDirection('right');
    setAnimating(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % total);
      setDirection(null);
      setAnimating(false);
    }, 200);
  }, [single, animating, total]);

  const goPrev = useCallback(() => {
    if (single || animating) return;
    setDirection('left');
    setAnimating(true);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + total) % total);
      setDirection(null);
      setAnimating(false);
    }, 200);
  }, [single, animating, total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  // Touch swipe
  useEffect(() => {
    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) goNext();
        else goPrev();
      }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const image = images[index];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-overlay-fade-in"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-cream-400/60 hover:text-cream-200 active:text-cream-100 transition-colors z-10 p-2 min-w-[48px] min-h-[48px] flex items-center justify-center"
        aria-label="Fermer"
      >
        <XMarkIcon className="w-7 h-7" />
      </button>

      {/* Counter */}
      {!single && (
        <div className="absolute top-6 left-6 text-cream-400/50 text-xs font-body tracking-widest z-10">
          {index + 1} / {total}
        </div>
      )}

      {/* Prev */}
      {!single && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 text-cream-400/50 hover:text-cream-200 active:text-cream-100 transition-colors z-10 min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Image précédente"
        >
          <ChevronLeftIcon className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-5xl max-h-[80vh] w-full mx-4 md:mx-16 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.src}
          alt={image.alt}
          className={`max-w-full max-h-[80vh] object-contain transition-all duration-200 ${
            direction === 'right'
              ? 'opacity-0 -translate-x-8'
              : direction === 'left'
              ? 'opacity-0 translate-x-8'
              : 'opacity-100 translate-x-0'
          }`}
        />
      </div>

      {/* Next */}
      {!single && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 text-cream-400/50 hover:text-cream-200 active:text-cream-100 transition-colors z-10 min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Image suivante"
        >
          <ChevronRightIcon className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      )}

      {/* Caption */}
      {image.alt && (
        <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
          <p className="text-cream-400/60 text-sm font-body tracking-wider">
            {image.alt}
          </p>
        </div>
      )}

      {/* Thumbnail strip */}
      {!single && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {images.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === index ? 'bg-cream-300 scale-125' : 'bg-cream-400/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
