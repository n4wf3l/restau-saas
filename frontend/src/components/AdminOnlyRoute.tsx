import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spinner } from "./ui/Spinner";

/**
 * Client-side guard for the /dashboard/admin superadmin console. Backend
 * already refuses non-admin API calls with 403 (RequireAdmin middleware),
 * but this component prevents the page from even rendering — no confusing
 * empty state, no leaked layout hints, and no exposure of the "Admin"
 * navigation to users who ended up on the URL directly.
 */
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
