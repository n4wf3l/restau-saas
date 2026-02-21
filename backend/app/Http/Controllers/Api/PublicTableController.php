<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantFloorPlanItem;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantSetting;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PublicTableController extends Controller
{
    /**
     * Load restaurant settings from the floor plan owner.
     * Returns default settings if none found.
     */
    private function getSettings(): RestaurantSetting
    {
        $floorPlan = RestaurantFloorPlan::first();

        if ($floorPlan && $floorPlan->user && $floorPlan->user->settings) {
            return $floorPlan->user->settings;
        }

        // Return a default settings object (not persisted)
        return new RestaurantSetting([
            'service_duration_minutes' => 90,
            'buffer_minutes' => 15,
            'max_occupancy_pct' => 100,
            'auto_optimize_tables' => false,
            'auto_confirm' => false,
            'send_confirmation_email' => false,
        ]);
    }

    /**
     * Get chair IDs that have conflicting reservations overlapping with the proposed time window.
     * Window = [arrival_time, arrival_time + duration + buffer]
     */
    private function getConflictingChairIds(array $chairIds, Carbon $proposedArrival, int $durationMinutes, int $bufferMinutes): array
    {
        if (empty($chairIds)) {
            return [];
        }

        $totalMinutes = $durationMinutes + $bufferMinutes;
        $proposedEnd = $proposedArrival->copy()->addMinutes($totalMinutes);

        $driver = Reservation::getConnectionResolver()
            ->connection()
            ->getDriverName();

        $query = Reservation::whereIn('floor_plan_item_id', $chairIds)
            ->where('status', '!=', 'cancelled')
            ->where('arrival_time', '<', $proposedEnd);

        if ($driver === 'sqlite') {
            $query->whereRaw(
                "datetime(arrival_time, '+' || ? || ' minutes') > ?",
                [$totalMinutes, $proposedArrival->toDateTimeString()]
            );
        } else {
            $query->whereRaw(
                'DATE_ADD(arrival_time, INTERVAL ? MINUTE) > ?',
                [$totalMinutes, $proposedArrival]
            );
        }

        return $query->pluck('floor_plan_item_id')->toArray();
    }

    /**
     * Find all chairs adjacent to a table group and return their IDs.
     */
    private function getAdjacentChairIds($tablesInGroup): array
    {
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

        return array_values(array_unique($allChairIds));
    }

    /**
     * Group tables by name and floor, returning structured groups.
     */
    private function getTableGroups()
    {
        $tables = RestaurantFloorPlanItem::where('type', 'table')->get();
        $groups = [];
        $processedIds = [];
        $tableIndex = 1;

        foreach ($tables as $table) {
            if (in_array($table->id, $processedIds)) {
                continue;
            }

            $tableName = $table->table_name ?? "Table $tableIndex";
            $floorLevel = $table->floor_level ?? 1;

            $tablesInGroup = $tables->filter(function ($t) use ($tables, $tableName, $floorLevel) {
                $tName = $t->table_name ?? "Table " . ($tables->search($t) + 1);
                $tFloor = $t->floor_level ?? 1;
                return $tName === $tableName && $tFloor === $floorLevel;
            });

            foreach ($tablesInGroup as $t) {
                $processedIds[] = $t->id;
            }

            $chairIds = $this->getAdjacentChairIds($tablesInGroup);

            if (empty($chairIds)) {
                $tableIndex++;
                continue;
            }

            $groups[] = [
                'table' => $table,
                'name' => $tableName,
                'floor' => $table->floor_name ?? 'Rez-de-chaussée',
                'chairIds' => $chairIds,
                'totalSeats' => count($chairIds),
            ];

            $tableIndex++;
        }

        return $groups;
    }

    public function index()
    {
        $settings = $this->getSettings();
        $groups = $this->getTableGroups();
        $now = Carbon::now();

        $groupedTables = [];

        foreach ($groups as $group) {
            // Use time-range conflict checking
            $conflictingIds = $this->getConflictingChairIds(
                $group['chairIds'],
                $now,
                $settings->service_duration_minutes,
                $settings->buffer_minutes
            );

            $occupiedSeats = count($conflictingIds);
            $availableSeats = $group['totalSeats'] - $occupiedSeats;

            // Get upcoming reservations for display
            $reservations = Reservation::whereIn('floor_plan_item_id', $group['chairIds'])
                ->where('arrival_time', '>=', $now)
                ->where('status', '!=', 'cancelled')
                ->get();

            $groupedTables[] = [
                'id' => $group['table']->id,
                'name' => $group['name'],
                'floor' => $group['floor'],
                'x' => $group['table']->x,
                'y' => $group['table']->y,
                'total_seats' => $group['totalSeats'],
                'available_seats' => $availableSeats,
                'occupied_seats' => $occupiedSeats,
                'is_available' => $availableSeats > 0,
                'chair_ids' => $group['chairIds'],
                'reservations' => $reservations->map(function ($reservation) {
                    return [
                        'id' => $reservation->id,
                        'arrival_time' => $reservation->arrival_time->format('Y-m-d H:i'),
                        'status' => $reservation->status,
                        'party_size' => $reservation->party_size,
                    ];
                }),
            ];
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

        $settings = $this->getSettings();
        $arrivalDateTime = Carbon::parse($validated['date'] . ' ' . $validated['time']);
        $partySize = $validated['party_size'];
        $duration = $settings->service_duration_minutes;
        $buffer = $settings->buffer_minutes;

        $groups = $this->getTableGroups();

        // Check max occupancy
        $totalRestaurantChairs = 0;
        $totalOccupiedChairs = 0;
        foreach ($groups as $group) {
            $totalRestaurantChairs += $group['totalSeats'];
            $conflicting = $this->getConflictingChairIds($group['chairIds'], $arrivalDateTime, $duration, $buffer);
            $totalOccupiedChairs += count($conflicting);
        }

        $maxAllowed = (int) floor($totalRestaurantChairs * $settings->max_occupancy_pct / 100);
        if (($totalOccupiedChairs + $partySize) > $maxAllowed) {
            return response()->json([
                'available' => false,
                'tables' => [],
                'suggestedSlots' => [],
                'message' => 'Capacité maximale du restaurant atteinte pour ce créneau',
            ]);
        }

        // Check each table group
        $availableTables = [];

        foreach ($groups as $group) {
            $conflictingIds = $this->getConflictingChairIds($group['chairIds'], $arrivalDateTime, $duration, $buffer);
            $availableSeats = $group['totalSeats'] - count($conflictingIds);

            // Get upcoming reservations for display
            $reservations = Reservation::whereIn('floor_plan_item_id', $group['chairIds'])
                ->where('arrival_time', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->get();

            $availableTables[] = [
                'id' => $group['table']->id,
                'name' => $group['name'],
                'floor' => $group['floor'],
                'x' => $group['table']->x,
                'y' => $group['table']->y,
                'total_seats' => $group['totalSeats'],
                'available_seats' => $availableSeats,
                'occupied_seats' => count($conflictingIds),
                'is_available' => $availableSeats > 0,
                'chair_ids' => $group['chairIds'],
                'reservations' => $reservations->map(function ($reservation) {
                    return [
                        'id' => $reservation->id,
                        'arrival_time' => $reservation->arrival_time->format('Y-m-d H:i'),
                        'status' => $reservation->status,
                        'party_size' => $reservation->party_size,
                    ];
                }),
            ];
        }

        // Filter tables that can accommodate party_size
        $suitableTables = array_filter($availableTables, function ($table) use ($partySize) {
            return $table['available_seats'] >= $partySize;
        });

        // If no suitable tables, suggest alternative time slots
        $suggestedSlots = [];
        if (empty($suitableTables)) {
            $timeOffsets = [30, -30, 60, -60];

            foreach ($timeOffsets as $offset) {
                $alternativeTime = $arrivalDateTime->copy()->addMinutes($offset);
                $hasAvailability = false;
                $maxAvailableSeats = 0;

                foreach ($groups as $group) {
                    $conflicting = $this->getConflictingChairIds($group['chairIds'], $alternativeTime, $duration, $buffer);
                    $available = $group['totalSeats'] - count($conflicting);

                    if ($available >= $partySize) {
                        $hasAvailability = true;
                        $maxAvailableSeats = max($maxAvailableSeats, $available);
                    }
                }

                if ($hasAvailability) {
                    $suggestedSlots[] = [
                        'time' => $alternativeTime->format('H:i'),
                        'availableSeats' => $maxAvailableSeats,
                    ];
                }

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
            'settings' => [
                'auto_optimize_tables' => $settings->auto_optimize_tables,
                'service_duration_minutes' => $settings->service_duration_minutes,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $settings = $this->getSettings();

        try {
            $rules = [
                'customer_name' => 'required|string|max:255',
                'customer_email' => 'required|email|max:255',
                'customer_phone' => 'nullable|string|max:20',
                'arrival_time' => 'required|date|after:5 minutes ago',
                'party_size' => 'required|integer|min:1|max:20',
                'notes' => 'nullable|string|max:1000',
            ];

            // table_id is optional when auto_optimize is on
            if (!$settings->auto_optimize_tables) {
                $rules['table_id'] = 'required|exists:restaurant_floor_plan_items,id';
            } else {
                $rules['table_id'] = 'nullable|exists:restaurant_floor_plan_items,id';
            }

            $validated = $request->validate($rules);
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

        $duration = $settings->service_duration_minutes;
        $buffer = $settings->buffer_minutes;
        $arrivalTime = Carbon::parse($validated['arrival_time']);
        $initialStatus = $settings->auto_confirm ? 'confirmed' : 'pending';

        // Auto-optimize: find smallest available table
        if ($settings->auto_optimize_tables) {
            $bestTable = $this->findSmallestAvailableTable(
                $validated['party_size'],
                $arrivalTime,
                $duration,
                $buffer
            );

            if (!$bestTable) {
                return response()->json(['error' => 'Aucune table disponible pour ce créneau'], 422);
            }

            $table = $bestTable['table'];
            $availableChairIds = $bestTable['availableChairIds'];
            $tableName = $bestTable['name'];
        } else {
            // Manual table selection
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

            $chairIds = $adjacentChairs->pluck('id')->toArray();

            // Time-range conflict check
            $conflictingIds = $this->getConflictingChairIds($chairIds, $arrivalTime, $duration, $buffer);
            $availableChairIds = array_values(array_diff($chairIds, $conflictingIds));
            $tableName = $table->table_name ?? 'Table ' . $table->id;
        }

        if (count($availableChairIds) < $validated['party_size']) {
            return response()->json([
                'error' => 'Pas assez de places disponibles. Places disponibles: ' . count($availableChairIds)
            ], 422);
        }

        // Create reservations for the required number of seats
        $reservations = [];

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
                    'status' => $initialStatus,
                ]);
                $reservations[] = $reservation;
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create reservations', [
                'error' => $e->getMessage(),
                'arrival_time' => $validated['arrival_time'],
            ]);
            return response()->json([
                'error' => 'Erreur lors de la création de la réservation',
                'message' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Réservation créée avec succès',
            'table_name' => $tableName,
            'seats_reserved' => $validated['party_size'],
            'reservations' => $reservations,
        ], 201);
    }

    /**
     * Find the smallest available table that fits the party size.
     */
    private function findSmallestAvailableTable(int $partySize, Carbon $arrivalTime, int $duration, int $buffer): ?array
    {
        $groups = $this->getTableGroups();

        // Sort by total seats ascending (smallest first)
        usort($groups, fn($a, $b) => $a['totalSeats'] <=> $b['totalSeats']);

        foreach ($groups as $group) {
            if ($group['totalSeats'] < $partySize) {
                continue;
            }

            $conflictingIds = $this->getConflictingChairIds($group['chairIds'], $arrivalTime, $duration, $buffer);
            $availableChairIds = array_values(array_diff($group['chairIds'], $conflictingIds));

            if (count($availableChairIds) >= $partySize) {
                return [
                    'table' => $group['table'],
                    'name' => $group['name'],
                    'availableChairIds' => $availableChairIds,
                ];
            }
        }

        return null;
    }

    public function storeEvent(Request $request)
    {
        $settings = $this->getSettings();

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
            'status' => $settings->auto_confirm ? 'confirmed' : 'pending',
        ]);

        return response()->json([
            'message' => 'Demande d\'événement enregistrée. Le restaurant vous contactera pour confirmer.',
            'reservation' => $reservation,
        ], 201);
    }
}
