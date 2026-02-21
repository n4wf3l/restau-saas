import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spinner } from "./ui/Spinner";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-950">
        <Spinner />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
