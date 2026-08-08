import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/public/Navbar';
import { Footer } from '../components/public/Footer';
import { ReservationModal } from '../components/public/ReservationModal';
import { getPublicMenuItems, API_BASE_URL } from '../lib/api';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import type { MenuItem } from '../lib/types';
import { MagnifyingGlassIcon, XMarkIcon, Bars3Icon, Squares2X2Icon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ImageLightbox, type LightboxImage } from '../components/ui/ImageLightbox';

// ─── Scroll Reveal ───
function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function PublicMenuPage() {
  const { t } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const publicSettings = usePublicSettings();
  const menuPdfUrl = publicSettings?.menu_pdf_url ?? null;
  const manualVisible = publicSettings?.menu_manual_visible ?? true;
  const pdfVisible = publicSettings?.menu_pdf_visible ?? false;

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // PDF modal state
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  useEffect(() => {
    if (!isPdfOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsPdfOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [isPdfOpen]);

  // Refs for scrollspy
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const chipContainerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isScrollingRef = useRef(false);

  // ─── Data Loading ───
  useEffect(() => {
    const load = async () => {
      try {
        const items = await getPublicMenuItems();
        const available = items
          .filter(item => item.is_available)
          .sort((a, b) => a.order - b.order);
        setMenuItems(available);
      } catch (error) {
        // Failed to load menu
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Derived Data ───
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const item of menuItems) {
      const cat = item.category || 'Autres';
      if (!seen.has(cat)) {
        seen.add(cat);
        cats.push(cat);
      }
    }
    return cats;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase().trim();
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.ingredients && item.ingredients.toLowerCase().includes(q))
    );
  }, [menuItems, searchQuery]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      filteredItems.some(item => (item.category || 'Autres') === cat)
    );
  }, [categories, filteredItems]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const cat of filteredCategories) {
      map.set(cat, filteredItems.filter(item => (item.category || 'Autres') === cat));
    }
    return map;
  }, [filteredCategories, filteredItems]);

  // Build lightbox images from all menu items with images
  const lightboxImages: LightboxImage[] = useMemo(() => {
    return menuItems
      .filter(item => item.image_url)
      .map(item => ({
        src: item.image_url!.startsWith('http') ? item.image_url! : `${API_BASE_URL}${item.image_url}`,
        alt: item.name,
      }));
  }, [menuItems]);

  const openLightboxForItem = useCallback((item: MenuItem) => {
    if (!item.image_url) return;
    const src = item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`;
    const idx = lightboxImages.findIndex(img => img.src === src);
    if (idx >= 0) setLightboxIndex(idx);
  }, [lightboxImages]);

  // Set initial active category
  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.includes(activeCategory)) {
      setActiveCategory(filteredCategories[0]);
    }
  }, [filteredCategories, activeCategory]);

  // ─── Scrollspy ───
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute('data-category');
            if (cat) setActiveCategory(cat);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filteredCategories, filteredItems]);

  // Auto-scroll active chip into view (mobile)
  useEffect(() => {
    const activeChip = chipRefs.current.get(activeCategory);
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory]);

  // ─── Smooth Scroll ───
  const scrollToCategory = useCallback((category: string) => {
    const el = sectionRefs.current.get(category);
    if (el) {
      setActiveCategory(category);
      isScrollingRef.current = true;
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    }
  }, []);

  // Moroccan shamsa medallion — 12-point rosette (used in high-end madrasa/mosque zellij).
  // Grand 400px tile: outer ring frame + 12-point star + inner dodecagon + center dot.
  // Distinct from the 8-point khatam on the gallery page.
  const shamsaPattern = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><g fill='none' stroke='%23d4b18a' stroke-width='1.4' stroke-opacity='0.18'><circle cx='200' cy='200' r='148'/><polygon points='200,60 219,128 270,79 253,147 321,130 272,181 340,200 272,219 321,270 253,253 270,321 219,272 200,340 181,272 130,321 147,253 79,270 128,219 60,200 128,181 79,130 147,147 130,79 181,128'/><polygon points='200,165 218,170 230,183 235,200 230,218 218,230 200,235 183,230 170,218 165,200 170,183 183,170'/></g><circle cx='200' cy='200' r='2.5' fill='%23d4b18a' fill-opacity='0.28'/></svg>\")";

  // ─── Render ───
  return (
    <div
      className="bg-coffee-950 text-white min-h-screen"
      style={{ backgroundImage: shamsaPattern, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <Navbar onReservationClick={() => setIsReservationModalOpen(true)} />
      <ReservationModal isOpen={isReservationModalOpen} onClose={() => setIsReservationModalOpen(false)} />

      {/* Hero */}
      <section className="pt-32 pb-12 px-4 text-center">
        <ScrollReveal>
          <p className="text-cream-500 text-xs tracking-[0.35em] uppercase mb-4 font-body">
            {t('menu.eyebrow')}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-cream-100 mb-6 tracking-wide">
            {t('menu.title')}
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <p className="text-cream-400/70 font-body text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {t('menu.desc')}
          </p>
        </ScrollReveal>
      </section>

      {/* PDF Menu — button opens fullscreen modal viewer */}
      {pdfVisible && menuPdfUrl && (
        <ScrollReveal delay={300}>
          <div className="max-w-4xl mx-auto px-4 mb-12 flex justify-center">
            <button
              onClick={() => setIsPdfOpen(true)}
              className="group inline-flex items-center gap-3 px-8 py-3.5 border border-cream-400/40 text-cream-200 text-sm font-body tracking-[0.15em] uppercase hover:bg-cream-400/10 hover:border-cream-400/70 transition-all duration-300"
            >
              <DocumentTextIcon className="w-5 h-5 text-cream-400 group-hover:text-cream-200 transition-colors" />
              {t('menu.pdfButton')}
            </button>
          </div>
        </ScrollReveal>
      )}

      {/* PDF Fullscreen Modal */}
      {pdfVisible && menuPdfUrl && isPdfOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-overlay-fade-in"
          onClick={() => setIsPdfOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl h-full max-h-[95vh] bg-coffee-950 border border-cream-400/20 rounded-lg overflow-hidden shadow-2xl animate-modal-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPdfOpen(false)}
              className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-coffee-950/80 hover:bg-coffee-900 text-cream-400/70 hover:text-cream-100 transition-colors"
              aria-label={t('common.close')}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <iframe
              src={`${API_BASE_URL}${menuPdfUrl}`}
              className="w-full h-full"
              title={t('menu.pdfViewerTitle')}
            />
          </div>
        </div>
      )}

      {/* Search + View Toggle */}
      {manualVisible && (<>
      <ScrollReveal delay={300}>
        <div className="max-w-4xl mx-auto px-4 mb-8 flex gap-3 items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cream-400/50" aria-hidden="true" />
            <label htmlFor="menu-search" className="sr-only">{t('menu.searchAria')}</label>
            <input
              id="menu-search"
              type="search"
              placeholder={t('menu.searchPlaceholder')}
              aria-label={t('menu.searchAria')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent border border-cream-400/20 text-cream-100 text-sm font-body placeholder-cream-400/40 focus:outline-none focus:border-cream-400/50 transition-colors"
            />
          </div>
          <div className="flex border border-cream-400/20" role="group" aria-label={t('menu.viewGroupAria')}>
            <button
              onClick={() => setViewMode('list')}
              aria-label={t('menu.viewListAria')}
              aria-pressed={viewMode === 'list'}
              className={`p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-cream-400 focus:ring-inset ${viewMode === 'list' ? 'bg-cream-400/15 text-cream-200' : 'text-cream-400/40 hover:text-cream-400/70'}`}
              title={t('menu.viewListTitle')}
            >
              <Bars3Icon className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              aria-label={t('menu.viewCardAria')}
              aria-pressed={viewMode === 'card'}
              className={`p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-cream-400 focus:ring-inset ${viewMode === 'card' ? 'bg-cream-400/15 text-cream-200' : 'text-cream-400/40 hover:text-cream-400/70'}`}
              title={t('menu.viewCardTitle')}
            >
              <Squares2X2Icon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Mobile Category Chips */}
      <div className="md:hidden sticky top-16 z-30 bg-coffee-950/95 backdrop-blur-sm border-b border-cream-400/10 px-4 py-3">
        <div ref={chipContainerRef} className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filteredCategories.map(cat => (
            <button
              key={cat}
              ref={el => { if (el) chipRefs.current.set(cat, el); }}
              onClick={() => scrollToCategory(cat)}
              className={`whitespace-nowrap px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-body border transition-all shrink-0 min-h-[40px] ${
                activeCategory === cat
                  ? 'border-cream-400/60 text-cream-300 bg-cream-400/10'
                  : 'border-cream-400/20 text-cream-400/50 hover:border-cream-400/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        <div className="flex gap-12">

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-28">
              <nav className="space-y-1">
                {filteredCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all duration-200 ${
                      activeCategory === cat
                        ? 'text-cream-200 border-l-2 border-cream-400 bg-cream-400/5'
                        : 'text-cream-400/60 border-l-2 border-transparent hover:text-cream-300 hover:border-cream-400/30'
                    }`}
                  >
                    <span className="text-sm font-body tracking-wide">{cat}</span>
                    <span className={`text-xs font-body tabular-nums ${
                      activeCategory === cat ? 'text-cream-400' : 'text-cream-400/30'
                    }`}>
                      {itemsByCategory.get(cat)?.length || 0}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Items Content */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <LoadingSkeleton />
            ) : filteredItems.length === 0 ? (
              <EmptyState searchQuery={searchQuery} />
            ) : (
              filteredCategories.map(cat => (
                <section
                  key={cat}
                  data-category={cat}
                  ref={el => { if (el) sectionRefs.current.set(cat, el); }}
                  className="mb-16"
                >
                  {/* Category Header */}
                  <ScrollReveal>
                    <div className="mb-6 pb-3 border-b border-cream-400/15">
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-cream-100 tracking-wide">
                        {cat}
                      </h2>
                    </div>
                  </ScrollReveal>

                  {/* Items */}
                  {viewMode === 'list' ? (
                    <div className="divide-y divide-cream-400/10">
                      {itemsByCategory.get(cat)?.map((item, idx) => (
                        <ScrollReveal key={item.id} delay={idx * 60}>
                          <MenuItemRow
                            item={item}
                            onDetailClick={() => setDetailItem(item)}
                            onImageClick={() => openLightboxForItem(item)}
                          />
                        </ScrollReveal>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {itemsByCategory.get(cat)?.map((item, idx) => (
                        <ScrollReveal key={item.id} delay={idx * 60}>
                          <MenuItemCard
                            item={item}
                            onDetailClick={() => setDetailItem(item)}
                            onImageClick={() => openLightboxForItem(item)}
                          />
                        </ScrollReveal>
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </main>
        </div>
      </div>
      </>)}

      <Footer onReservationClick={() => setIsReservationModalOpen(true)} />

      {/* Detail Drawer */}
      {detailItem && (
        <ItemDetailDrawer
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onImageClick={() => openLightboxForItem(detailItem)}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MenuItemRow — Bistro premium line
// ─────────────────────────────────────────────────────────

interface MenuItemRowProps {
  item: MenuItem;
  onDetailClick: () => void;
  onImageClick?: () => void;
}

function MenuItemRow({ item, onDetailClick }: MenuItemRowProps) {
  const { t } = useTranslation();
  const [isClamped, setIsClamped] = useState(false);
  const ingredientsRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ingredientsRef.current;
    if (el) {
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [item.ingredients]);

  return (
    <div
      className="group py-4 px-2 -mx-2 hover:bg-cream-400/[0.03] active:bg-cream-400/[0.06] transition-colors duration-200 cursor-default"
      onClick={item.ingredients ? onDetailClick : undefined}
    >
      {/* Name ........ Price */}
      <div className="flex items-baseline gap-3">
        <span className="font-display font-bold text-cream-100 text-base md:text-lg shrink-0">
          {item.name}
        </span>

        {item.is_halal && (
          <span className="shrink-0 px-1.5 py-0.5 text-[9px] tracking-wider uppercase font-body border border-emerald-400/40 text-emerald-400/80">
            {t('menu.halal')}
          </span>
        )}

        {/* Dotted leader */}
        <span className="flex-1 border-b border-dotted border-cream-400/20 min-w-[2rem] translate-y-[-4px]" />

        <span className="font-display font-bold text-cream-300 text-base md:text-lg shrink-0 tabular-nums">
          {Number(item.price).toFixed(2)}€
        </span>
      </div>

      {/* Ingredients */}
      {item.ingredients && (
        <div className="mt-1.5 flex items-start gap-2">
          <p
            ref={ingredientsRef}
            className="text-cream-400/50 font-body text-sm leading-relaxed line-clamp-2 flex-1"
          >
            {item.ingredients}
          </p>
          {isClamped && (
            <button
              onClick={(e) => { e.stopPropagation(); onDetailClick(); }}
              className="shrink-0 text-cream-500/60 hover:text-cream-400 active:text-cream-300 text-sm font-body underline underline-offset-2 transition-colors py-1 px-2"
            >
              {t('menu.itemMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MenuItemCard — Grid card view
// ─────────────────────────────────────────────────────────

function MenuItemCard({ item, onDetailClick, onImageClick }: MenuItemRowProps) {
  const { t } = useTranslation();
  return (
    <div
      className="group border border-cream-400/15 hover:border-cream-400/30 bg-cream-400/[0.03] hover:bg-cream-400/[0.06] transition-all duration-200 cursor-pointer"
      onClick={onDetailClick}
    >
      {/* Image */}
      {item.image_url && (
        <div
          className="w-full h-40 overflow-hidden cursor-zoom-in"
          onClick={(e) => { e.stopPropagation(); onImageClick?.(); }}
        >
          <img
            loading="lazy"
            src={item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-4">
        {/* Name + Price */}
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <h3 className="font-display font-bold text-cream-100 text-base leading-tight">
            {item.name}
          </h3>
          <span className="font-display font-bold text-cream-300 text-base shrink-0 tabular-nums">
            {Number(item.price).toFixed(2)}€
          </span>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 mb-3">
          {item.is_halal && (
            <span className="px-1.5 py-0.5 text-[9px] tracking-wider uppercase font-body border border-emerald-400/40 text-emerald-400/80">
              {t('menu.halal')}
            </span>
          )}
        </div>

        {/* Ingredients */}
        {item.ingredients && (
          <p className="text-cream-400/50 font-body text-sm leading-relaxed line-clamp-2">
            {item.ingredients}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ItemDetailDrawer
// ─────────────────────────────────────────────────────────

interface ItemDetailDrawerProps {
  item: MenuItem;
  onClose: () => void;
  onImageClick?: () => void;
}

function ItemDetailDrawer({ item, onClose, onImageClick }: ItemDetailDrawerProps) {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 250);
  }, [closing, onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-center transition-opacity duration-250 ${closing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/70" />

      <div
        className={`relative w-full md:max-w-lg md:mx-4 bg-coffee-950 border-t md:border border-cream-400/20 md:rounded-lg overflow-hidden transition-all duration-250 ${closing ? 'opacity-0 translate-y-4 scale-95' : 'animate-slideUp'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        {item.image_url && (
          <div
            className="w-full h-48 md:h-56 overflow-hidden cursor-zoom-in"
            onClick={() => onImageClick?.()}
          >
            <img loading="lazy" src={item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}${item.image_url}`} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-cream-400/60 hover:text-cream-200 active:text-cream-100 transition-colors bg-coffee-950/80 rounded-full p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex items-baseline justify-between mb-4 pr-10">
            <h3 className="text-xl font-display font-bold text-cream-100">
              {item.name}
            </h3>
            <span className="font-display font-bold text-cream-300 text-xl shrink-0">
              {Number(item.price).toFixed(2)}€
            </span>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mb-4">
            {item.is_halal && (
              <span className="px-2 py-1 text-[10px] tracking-wider uppercase font-body border border-emerald-400/40 text-emerald-400/80">
                {t('menu.halal')}
              </span>
            )}
            {item.category && (
              <span className="px-2 py-1 text-[10px] tracking-wider uppercase font-body border border-cream-400/30 text-cream-400/60">
                {item.category}
              </span>
            )}
          </div>

          {/* Full ingredients */}
          {item.ingredients && (
            <div>
              <p className="text-cream-500 text-xs tracking-[0.2em] uppercase mb-2 font-body">
                {t('menu.ingredients')}
              </p>
              <p className="text-cream-400/70 font-body text-sm leading-relaxed">
                {item.ingredients}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Loading & Empty states
// ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <div className="h-8 w-48 bg-cream-400/10 rounded mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="flex items-baseline gap-4">
                <div className="h-5 w-40 bg-cream-400/10 rounded" />
                <div className="flex-1 h-px bg-cream-400/5" />
                <div className="h-5 w-16 bg-cream-400/10 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20">
      <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-cream-400/30 mb-4" />
      <h3 className="text-lg font-display font-semibold text-cream-100 mb-2">
        {t('menu.emptyTitle')}
      </h3>
      <p className="text-cream-400/60 font-body text-sm">
        {searchQuery
          ? t('menu.emptyNoSearch', { query: searchQuery })
          : t('menu.emptyNoMenu')}
      </p>
    </div>
  );
}
