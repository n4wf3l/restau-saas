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

        // Group tables by name and floor_level to treat adjacent tables with same name as one
        $groupedTables = [];
        $tableIndex = 1;
        $processedIds = [];

        foreach ($tables as $table) {
            // Skip if already processed
            if (in_array($table->id, $processedIds)) {
                continue;
            }

            // Generate name for grouping
            $tableName = $table->table_name ?? "Table $tableIndex";
            $floorLevel = $table->floor_level ?? 1;
            $groupKey = $tableName . '_' . $floorLevel;

            // Find all tables with the same name on the same floor
            $tablesInGroup = $tables->filter(function ($t) use ($tables, $tableName, $floorLevel) {
                $tName = $t->table_name ?? "Table " . ($tables->search($t) + 1);
                $tFloor = $t->floor_level ?? 1;
                return $tName === $tableName && $tFloor === $floorLevel;
            });

            // Mark all tables in this group as processed
            foreach ($tablesInGroup as $t) {
                $processedIds[] = $t->id;
            }

            // Find all chairs adjacent to ANY table in this group
            $allChairIds = [];
            foreach ($tablesInGroup as $groupTable) {
                $adjacentChairs = RestaurantFloorPlanItem::where('type', 'chair')
                    ->where('floor_plan_id', $groupTable->floor_plan_id)
                    ->where('floor_level', $groupTable->floor_level)
                    ->whereBetween('x', [$groupTable->x - 1, $groupTable->x + 1])
                    ->whereBetween('y', [$groupTable->y - 1, $groupTable->y + 1])
                    ->where(function ($query) use ($groupTable) {
                        $query->where('x', '!=', $groupTable->x)
                              ->orWhere('y', '!=', $groupTable->y);
                    })
                    ->pluck('id')
                    ->toArray();
                
                $allChairIds = array_merge($allChairIds, $adjacentChairs);
            }

            // Remove duplicates
            $allChairIds = array_unique($allChairIds);

            // Skip tables with no adjacent chairs
            if (empty($allChairIds)) {
                $tableIndex++;
                continue;
            }

            // Check reservations on chairs
            $reservations = Reservation::whereIn('floor_plan_item_id', $allChairIds)
                ->where('arrival_time', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->with('floorPlanItem')
                ->get();

            $totalSeats = count($allChairIds);
            $occupiedSeats = $reservations->count();
            $availableSeats = $totalSeats - $occupiedSeats;

            $groupedTables[] = [
                'id' => $table->id, // Use first table's ID as representative
                'name' => $tableName,
                'floor' => $table->floor_name ?? 'Rez-de-chaussée',
                'x' => $table->x,
                'y' => $table->y,
                'total_seats' => $totalSeats,
                'available_seats' => $availableSeats,
                'occupied_seats' => $occupiedSeats,
                'is_available' => $availableSeats > 0,
                'chair_ids' => array_values($allChairIds),
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

        return response()->json($groupedTables);
    }

    public function checkAvailability(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|string',
            'party_size' => 'required|integer|min:1|max:20',
        ]);

        $arrivalDateTime = Carbon::parse($validated['date'] . ' ' . $validated['time']);
        $partySize = $validated['party_size'];

        // Get all tables
        $tables = RestaurantFloorPlanItem::where('type', 'table')->get();

        // Group tables by name and floor_level
        $availableTables = [];
        $processedIds = [];
        $tableIndex = 1;

        foreach ($tables as $table) {
            if (in_array($table->id, $processedIds)) {
                continue;
            }

            $tableName = $table->table_name ?? "Table $tableIndex";
            $floorLevel = $table->floor_level ?? 1;

            // Find all tables with same name on same floor
            $tablesInGroup = $tables->filter(function ($t) use ($tables, $tableName, $floorLevel) {
                $tName = $t->table_name ?? "Table " . ($tables->search($t) + 1);
                $tFloor = $t->floor_level ?? 1;
                return $tName === $tableName && $tFloor === $floorLevel;
            });

            foreach ($tablesInGroup as $t) {
                $processedIds[] = $t->id;
            }

            // Find all chairs for this table group
            $allChairIds = [];
            foreach ($tablesInGroup as $groupTable) {
                $adjacentChairs = RestaurantFloorPlanItem::where('type', 'chair')
                    ->where('floor_plan_id', $groupTable->floor_plan_id)
                    ->where('floor_level', $groupTable->floor_level)
                    ->whereBetween('x', [$groupTable->x - 1, $groupTable->x + 1])
                    ->whereBetween('y', [$groupTable->y - 1, $groupTable->y + 1])
                    ->where(function ($query) use ($groupTable) {
                        $query->where('x', '!=', $groupTable->x)
                              ->orWhere('y', '!=', $groupTable->y);
                    })
                    ->pluck('id')
                    ->toArray();
                
                $allChairIds = array_merge($allChairIds, $adjacentChairs);
            }

            $allChairIds = array_unique($allChairIds);

            if (empty($allChairIds)) {
                $tableIndex++;
                continue;
            }

            // Check which chairs are reserved at this specific time
            $reservedChairIds = Reservation::whereIn('floor_plan_item_id', $allChairIds)
                ->where('arrival_time', $arrivalDateTime)
                ->where('status', '!=', 'cancelled')
                ->pluck('floor_plan_item_id')
                ->toArray();

            $totalSeats = count($allChairIds);
            $availableSeats = $totalSeats - count($reservedChairIds);

            // Check reservations for display
            $reservations = Reservation::whereIn('floor_plan_item_id', $allChairIds)
                ->where('arrival_time', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->get();

            $availableTables[] = [
                'id' => $table->id,
                'name' => $tableName,
                'floor' => $table->floor_name ?? 'Rez-de-chaussée',
                'x' => $table->x,
                'y' => $table->y,
                'total_seats' => $totalSeats,
                'available_seats' => $availableSeats,
                'occupied_seats' => count($reservedChairIds),
                'is_available' => $availableSeats > 0,
                'chair_ids' => array_values($allChairIds),
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

        // Filter tables that can accommodate party_size
        $suitableTables = array_filter($availableTables, function ($table) use ($partySize) {
            return $table['available_seats'] >= $partySize;
        });

        // If no suitable tables, suggest alternative time slots
        $suggestedSlots = [];
        if (empty($suitableTables)) {
            $timeOffsets = [30, -30, 60, -60]; // ±30min, ±60min
            
            foreach ($timeOffsets as $offset) {
                $alternativeTime = $arrivalDateTime->copy()->addMinutes($offset);
                
                // Check if any table has enough seats at this time
                $hasAvailability = false;
                $maxAvailableSeats = 0;

                foreach ($tables as $table) {
                    $tableName = $table->table_name ?? "Table " . ($tables->search($table) + 1);
                    $floorLevel = $table->floor_level ?? 1;

                    $tablesInGroup = $tables->filter(function ($t) use ($tables, $tableName, $floorLevel) {
                        $tName = $t->table_name ?? "Table " . ($tables->search($t) + 1);
                        $tFloor = $t->floor_level ?? 1;
                        return $tName === $tableName && $tFloor === $floorLevel;
                    });

                    $allChairIds = [];
                    foreach ($tablesInGroup as $groupTable) {
                        $adjacentChairs = RestaurantFloorPlanItem::where('type', 'chair')
                            ->where('floor_plan_id', $groupTable->floor_plan_id)
                            ->where('floor_level', $groupTable->floor_level)
                            ->whereBetween('x', [$groupTable->x - 1, $groupTable->x + 1])
                            ->whereBetween('y', [$groupTable->y - 1, $groupTable->y + 1])
                            ->where(function ($query) use ($groupTable) {
                                $query->where('x', '!=', $groupTable->x)
                                      ->orWhere('y', '!=', $groupTable->y);
                            })
                            ->pluck('id')
                            ->toArray();
                        
                        $allChairIds = array_merge($allChairIds, $adjacentChairs);
                    }

                    $allChairIds = array_unique($allChairIds);

                    if (!empty($allChairIds)) {
                        $reservedChairIds = Reservation::whereIn('floor_plan_item_id', $allChairIds)
                            ->where('arrival_time', $alternativeTime)
                            ->where('status', '!=', 'cancelled')
                            ->pluck('floor_plan_item_id')
                            ->toArray();

                        $availableSeats = count($allChairIds) - count($reservedChairIds);
                        
                        if ($availableSeats >= $partySize) {
                            $hasAvailability = true;
                            $maxAvailableSeats = max($maxAvailableSeats, $availableSeats);
                        }
                    }
                }

                if ($hasAvailability) {
                    $suggestedSlots[] = [
                        'time' => $alternativeTime->format('H:i'),
                        'availableSeats' => $maxAvailableSeats,
                    ];
                }

                // Limit to 4 suggestions
                if (count($suggestedSlots) >= 4) {
                    break;
                }
            }
        }

        return response()->json([
            'available' => !empty($suitableTables),
            'tables' => array_values($suitableTables),
            'suggestedSlots' => $suggestedSlots,
            'message' => empty($suitableTables) 
                ? 'Aucune table disponible pour ce créneau' 
                : count($suitableTables) . ' table(s) disponible(s)',
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'table_id' => 'required|exists:restaurant_floor_plan_items,id',
                'customer_name' => 'required|string|max:255',
                'customer_email' => 'required|email|max:255',
                'customer_phone' => 'nullable|string|max:20',
                'arrival_time' => 'required|date|after:5 minutes ago',
                'party_size' => 'required|integer|min:1|max:20',
                'notes' => 'nullable|string|max:1000',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed for reservation', [
                'errors' => $e->errors(),
                'input' => $request->all(),
            ]);
            return response()->json([
                'error' => 'Validation échouée',
                'message' => 'Les données fournies sont invalides',
                'errors' => $e->errors(),
            ], 422);
        }

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
        
        try {
            for ($i = 0; $i < $validated['party_size']; $i++) {
                $reservation = Reservation::create([
                    'floor_plan_item_id' => $availableChairIds[$i],
                    'customer_name' => $validated['customer_name'],
                    'customer_email' => $validated['customer_email'],
                    'customer_phone' => $validated['customer_phone'] ?? null,
                    'arrival_time' => $validated['arrival_time'],
                    'party_size' => $validated['party_size'],
                    'notes' => $validated['notes'] ?? null,
                ]);
                $reservations[] = $reservation;
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create reservations', [
                'error' => $e->getMessage(),
                'table_id' => $validated['table_id'],
                'arrival_time' => $validated['arrival_time'],
            ]);
            return response()->json([
                'error' => 'Erreur lors de la création de la réservation',
                'message' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Réservation créée avec succès',
            'table_name' => $table->table_name ?? 'Table ' . $table->id,
            'seats_reserved' => $validated['party_size'],
            'reservations' => $reservations,
        ], 201);
    }

    public function storeEvent(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_name' => 'required|string|max:255',
                'customer_email' => 'required|email|max:255',
                'customer_phone' => 'nullable|string|max:20',
                'arrival_time' => 'required|date|after:5 minutes ago',
                'party_size' => 'required|integer|min:1|max:200',
                'notes' => 'nullable|string|max:1000',
                'event_details' => 'required|string|max:2000',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation échouée',
                'errors' => $e->errors(),
            ], 422);
        }

        $reservation = Reservation::create([
            'floor_plan_item_id' => null,
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'],
            'customer_phone' => $validated['customer_phone'] ?? null,
            'arrival_time' => $validated['arrival_time'],
            'party_size' => $validated['party_size'],
            'notes' => $validated['notes'] ?? null,
            'is_event' => true,
            'event_details' => $validated['event_details'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Demande d\'événement enregistrée. Le restaurant vous contactera pour confirmer.',
            'reservation' => $reservation,
        ], 201);
    }
}
