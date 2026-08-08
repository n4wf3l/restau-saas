import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getPublicSiteImages, getTenantSlug } from "../lib/api";
import type { SiteImagesGrouped } from "../lib/types";

const SiteImagesContext = createContext<SiteImagesGrouped | null>(null);

function cacheKey(slug: string | null): string | null {
  return slug ? `siteImages:${slug}` : null;
}

function readCache(): SiteImagesGrouped | null {
  const key = cacheKey(getTenantSlug());
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SiteImagesGrouped) : null;
  } catch {
    return null;
  }
}

function preloadHero(images: SiteImagesGrouped | null) {
  const first = images?.hero?.[0]?.image_url;
  if (!first) return;
  if (document.querySelector(`link[rel="preload"][href="${first}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = first;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}

export function SiteImagesProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage synchronously → instant paint on repeat visits
  const [images, setImages] = useState<SiteImagesGrouped | null>(() => {
    const cached = readCache();
    preloadHero(cached);
    return cached;
  });

  useEffect(() => {
    getPublicSiteImages()
      .then((data) => {
        setImages(data);
        preloadHero(data);
        const key = cacheKey(getTenantSlug());
        if (key) {
          try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
        }
      })
      .catch((err) => {
        console.error('[SiteImages] fetch failed:', err);
      });
  }, []);

  return (
    <SiteImagesContext.Provider value={images}>
      {children}
    </SiteImagesContext.Provider>
  );
}

export function useSiteImages() {
  return useContext(SiteImagesContext);
}
