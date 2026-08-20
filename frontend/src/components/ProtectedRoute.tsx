import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spinner } from "./ui/Spinner";
import { lazyWithReload as lazy } from "../lib/lazyWithReload";

const PendingValidationPage = lazy(() => import("../pages/PendingValidationPage"));

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-bg">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Platform admins bypass the tenant-status gate so they can moderate other
  // restaurants regardless of their own restaurant status.
  const status = user.restaurant?.status;
  if (user.role !== 'admin' && status && status !== 'active') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
        <PendingValidationPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}
