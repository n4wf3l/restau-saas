<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index()
    {
        $reservations = Reservation::with('floorPlanItem')
            ->orderBy('arrival_time', 'desc')
            ->get()
            ->map(function ($reservation) {
                return [
                    'id' => $reservation->id,
                    'customer_name' => $reservation->customer_name,
                    'customer_email' => $reservation->customer_email,
                    'arrival_time' => $reservation->arrival_time->format('Y-m-d H:i'),
                    'party_size' => $reservation->party_size,
                    'status' => $reservation->status,
                    'notes' => $reservation->notes,
                    'table' => [
                        'id' => $reservation->floorPlanItem->id,
                        'name' => $reservation->floorPlanItem->table_name,
                        'floor' => $reservation->floorPlanItem->floor_name ?? 'Rez-de-chaussée',
                    ],
                    'created_at' => $reservation->created_at->format('Y-m-d H:i'),
                ];
            });

        return response()->json($reservations);
    }

    public function update(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled,completed',
        ]);

        $reservation->update($validated);

        return response()->json([
            'message' => 'Statut mis à jour',
            'reservation' => $reservation->load('floorPlanItem'),
        ]);
    }

    public function destroy(Reservation $reservation)
    {
        $reservation->delete();

        return response()->json(['message' => 'Réservation supprimée']);
    }
}
