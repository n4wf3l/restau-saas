<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        $query = Reservation::with('floorPlanItem');

        // If include_no_show=1, also include soft-deleted no-show reservations
        if ($request->boolean('include_no_show')) {
            $query->withTrashed()->where(function ($q) {
                $q->whereNull('deleted_at')
                  ->orWhere('status', 'no_show');
            });
        }

        $reservations = $query->orderBy('arrival_time', 'desc')->get();

        // Group reservations by (customer_email, arrival_time, party_size)
        // because the system creates 1 row per chair
        $grouped = $reservations->groupBy(function ($r) {
            return $r->customer_email . '|' . $r->arrival_time->format('Y-m-d H:i') . '|' . $r->party_size;
        });

        $result = $grouped->map(function ($group) {
            $first = $group->first();
            $ids = $group->pluck('id')->toArray();

            // Event reservations have no chair assigned
            if ($first->is_event || !$first->floorPlanItem) {
                return [
                    'id' => $first->id,
                    'ids' => $ids,
                    'customer_name' => $first->customer_name,
                    'customer_email' => $first->customer_email,
                    'customer_phone' => $first->customer_phone,
                    'arrival_time' => $first->arrival_time->format('Y-m-d H:i'),
                    'party_size' => $first->party_size,
                    'status' => $first->status,
                    'notes' => $first->notes,
                    'is_event' => true,
                    'event_details' => $first->event_details,
                    'table' => [
                        'id' => null,
                        'name' => 'Événement',
                        'floor' => '—',
                    ],
                    'created_at' => $first->created_at->format('Y-m-d H:i'),
                    'deleted_at' => $first->deleted_at?->format('Y-m-d H:i'),
                ];
            }

            // Normal reservations — find the table name from the chair's adjacent table
            $tableName = $first->floorPlanItem->table_name ?? 'Table';
            $floorName = $first->floorPlanItem->floor_name ?? 'Rez-de-chaussée';

            if ($first->floorPlanItem->type === 'chair') {
                $adjacentTable = \App\Models\RestaurantFloorPlanItem::where('type', 'table')
                    ->where('floor_plan_id', $first->floorPlanItem->floor_plan_id)
                    ->where('floor_level', $first->floorPlanItem->floor_level)
                    ->whereBetween('x', [$first->floorPlanItem->x - 1, $first->floorPlanItem->x + 1])
                    ->whereBetween('y', [$first->floorPlanItem->y - 1, $first->floorPlanItem->y + 1])
                    ->first();

                if ($adjacentTable) {
                    $tableName = $adjacentTable->table_name ?? 'Table ' . $adjacentTable->id;
                    $floorName = $adjacentTable->floor_name ?? $floorName;
                }
            }

            return [
                'id' => $first->id,
                'ids' => $ids,
                'customer_name' => $first->customer_name,
                'customer_email' => $first->customer_email,
                'customer_phone' => $first->customer_phone,
                'arrival_time' => $first->arrival_time->format('Y-m-d H:i'),
                'party_size' => $first->party_size,
                'status' => $first->status,
                'notes' => $first->notes,
                'is_event' => false,
                'event_details' => null,
                'table' => [
                    'id' => $first->floorPlanItem->id,
                    'name' => $tableName,
                    'floor' => $floorName,
                ],
                'created_at' => $first->created_at->format('Y-m-d H:i'),
                'deleted_at' => $first->deleted_at?->format('Y-m-d H:i'),
            ];
        })->values();

        return response()->json($result);
    }

    public function update(Request $request, Reservation $reservation)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled,completed,no_show',
        ]);

        // Update all reservations in the same group
        $group = Reservation::where('customer_email', $reservation->customer_email)
            ->where('arrival_time', $reservation->arrival_time)
            ->where('party_size', $reservation->party_size)
            ->get();

        foreach ($group as $r) {
            $r->update(['status' => $validated['status']]);
        }

        // If no_show, soft-delete the entire group
        if ($validated['status'] === 'no_show') {
            foreach ($group as $r) {
                $r->delete(); // SoftDeletes — sets deleted_at
            }

            return response()->json([
                'message' => 'Réservation marquée comme no-show',
                'reservation' => $reservation->fresh(),
            ]);
        }

        return response()->json([
            'message' => 'Statut mis à jour',
            'reservation' => $reservation->load('floorPlanItem'),
        ]);
    }

    /**
     * POST /api/reservations/{id}/restore
     * Restore a soft-deleted no-show reservation group.
     */
    public function restore(Request $request, int $id)
    {
        $reservation = Reservation::withTrashed()->findOrFail($id);

        // Find the group (all are trashed)
        $group = Reservation::withTrashed()
            ->where('customer_email', $reservation->customer_email)
            ->where('arrival_time', $reservation->arrival_time)
            ->where('party_size', $reservation->party_size)
            ->get();

        foreach ($group as $r) {
            $r->restore();
            $r->update(['status' => 'confirmed']);
        }

        return response()->json([
            'message' => 'Réservation restaurée',
            'reservation' => $reservation->fresh(),
        ]);
    }

    public function destroy(Reservation $reservation)
    {
        // Force delete all reservations in the same group (including soft-deleted)
        Reservation::withTrashed()
            ->where('customer_email', $reservation->customer_email)
            ->where('arrival_time', $reservation->arrival_time)
            ->where('party_size', $reservation->party_size)
            ->forceDelete();

        return response()->json(['message' => 'Réservation supprimée']);
    }
}
