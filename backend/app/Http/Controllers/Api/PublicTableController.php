<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantFloorPlanItem;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PublicTableController extends Controller
{
    public function index()
    {
        // Get all tables (with or without table_name)
        $tables = RestaurantFloorPlanItem::where('type', 'table')
            ->get();

        $result = [];
        $tableIndex = 1;

        foreach ($tables as $table) {
            // Find adjacent chairs (all 8 positions around the table including diagonals)
            $adjacentChairs = RestaurantFloorPlanItem::where('type', 'chair')
                ->where('floor_plan_id', $table->floor_plan_id)
                ->whereBetween('x', [$table->x - 1, $table->x + 1])
                ->whereBetween('y', [$table->y - 1, $table->y + 1])
                ->where(function ($query) use ($table) {
                    // Exclude the exact same position as the table
                    $query->where('x', '!=', $table->x)
                          ->orWhere('y', '!=', $table->y);
                })
                ->get();

            // Skip tables with no adjacent chairs
            if ($adjacentChairs->isEmpty()) {
                continue;
            }

            // Check reservations on chairs
            $chairIds = $adjacentChairs->pluck('id')->toArray();
            
            $reservations = Reservation::whereIn('floor_plan_item_id', $chairIds)
                ->where('arrival_time', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->with('floorPlanItem')
                ->get();

            $totalSeats = $adjacentChairs->count();
            $occupiedSeats = $reservations->count();
            $availableSeats = $totalSeats - $occupiedSeats;

            // Generate default name if not set
            $tableName = $table->table_name ?? "Table $tableIndex";

            $result[] = [
                'id' => $table->id,
                'name' => $tableName,
                'floor' => $table->floor_name ?? 'Rez-de-chaussée',
                'x' => $table->x,
                'y' => $table->y,
                'total_seats' => $totalSeats,
                'available_seats' => $availableSeats,
                'occupied_seats' => $occupiedSeats,
                'is_available' => $availableSeats > 0,
                'chair_ids' => $chairIds,
                'reservations' => $reservations->map(function ($reservation) {
                    return [
                        'id' => $reservation->id,
                        'arrival_time' => $reservation->arrival_time->format('Y-m-d H:i'),
                        'status' => $reservation->status,
                        'party_size' => $reservation->party_size,
                    ];
                }),
            ];
            
            $tableIndex++;
        }

        return response()->json($result);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_id' => 'required|exists:restaurant_floor_plan_items,id',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'arrival_time' => 'required|date|after:now',
            'party_size' => 'required|integer|min:1|max:20',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Get the table
        $table = RestaurantFloorPlanItem::findOrFail($validated['table_id']);

        if ($table->type !== 'table') {
            return response()->json(['error' => 'ID invalide - pas une table.'], 422);
        }

        // Find adjacent chairs
        $adjacentChairs = RestaurantFloorPlanItem::where('type', 'chair')
            ->where('floor_plan_id', $table->floor_plan_id)
            ->where(function ($query) use ($table) {
                $query->where(function ($q) use ($table) {
                    $q->where('y', $table->y)
                      ->whereBetween('x', [$table->x - 1, $table->x + 1]);
                })->orWhere(function ($q) use ($table) {
                    $q->where('x', $table->x)
                      ->whereBetween('y', [$table->y - 1, $table->y + 1]);
                });
            })
            ->where(function ($query) use ($table) {
                $query->where('x', '!=', $table->x)
                      ->orWhere('y', '!=', $table->y);
            })
            ->get();

        if ($adjacentChairs->isEmpty()) {
            return response()->json(['error' => 'Aucune chaise disponible autour de cette table.'], 422);
        }

        // Find available chairs (not already reserved at this time)
        $chairIds = $adjacentChairs->pluck('id')->toArray();
        
        $reservedChairIds = Reservation::whereIn('floor_plan_item_id', $chairIds)
            ->where('arrival_time', $validated['arrival_time'])
            ->where('status', '!=', 'cancelled')
            ->pluck('floor_plan_item_id')
            ->toArray();

        $availableChairIds = array_diff($chairIds, $reservedChairIds);

        if (count($availableChairIds) < $validated['party_size']) {
            return response()->json([
                'error' => 'Pas assez de places disponibles. Places disponibles: ' . count($availableChairIds)
            ], 422);
        }

        // Create reservations for the required number of seats
        $reservations = [];
        $availableChairIds = array_values($availableChairIds); // Reindex array
        
        for ($i = 0; $i < $validated['party_size']; $i++) {
            $reservation = Reservation::create([
                'floor_plan_item_id' => $availableChairIds[$i],
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'],
                'arrival_time' => $validated['arrival_time'],
                'party_size' => $validated['party_size'],
                'notes' => $validated['notes'],
            ]);
            $reservations[] = $reservation;
        }

        return response()->json([
            'message' => 'Réservation créée avec succès',
            'table_name' => $table->table_name,
            'seats_reserved' => $validated['party_size'],
            'reservations' => $reservations,
        ], 201);
    }
}
