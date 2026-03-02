<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Requests\UpdateReservationRequest;
use App\Models\Reservation;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantFloorPlanItem;
use App\Services\ReservationMailService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        // Scope reservations to the shared floor plan
        $floorPlan = RestaurantFloorPlan::first();

        if (!$floorPlan) {
            return response()->json([]);
        }

        $query = Reservation::with('floorPlanItem')
            ->where(function ($q) use ($floorPlan) {
                $q->whereHas('floorPlanItem', fn($sub) => $sub->where('floor_plan_id', $floorPlan->id))
                  ->orWhere(function ($sub) { $sub->where('is_event', true)->whereNull('floor_plan_item_id'); });
            });

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

        // Pre-load all tables for this floor plan to avoid N+1 queries
        $allTables = RestaurantFloorPlanItem::where('type', 'table')
            ->where('floor_plan_id', $floorPlan->id)
            ->get();

        $result = $grouped->map(function ($group) use ($allTables) {
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
                $chair = $first->floorPlanItem;
                $adjacentTable = $allTables->first(function ($table) use ($chair) {
                    return $table->floor_level === $chair->floor_level
                        && abs($table->x - $chair->x) <= 1
                        && abs($table->y - $chair->y) <= 1;
                });

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

    /**
     * POST /api/reservations — Admin creates a reservation (always confirmed).
     */
    public function store(StoreReservationRequest $request)
    {
        $validated = $request->validated();

        $table = RestaurantFloorPlanItem::findOrFail($validated['table_id']);

        // Verify the table belongs to the shared floor plan
        $floorPlan = RestaurantFloorPlan::where('id', $table->floor_plan_id)->first();

        if (!$floorPlan) {
            return response()->json(['error' => 'Plan de salle introuvable'], 404);
        }

        if ($table->type !== 'table') {
            return response()->json(['error' => 'ID invalide — pas une table.'], 422);
        }

        // Find adjacent chairs
        $adjacentChairs = RestaurantFloorPlanItem::adjacentChairs($table);

        if ($adjacentChairs->isEmpty()) {
            return response()->json(['error' => 'Aucune chaise autour de cette table.'], 422);
        }

        $chairIds = $adjacentChairs->pluck('id')->toArray();

        if (count($chairIds) < $validated['party_size']) {
            return response()->json([
                'error' => 'Pas assez de places. Places disponibles: ' . count($chairIds),
            ], 422);
        }

        $reservations = [];
        for ($i = 0; $i < $validated['party_size']; $i++) {
            $reservations[] = Reservation::create([
                'floor_plan_item_id' => $chairIds[$i],
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'customer_phone' => $validated['customer_phone'] ?? null,
                'arrival_time' => $validated['arrival_time'],
                'party_size' => $validated['party_size'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'confirmed',
            ]);
        }

        return response()->json([
            'message' => 'Réservation créée',
            'reservations' => $reservations,
        ], 201);
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation)
    {
        $validated = $request->validated();
        $oldStatus = $reservation->status;

        // Update all reservations in the same group
        $group = Reservation::where('customer_email', $reservation->customer_email)
            ->where('arrival_time', $reservation->arrival_time)
            ->where('party_size', $reservation->party_size)
            ->get();

        // Build the fields to update on every row in the group
        $updateFields = [];
        foreach (['status', 'customer_name', 'customer_email', 'customer_phone', 'arrival_time', 'party_size', 'notes'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updateFields[$field] = $validated[$field];
            }
        }

        foreach ($group as $r) {
            $r->update($updateFields);
        }

        // Send email on status change (confirmed / cancelled)
        $newStatus = $validated['status'] ?? $oldStatus;
        if ($oldStatus !== $newStatus) {
            $fresh = $reservation->fresh();
            $tableName = $fresh->floorPlanItem?->table_name ?? 'Table';

            if ($newStatus === 'confirmed') {
                ReservationMailService::sendConfirmed($fresh, $tableName);
            } elseif ($newStatus === 'cancelled') {
                ReservationMailService::sendCancelled($fresh);
            }
        }

        // If no_show, soft-delete the entire group
        if (isset($validated['status']) && $validated['status'] === 'no_show') {
            foreach ($group as $r) {
                $r->delete(); // SoftDeletes — sets deleted_at
            }

            return response()->json([
                'message' => 'Réservation marquée comme no-show',
                'reservation' => $reservation->fresh(),
            ]);
        }

        return response()->json([
            'message' => 'Réservation mise à jour',
            'reservation' => $reservation->fresh(),
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
