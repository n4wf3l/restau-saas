import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FloorPlanEditor } from "../components/floorplan/FloorPlanEditor";
import { api } from "../lib/api";
import type { FloorPlan } from "../lib/types";
import toast from "react-hot-toast";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloorPlan();
  }, []);

  const loadFloorPlan = async () => {
    try {
      const { data } = await api.get<FloorPlan>("/api/floor-plans/current");
      setFloorPlan(data);
    } catch (error: any) {
      toast.error("Erreur lors du chargement du plan");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header Compact */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {floorPlan?.name || "Mon Restaurant"}
            </h1>
            <p className="text-xs text-gray-500">
              Bienvenue, {user?.name}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content - Full Height */}
      <main className="flex-1 flex overflow-hidden">
        {floorPlan ? (
          <FloorPlanEditor floorPlan={floorPlan} onUpdate={loadFloorPlan} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <p className="text-gray-600">Aucun plan de restaurant trouvé</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
