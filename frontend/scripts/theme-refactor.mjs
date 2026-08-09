/**
 * One-shot refactor: rewrite hardcoded coffee/cream Tailwind classes in the public
 * site components to semantic theme tokens (bg-page, text-primary, etc.).
 *
 * The tokens are defined in tailwind.config.js and resolve to CSS variables set
 * per data-theme in index.css. Re-runnable — already-refactored classes are ignored.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const files = [
  'src/pages/Home.tsx',
  'src/pages/GalleryPage.tsx',
  'src/pages/PublicMenuPage.tsx',
  'src/pages/ContactPage.tsx',
  'src/pages/PublicReservation.tsx',
  'src/components/public/Navbar.tsx',
  'src/components/public/Footer.tsx',
  'src/components/public/CTAButton.tsx',
  'src/components/public/ReservationModal.tsx',
  'src/components/ui/CustomSelect.tsx',
  'src/components/ui/ImageLightbox.tsx',
];

// Order matters: most specific patterns first (opacity variants before base classes)
const rules = [
  // ── Page background ─────────────────────────────────
  [/\bbg-coffee-950(?:\/\d+)?\b/g, 'bg-page'],

  // ── Elevated surfaces (cards, panels) ───────────────
  [/\bbg-coffee-900\/\d+\b/g, 'bg-elevated'],
  [/\bbg-coffee-900\b/g, 'bg-elevated'],
  [/\bbg-coffee-800\/\d+\b/g, 'bg-elevated'],

  // ── Primary action buttons (coffee-500/600/700 = brand button) ─
  [/\bbg-coffee-600\b/g, 'bg-brand'],
  [/\bhover:bg-coffee-500\b/g, 'hover:bg-brand-hover'],
  [/\bactive:bg-coffee-700\b/g, 'active:bg-brand-hover'],
  [/\bbg-coffee-500\/\d+\b/g, 'bg-tint'],
  [/\bbg-cream-300\b/g, 'bg-brand'],
  [/\bbg-cream-500\b/g, 'bg-brand'],
  [/\bactive:bg-cream-600\b/g, 'active:bg-brand-hover'],
  [/\btext-cream-50\b/g, 'text-page'],
  [/\btext-cream-600\b/g, 'text-tertiary'],

  // ── Text: primary (highest contrast) ────────────────
  [/\btext-cream-(?:100|200|300)\b/g, 'text-primary'],
  [/\b(?:hover|group-hover|active|focus):text-cream-(?:100|200|300)\b/g, (m) => m.replace(/text-cream-\d+/, 'text-primary')],

  // ── Text: accent (labels, eyebrows) ─────────────────
  [/\btext-cream-500\b/g, 'text-accent'],
  [/\b(?:hover|group-hover|active|focus):text-cream-500\b/g, (m) => m.replace(/text-cream-500/, 'text-accent')],

  // ── Text: secondary / tertiary (opacity-graded) ─────
  // High opacity 60-80 = secondary
  [/\btext-cream-400\/(?:60|70|80|90)\b/g, 'text-secondary'],
  [/\b(?:hover|group-hover|active):text-cream-400\/(?:60|70|80|90)\b/g, (m) => m.replace(/text-cream-400\/\d+/, 'text-secondary')],
  // Low opacity 10-50 = tertiary
  [/\btext-cream-400\/(?:10|15|20|25|30|35|40|45|50)\b/g, 'text-tertiary'],
  [/\b(?:hover|group-hover|active):text-cream-400\/(?:10|15|20|25|30|35|40|45|50)\b/g, (m) => m.replace(/text-cream-400\/\d+/, 'text-tertiary')],
  // Bare text-cream-400 = accent
  [/\btext-cream-400\b/g, 'text-accent'],
  [/\b(?:hover|group-hover|active):text-cream-400\b/g, (m) => m.replace(/text-cream-400/, 'text-accent')],

  // ── Borders (all cream borders → subtle, hover → strong) ─
  [/\bborder-cream-400\/\d+\b/g, 'border-subtle'],
  [/\bborder-cream-400\b/g, 'border-subtle'],
  [/\b(?:hover|group-hover|active|focus):border-cream-400(?:\/\d+)?\b/g, (m) => m.replace(/border-cream-\d+(?:\/\d+)?/, 'border-strong')],

  // ── Tinted overlays (bg-cream-400/xx = hover states, chip bg) ─
  [/\bbg-cream-400\/\d+\b/g, 'bg-tint'],
  [/\b(?:hover|group-hover|active|focus):bg-cream-400\/\d+\b/g, (m) => m.replace(/bg-cream-\d+\/\d+/, 'bg-tint')],

  // ── Placeholder colors ──────────────────────────────
  [/\bplaceholder-cream-\d+(?:\/\d+)?\b/g, 'placeholder:text-tertiary'],

  // ── Focus rings ─────────────────────────────────────
  [/\bring-cream-400\b/g, 'ring-brand'],
  [/\bfocus:ring-cream-400\b/g, 'focus:ring-brand'],
  [/\bfocus:ring-offset-coffee-950\b/g, 'focus:ring-offset-page'],
  [/\bring-offset-coffee-950\b/g, 'ring-offset-page'],
];

let totalChanges = 0;
for (const relPath of files) {
  const filePath = resolve(root, relPath);
  const before = readFileSync(filePath, 'utf8');
  let after = before;
  for (const [pattern, replacement] of rules) {
    after = after.replace(pattern, replacement);
  }
  if (after !== before) {
    const changed = [...before.matchAll(/(?:bg|text|border|ring|placeholder|hover:|group-hover:|active:|focus:)[^\s"'`]+/g)].length
      - [...after.matchAll(/(?:bg|text|border|ring|placeholder|hover:|group-hover:|active:|focus:)[^\s"'`]+/g)].length;
    writeFileSync(filePath, after);
    console.log(`✓ ${relPath}`);
    totalChanges++;
  } else {
    console.log(`  ${relPath} (no changes)`);
  }
}
console.log(`\n${totalChanges} file(s) refactored.`);
