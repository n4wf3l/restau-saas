import { useState, useEffect } from "react";
import { getPublicTables, createReservation } from "../lib/api";
import type { PublicTable } from "../lib/types";
import { toast } from "react-hot-toast";
import { Spinner } from "../components/ui/Spinner";

export default function PublicReservation() {
  const [tables, setTables] = useState<PublicTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    arrival_time: "",
    party_size: 2,
    notes: "",
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const data = await getPublicTables();
      setTables(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des tables");
    } finally {
      setLoading(false);
    }
  };

  const isTableAvailable = (table: PublicTable) => {
    return table.is_available && table.available_seats > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) {
      toast.error("Veuillez sélectionner une table");
      return;
    }

    const selectedTableData = tables.find((t) => t.id === selectedTable);
    if (!selectedTableData) {
      toast.error("Table introuvable");
      return;
    }

    if (!isTableAvailable(selectedTableData)) {
      toast.error("Cette table n'est plus disponible");
      return;
    }

    if (formData.party_size > selectedTableData.available_seats) {
      toast.error(
        `Cette table n'a que ${selectedTableData.available_seats} place(s) disponible(s)`
      );
      return;
    }

    try {
      await createReservation({
        table_id: selectedTable,
        ...formData,
      });
      toast.success("Réservation créée avec succès !");
      setFormData({
        customer_name: "",
        customer_email: "",
        arrival_time: "",
        party_size: 2,
        notes: "",
      });
      setSelectedTable(null);
      loadTables();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la réservation"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Réserver une table
          </h1>
          <p className="text-gray-600">
            Choisissez votre table et réservez en quelques clics
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Liste des tables */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Tables disponibles</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : tables.length === 0 ? (
              <p className="text-gray-500">Aucune table disponible</p>
            ) : (
              <div className="space-y-3">
                {tables.map((table) => {
                  const available = isTableAvailable(table);
                  return (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table.id)}
                      disabled={!available}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedTable === table.id
                          ? "border-blue-500 bg-blue-50"
                          : available
                          ? "border-gray-200 hover:border-gray-300"
                          : "border-red-200 bg-red-50 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{table.name}</h3>
                          <p className="text-sm text-gray-500">{table.floor}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {available
                              ? `${table.available_seats} place(s) disponible(s) sur ${table.total_seats}`
                              : `${table.occupied_seats}/${table.total_seats} places occupées`}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {available ? "Disponible" : "Complète"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formulaire de réservation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Vos informations</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jean@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date et heure d'arrivée *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.arrival_time}
                  onChange={(e) =>
                    setFormData({ ...formData, arrival_time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de personnes *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={formData.party_size}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      party_size: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Allergies, préférences..."
                />
              </div>

              {selectedTable && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Table sélectionnée:{" "}
                    <span className="font-semibold">
                      {tables.find((t) => t.id === selectedTable)?.name}
                    </span>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedTable}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirmer la réservation
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
