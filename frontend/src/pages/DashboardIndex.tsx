import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui/Spinner';

const Dashboard = lazy(() => import('./Dashboard'));

/**
 * Index route of `/dashboard`. The historical default is the Reservations page,
 * but when the superadmin has turned the reservations module off we can't render
 * it (every API call would 403). This picks a sensible landing based on what
 * the tenant actually has access to.
 */
export default function DashboardIndex() {
  const { user } = useAuth();
  const mods = user?.restaurant?.modules;

  if (user?.role === 'admin' || mods?.reservations_enabled) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner /></div>}>
        <Dashboard />
      </Suspense>
    );
  }

  if (mods?.menu_enabled) return <Navigate to="/dashboard/menu" replace />;
  if (mods?.website_enabled) return <Navigate to="/dashboard/images" replace />;
  return <Navigate to="/dashboard/settings" replace />;
}
