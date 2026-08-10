import { Navigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePublicSettings } from '../../contexts/PublicSettingsContext';
import type { PublicModuleFlags } from '../../contexts/PublicSettingsContext';

/**
 * Route wrapper — if the tenant's module is off (or the restaurant isn't
 * active), redirects back to the tenant homepage instead of rendering a
 * broken page that would 403 on its own API call.
 * Renders nothing until settings are loaded (avoids a flicker + wrong redirect).
 */
export function ModuleGate({
  feature,
  children,
}: {
  feature: keyof PublicModuleFlags;
  children: ReactNode;
}) {
  const settings = usePublicSettings();
  const { slug } = useParams<{ slug: string }>();

  // Wait for settings to arrive; treat undefined modules as "allowed" so pages
  // still work if the tenant hasn't been migrated yet.
  if (!settings) return null;

  const enabled = settings.modules?.[feature] ?? true;
  const active = settings.restaurant_status === 'active';

  if (!enabled || !active) {
    return <Navigate to={slug ? `/r/${slug}` : '/'} replace />;
  }

  return <>{children}</>;
}
