<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantFloorPlanItem;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantSetting;
use App\Models\Reservation;
use Illuminate\Http\Request;
use App\Services\ReservationMailService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PublicTableController extends Controller
{
    /**
     * Load the shared restaurant settings.
     * Returns default settings if none found.
     */
    private function getSettings(): RestaurantSetting
    {
        return RestaurantSetting::first() ?? new RestaurantSetting([
            'service_duration_minutes' => 90,
            'buffer_minutes' => 15,
            'max_occupancy_pct' => 100,
            'auto_optimize_tables' => false,
            'auto_confirm' => false,
            'send_confirmation_email' => false,
        ]);
    }

    /**
     * Check if the given arrival time is within restaurant opening hours.
     * Returns null if OK, or an error message string if outside hours.
     */
    private function checkOpeningHours(RestaurantSetting $settings, Carbon $arrivalTime): ?string
    {
        $hours = $settings->opening_hours;
        if (!$hours || !is_array($hours)) {
            return null; // No hours configured = always open
        }

        $dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $dayKey = $dayMap[$arrivalTime->dayOfWeek];

        if (!isset($hours[$dayKey])) {
            return null;
        }

        $dayHours = $hours[$dayKey];

        if (!empty($dayHours['closed'])) {
            return "Le restaurant est fermé le " . $this->frenchDay($dayKey);
        }

        $openTime = $dayHours['open'] ?? null;
        $closeTime = $dayHours['close'] ?? null;

        if ($openTime && $closeTime) {
            $arrivalMinutes = $arrivalTime->hour * 60 + $arrivalTime->minute;
            $openParts = explode(':', $openTime);
            $closeParts = explode(':', $closeTime);
            $openMinutes = (int)$openParts[0] * 60 + (int)($openParts[1] ?? 0);
            $closeMinutes = (int)$closeParts[0] * 60 + (int)($closeParts[1] ?? 0);

            if ($arrivalMinutes < $openMinutes || $arrivalMinutes >= $closeMinutes) {
                return "Le restaurant est ouvert de {$openTime} à {$closeTime}. Veuillez choisir un horaire dans cette plage.";
            }
        }

        return null;
    }

    private function frenchDay(string $day): string
    {
        $map = [
            'monday' => 'lundi', 'tuesday' => 'mardi', 'wednesday' => 'mercredi',
            'thursday' => 'jeudi', 'friday' => 'vendredi', 'saturday' => 'samedi', 'sunday' => 'dimanche',
        ];
        return $map[$day] ?? $day;
    }

    /**
     * Check if the given date falls on a closure date.
     * Returns null if OK, or an error message string if closed.
     */
    private function checkClosureDates(RestaurantSetting $settings, Carbon $arrivalTime): ?string
    {
        $closures = $settings->closure_dates;
        if (!$closures || !is_array($closures)) {
            return null;
        }

        $dateStr = $arrivalTime->format('Y-m-d');

        foreach ($closures as $closure) {
            if (isset($closure['date']) && $closure['date'] === $dateStr) {
                $reason = $closure['reason'] ?? '';
                $msg = "Le restaurant est fermé le " . $arrivalTime->format('d/m/Y');
                if ($reason) {
                    $msg .= " ({$reason})";
                }
                return $msg . ". Veuillez choisir une autre date.";
            }
        }

        return null;
    }

    /**
     * Batch-query conflicting chair IDs for ALL chairs at once.
     * Returns an array of conflicting floor_plan_item_ids.
     */
    private function getBatchConflictingChairIds(array $allChairIds, Carbon $proposedArrival, int $durationMinutes, int $bufferMinutes): array
    {
        if (empty($allChairIds)) {
            return [];
        }

        $totalMinutes = $durationMinutes + $bufferMinutes;
        $proposedEnd = $proposedArrival->copy()->addMinutes($totalMinutes);

        $driver = Reservation::getConnectionResolver()
            ->connection()
            ->getDriverName();

        $query = Reservation::whereIn('floor_plan_item_id', $allChairIds)
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
     * Find adjacent chair IDs for tables using a pre-loaded chairs collection (in-memory filter).
     */
    private function getAdjacentChairIdsFromCollection($tablesInGroup, $allChairs): array
    {
        $allChairIds = [];
        foreach ($tablesInGroup as $groupTable) {
            $adjacent = $allChairs->filter(function ($chair) use ($groupTable) {
                return $chair->floor_plan_id === $groupTable->floor_plan_id
                    && $chair->floor_level === $groupTable->floor_level
                    && $chair->x >= $groupTable->x - 1 && $chair->x <= $groupTable->x + 1
                    && $chair->y >= $groupTable->y - 1 && $chair->y <= $groupTable->y + 1
                    && ($chair->x !== $groupTable->x || $chair->y !== $groupTable->y);
            })->pluck('id')->toArray();

            $allChairIds = array_merge($allChairIds, $adjacent);
        }

        return array_values(array_unique($allChairIds));
    }

    /**
     * Group tables by name and floor, returning structured groups.
     * Only 2 DB queries: one for tables, one for chairs.
     */
    private function getTableGroups()
    {
        $tables = RestaurantFloorPlanItem::where('type', 'table')->get();
        $allChairs = RestaurantFloorPlanItem::where('type', 'chair')->get();

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

            $chairIds = $this->getAdjacentChairIdsFromCollection($tablesInGroup, $allChairs);

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

    /**
     * Build table response data using batched conflict check (1 query for all groups).
     */
    private function buildTableData(array $groups, Carbon $arrivalTime, int $duration, int $buffer): array
    {
        // Collect ALL chair IDs across all groups
        $allChairIds = [];
        foreach ($groups as $group) {
            $allChairIds = array_merge($allChairIds, $group['chairIds']);
        }
        $allChairIds = array_values(array_unique($allChairIds));

        // Single batched query for all conflicts
        $allConflicting = $this->getBatchConflictingChairIds($allChairIds, $arrivalTime, $duration, $buffer);
        $conflictingSet = array_flip($allConflicting);

        // Build response per group using in-memory lookup
        $tables = [];
        foreach ($groups as $group) {
            $conflictCount = 0;
            foreach ($group['chairIds'] as $chairId) {
                if (isset($conflictingSet[$chairId])) {
                    $conflictCount++;
                }
            }
            $availableSeats = $group['totalSeats'] - $conflictCount;

            $tables[] = [
                'id' => $group['table']->id,
                'name' => $group['name'],
                'floor' => $group['floor'],
                'total_seats' => $group['totalSeats'],
                'available_seats' => $availableSeats,
                'is_available' => $availableSeats > 0,
                'chair_ids' => $group['chairIds'],
            ];
        }

        return $tables;
    }

    public function index()
    {
        $settings = $this->getSettings();
        $groups = $this->getTableGroups();
        $now = Carbon::now();

        $groupedTables = $this->buildTableData(
            $groups, $now,
            $settings->service_duration_minutes,
            $settings->buffer_minutes
        );

        return response()->json($groupedTables);
    }

    public function checkAvailability(Request $request)
    {
        $settings = $this->getSettings();
        if (!$settings->reservations_enabled) {
            return response()->json(['error' => 'Les réservations sont actuellement désactivées.'], 403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|string',
            'party_size' => 'required|integer|min:1|max:20',
        ]);
        $arrivalDateTime = Carbon::parse($validated['date'] . ' ' . $validated['time']);
        $partySize = $validated['party_size'];
        $duration = $settings->service_duration_minutes;
        $buffer = $settings->buffer_minutes;

        // Check closure dates
        $closureError = $this->checkClosureDates($settings, $arrivalDateTime);
        if ($closureError) {
            return response()->json([
                'available' => false,
                'tables' => [],
                'suggestedSlots' => [],
                'message' => $closureError,
            ]);
        }

        // Check opening hours
        $hoursError = $this->checkOpeningHours($settings, $arrivalDateTime);
        if ($hoursError) {
            return response()->json([
                'available' => false,
                'tables' => [],
                'suggestedSlots' => [],
                'message' => $hoursError,
            ]);
        }

        $groups = $this->getTableGroups();

        // Build table data with single batched conflict query
        $availableTables = $this->buildTableData($groups, $arrivalDateTime, $duration, $buffer);

        // Check max occupancy from built data
        $totalRestaurantChairs = 0;
        $totalOccupiedChairs = 0;
        foreach ($availableTables as $table) {
            $totalRestaurantChairs += $table['total_seats'];
            $totalOccupiedChairs += ($table['total_seats'] - $table['available_seats']);
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
                $altTables = $this->buildTableData($groups, $alternativeTime, $duration, $buffer);
                $maxAvailableSeats = 0;
                $hasAvailability = false;

                foreach ($altTables as $t) {
                    if ($t['available_seats'] >= $partySize) {
                        $hasAvailability = true;
                        $maxAvailableSeats = max($maxAvailableSeats, $t['available_seats']);
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

        if (!$settings->reservations_enabled) {
            return response()->json(['error' => 'Les réservations sont actuellement désactivées.'], 403);
        }

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

        // Check closure dates
        $closureError = $this->checkClosureDates($settings, $arrivalTime);
        if ($closureError) {
            return response()->json(['error' => $closureError], 422);
        }

        // Check opening hours
        $hoursError = $this->checkOpeningHours($settings, $arrivalTime);
        if ($hoursError) {
            return response()->json(['error' => $hoursError], 422);
        }

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
            $adjacentChairs = RestaurantFloorPlanItem::adjacentChairs($table);

            if ($adjacentChairs->isEmpty()) {
                return response()->json(['error' => 'Aucune chaise disponible autour de cette table.'], 422);
            }

            $chairIds = $adjacentChairs->pluck('id')->toArray();

            // Time-range conflict check
            $conflictingIds = $this->getBatchConflictingChairIds($chairIds, $arrivalTime, $duration, $buffer);
            $availableChairIds = array_values(array_diff($chairIds, $conflictingIds));
            $tableName = $table->table_name ?? 'Table ' . $table->id;
        }

        if (count($availableChairIds) < $validated['party_size']) {
            return response()->json([
                'error' => 'Pas assez de places disponibles. Places disponibles: ' . count($availableChairIds)
            ], 422);
        }

        // Create reservations for the required number of seats (atomic)
        try {
            $reservations = DB::transaction(function () use ($validated, $availableChairIds, $initialStatus) {
                $created = [];
                for ($i = 0; $i < $validated['party_size']; $i++) {
                    $created[] = Reservation::create([
                        'floor_plan_item_id' => $availableChairIds[$i],
                        'customer_name' => $validated['customer_name'],
                        'customer_email' => $validated['customer_email'],
                        'customer_phone' => $validated['customer_phone'] ?? null,
                        'arrival_time' => $validated['arrival_time'],
                        'party_size' => $validated['party_size'],
                        'notes' => $validated['notes'] ?? null,
                        'status' => $initialStatus,
                    ]);
                }
                return $created;
            });
        } catch (\Exception $e) {
            \Log::error('Failed to create reservations', [
                'error' => $e->getMessage(),
                'arrival_time' => $validated['arrival_time'],
            ]);
            return response()->json([
                'error' => 'Erreur lors de la création de la réservation',
            ], 500);
        }

        // Send confirmation/pending email (one per group)
        ReservationMailService::sendByStatus($reservations[0], $tableName);

        return response()->json([
            'message' => 'Réservation créée avec succès',
            'table_name' => $tableName,
            'seats_reserved' => $validated['party_size'],
            'reservations' => $reservations,
        ], 201);
    }

    /**
     * Find the smallest available table that fits the party size.
     * Uses batched conflict check for all groups at once.
     */
    private function findSmallestAvailableTable(int $partySize, Carbon $arrivalTime, int $duration, int $buffer): ?array
    {
        $groups = $this->getTableGroups();

        // Collect ALL chair IDs for a single batched conflict query
        $allChairIds = [];
        foreach ($groups as $group) {
            $allChairIds = array_merge($allChairIds, $group['chairIds']);
        }
        $allConflicting = $this->getBatchConflictingChairIds(array_values(array_unique($allChairIds)), $arrivalTime, $duration, $buffer);
        $conflictingSet = array_flip($allConflicting);

        // Sort by total seats ascending (smallest first)
        usort($groups, fn($a, $b) => $a['totalSeats'] <=> $b['totalSeats']);

        foreach ($groups as $group) {
            if ($group['totalSeats'] < $partySize) {
                continue;
            }

            $availableChairIds = array_values(array_filter($group['chairIds'], fn($id) => !isset($conflictingSet[$id])));

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

        if (!$settings->reservations_enabled) {
            return response()->json(['error' => 'Les réservations sont actuellement désactivées.'], 403);
        }

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

        // Send confirmation/pending email
        ReservationMailService::sendByStatus($reservation, 'Événement');

        return response()->json([
            'message' => 'Demande d\'événement enregistrée. Le restaurant vous contactera pour confirmer.',
            'reservation' => $reservation,
        ], 201);
    }
}
