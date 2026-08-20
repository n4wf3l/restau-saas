import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Drop-in replacement for React.lazy that survives chunk hash rotations
 * across deploys.
 *
 * Symptom without this: a user with an old index.html still open in a tab
 * navigates to a route, React triggers `import('./Foo-<hash>.js')` — but
 * that hash was rotated by the last deploy, so it 404s and the route dies
 * with "Failed to fetch dynamically imported module".
 *
 * Fix: if the dynamic import throws, reload the page once (session-guarded
 * so we don't loop on a genuine chunk that's actually missing). The fresh
 * HTML points at the current chunk hashes, and the user lands back on the
 * same URL with a working bundle.
 */
export function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const KEY = 'app_chunk_reload_ts';
      const last = Number(sessionStorage.getItem(KEY) ?? 0);
      // Guard against a reload loop if the chunk is genuinely missing.
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
      }
      throw err;
    }
  });
}
