import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getPublicSiteImages } from "../lib/api";
import type { SiteImagesGrouped } from "../lib/types";

const SiteImagesContext = createContext<SiteImagesGrouped | null>(null);

export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<SiteImagesGrouped | null>(null);

  useEffect(() => {
    getPublicSiteImages()
      .then((data) => {
        setImages(data);
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
