<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantFloorPlanItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private RestaurantFloorPlan $floorPlan;
    private RestaurantFloorPlanItem $table;
    private array $chairIds;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        // Use the floor plan auto-created by UserObserver
        $this->floorPlan = RestaurantFloorPlan::where('user_id', $this->user->id)->first();

        // Create a table at (5, 5)
        $this->table = RestaurantFloorPlanItem::create([
            'floor_plan_id' => $this->floorPlan->id,
            'type' => 'table',
            'x' => 5,
            'y' => 5,
            'rotation' => 0,
            'floor_level' => 1,
            'table_name' => 'Table Test',
        ]);

        // Create 4 adjacent chairs
        $this->chairIds = [];
        foreach ([[4, 5], [6, 5], [5, 4], [5, 6]] as [$x, $y]) {
            $chair = RestaurantFloorPlanItem::create([
                'floor_plan_id' => $this->floorPlan->id,
                'type' => 'chair',
                'x' => $x,
                'y' => $y,
                'rotation' => 0,
                'floor_level' => 1,
            ]);
            $this->chairIds[] = $chair->id;
        }
    }

    public function test_index_returns_empty_when_no_reservations(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/reservations');

        $response->assertOk()->assertJson([]);
    }

    public function test_store_creates_reservation_for_party(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/reservations', [
            'customer_name' => 'Jean Dupont',
            'customer_email' => 'jean@example.com',
            'customer_phone' => '0612345678',
            'arrival_time' => '2026-03-15 19:00:00',
            'party_size' => 2,
            'table_id' => $this->table->id,
            'notes' => 'Allergie gluten',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Réservation créée');

        // Should create 2 rows (one per person)
        $this->assertDatabaseCount('reservations', 2);

        // All rows should share the same customer data
        $reservations = Reservation::all();
        foreach ($reservations as $r) {
            $this->assertEquals('Jean Dupont', $r->customer_name);
            $this->assertEquals('confirmed', $r->status);
            $this->assertEquals(2, $r->party_size);
        }
    }

    public function test_store_fails_when_party_too_large(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/reservations', [
            'customer_name' => 'Jean',
            'customer_email' => 'jean@example.com',
            'arrival_time' => '2026-03-15 19:00:00',
            'party_size' => 10, // Only 4 chairs available
            'table_id' => $this->table->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'Pas assez de places. Places disponibles: 4');
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/reservations', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_name', 'customer_email', 'arrival_time', 'party_size', 'table_id']);
    }

    public function test_index_groups_reservations_by_customer(): void
    {
        // Create 3 reservation rows for party of 3
        for ($i = 0; $i < 3; $i++) {
            Reservation::create([
                'floor_plan_item_id' => $this->chairIds[$i],
                'customer_name' => 'Alice Martin',
                'customer_email' => 'alice@example.com',
                'arrival_time' => '2026-03-15 20:00:00',
                'party_size' => 3,
                'status' => 'confirmed',
            ]);
        }

        $response = $this->actingAs($this->user)->getJson('/api/reservations');

        $response->assertOk();
        $data = $response->json();
        // Should be grouped into 1 entry
        $this->assertCount(1, $data);
        $this->assertEquals('Alice Martin', $data[0]['customer_name']);
        $this->assertEquals(3, $data[0]['party_size']);
        $this->assertCount(3, $data[0]['ids']);
    }

    public function test_update_status_updates_all_rows_in_group(): void
    {
        for ($i = 0; $i < 2; $i++) {
            Reservation::create([
                'floor_plan_item_id' => $this->chairIds[$i],
                'customer_name' => 'Bob',
                'customer_email' => 'bob@example.com',
                'arrival_time' => '2026-03-15 19:30:00',
                'party_size' => 2,
                'status' => 'pending',
            ]);
        }

        $firstId = Reservation::first()->id;
        $response = $this->actingAs($this->user)->putJson("/api/reservations/{$firstId}", [
            'status' => 'confirmed',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Réservation mise à jour');

        // Both rows should be confirmed
        $this->assertEquals(2, Reservation::where('status', 'confirmed')->count());
    }

    public function test_no_show_soft_deletes_group(): void
    {
        for ($i = 0; $i < 2; $i++) {
            Reservation::create([
                'floor_plan_item_id' => $this->chairIds[$i],
                'customer_name' => 'Charlie',
                'customer_email' => 'charlie@example.com',
                'arrival_time' => '2026-03-15 21:00:00',
                'party_size' => 2,
                'status' => 'confirmed',
            ]);
        }

        $firstId = Reservation::first()->id;
        $response = $this->actingAs($this->user)->putJson("/api/reservations/{$firstId}", [
            'status' => 'no_show',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Réservation marquée comme no-show');

        // Should be soft-deleted
        $this->assertEquals(0, Reservation::count());
        $this->assertEquals(2, Reservation::withTrashed()->count());
    }

    public function test_restore_recovers_soft_deleted_group(): void
    {
        for ($i = 0; $i < 2; $i++) {
            Reservation::create([
                'floor_plan_item_id' => $this->chairIds[$i],
                'customer_name' => 'Diana',
                'customer_email' => 'diana@example.com',
                'arrival_time' => '2026-03-15 19:00:00',
                'party_size' => 2,
                'status' => 'no_show',
                'deleted_at' => now(),
            ]);
        }

        $firstId = Reservation::withTrashed()->first()->id;
        $response = $this->actingAs($this->user)->postJson("/api/reservations/{$firstId}/restore");

        $response->assertOk()
            ->assertJsonPath('message', 'Réservation restaurée');

        // Both rows should be restored and confirmed
        $this->assertEquals(2, Reservation::where('status', 'confirmed')->count());
    }

    public function test_destroy_force_deletes_group(): void
    {
        for ($i = 0; $i < 2; $i++) {
            Reservation::create([
                'floor_plan_item_id' => $this->chairIds[$i],
                'customer_name' => 'Eva',
                'customer_email' => 'eva@example.com',
                'arrival_time' => '2026-03-15 20:00:00',
                'party_size' => 2,
                'status' => 'confirmed',
            ]);
        }

        $firstId = Reservation::first()->id;
        $response = $this->actingAs($this->user)->deleteJson("/api/reservations/{$firstId}");

        $response->assertOk()
            ->assertJsonPath('message', 'Réservation supprimée');

        $this->assertEquals(0, Reservation::withTrashed()->count());
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/reservations');
        $response->assertStatus(401);
    }
}
