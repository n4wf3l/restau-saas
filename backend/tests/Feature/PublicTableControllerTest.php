<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantFloorPlanItem;
use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicTableControllerTest extends TestCase
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

        // Use the floor plan and settings auto-created by UserObserver
        $this->floorPlan = RestaurantFloorPlan::where('user_id', $this->user->id)->first();

        $settings = RestaurantSetting::where('user_id', $this->user->id)->first();
        $settings->update([
            'service_duration_minutes' => 90,
            'buffer_minutes' => 15,
            'max_occupancy_pct' => 100,
            'reservations_enabled' => true,
            'auto_confirm' => false,
        ]);

        // Table at (5, 5) with 4 chairs
        $this->table = RestaurantFloorPlanItem::create([
            'floor_plan_id' => $this->floorPlan->id,
            'type' => 'table',
            'x' => 5,
            'y' => 5,
            'rotation' => 0,
            'floor_level' => 1,
            'table_name' => 'Table 1',
        ]);

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

    public function test_index_returns_tables_with_availability(): void
    {
        $response = $this->getJson('/api/public/tables');

        $response->assertOk();
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('Table 1', $data[0]['name']);
        $this->assertEquals(4, $data[0]['total_seats']);
        $this->assertTrue($data[0]['is_available']);
    }

    public function test_check_availability_returns_available_tables(): void
    {
        $response = $this->postJson('/api/public/check-availability', [
            'date' => '2026-03-15',
            'time' => '19:00',
            'party_size' => 2,
        ]);

        $response->assertOk();
        $data = $response->json();
        $this->assertTrue($data['available']);
        $this->assertNotEmpty($data['tables']);
    }

    public function test_check_availability_detects_conflict(): void
    {
        // Fill all 4 chairs with existing reservations
        foreach ($this->chairIds as $chairId) {
            Reservation::create([
                'floor_plan_item_id' => $chairId,
                'customer_name' => 'Existing',
                'customer_email' => 'existing@test.com',
                'arrival_time' => '2026-03-15 19:00:00',
                'party_size' => 4,
                'status' => 'confirmed',
            ]);
        }

        $response = $this->postJson('/api/public/check-availability', [
            'date' => '2026-03-15',
            'time' => '19:30', // Overlaps with 19:00 + 90min service
            'party_size' => 2,
        ]);

        $response->assertOk();
        $data = $response->json();
        $this->assertFalse($data['available']);
    }

    public function test_check_availability_no_conflict_after_service_duration(): void
    {
        // Service duration = 90 min + 15 min buffer = 105 min total
        foreach ($this->chairIds as $chairId) {
            Reservation::create([
                'floor_plan_item_id' => $chairId,
                'customer_name' => 'Early',
                'customer_email' => 'early@test.com',
                'arrival_time' => '2026-03-15 17:00:00',
                'party_size' => 4,
                'status' => 'confirmed',
            ]);
        }

        // 17:00 + 105 min = 18:45, so 19:00 should be free
        $response = $this->postJson('/api/public/check-availability', [
            'date' => '2026-03-15',
            'time' => '19:00',
            'party_size' => 2,
        ]);

        $response->assertOk();
        $data = $response->json();
        $this->assertTrue($data['available']);
    }

    public function test_check_availability_respects_closure_dates(): void
    {
        $settings = RestaurantSetting::first();
        $settings->update([
            'closure_dates' => [
                ['date' => '2026-03-20', 'reason' => 'Travaux'],
            ],
        ]);

        $response = $this->postJson('/api/public/check-availability', [
            'date' => '2026-03-20',
            'time' => '19:00',
            'party_size' => 2,
        ]);

        $response->assertOk();
        $data = $response->json();
        $this->assertFalse($data['available']);
        $this->assertStringContainsString('fermé', $data['message']);
    }

    public function test_check_availability_respects_opening_hours(): void
    {
        $settings = RestaurantSetting::first();
        // 2026-03-16 is a Monday
        $settings->update([
            'opening_hours' => [
                'monday' => ['open' => '12:00', 'close' => '14:00', 'closed' => false],
                'tuesday' => ['open' => '12:00', 'close' => '22:00', 'closed' => false],
                'wednesday' => ['open' => '12:00', 'close' => '22:00', 'closed' => false],
                'thursday' => ['open' => '12:00', 'close' => '22:00', 'closed' => false],
                'friday' => ['open' => '12:00', 'close' => '22:00', 'closed' => false],
                'saturday' => ['open' => '12:00', 'close' => '22:00', 'closed' => false],
                'sunday' => ['open' => '12:00', 'close' => '22:00', 'closed' => true],
            ],
        ]);

        // Monday at 19:00 — outside 12:00-14:00
        $response = $this->postJson('/api/public/check-availability', [
            'date' => '2026-03-16', // Monday
            'time' => '19:00',
            'party_size' => 2,
        ]);

        $response->assertOk();
        $data = $response->json();
        $this->assertFalse($data['available']);
        $this->assertStringContainsString('ouvert de', $data['message']);
    }

    public function test_check_availability_rejects_when_disabled(): void
    {
        $settings = RestaurantSetting::first();
        $settings->update(['reservations_enabled' => false]);

        $response = $this->postJson('/api/public/check-availability', [
            'date' => '2026-03-15',
            'time' => '19:00',
            'party_size' => 2,
        ]);

        $response->assertStatus(403);
    }

    public function test_store_creates_public_reservation(): void
    {
        $response = $this->postJson('/api/public/reservations', [
            'customer_name' => 'Public User',
            'customer_email' => 'public@example.com',
            'customer_phone' => '0601020304',
            'arrival_time' => '2026-03-15 19:00:00',
            'party_size' => 2,
            'table_id' => $this->table->id,
        ]);

        $response->assertStatus(201);
        // 2 reservation rows (1 per person)
        $this->assertEquals(2, Reservation::count());
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->postJson('/api/public/reservations', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_name', 'customer_email', 'arrival_time', 'party_size']);
    }

    public function test_cancelled_reservations_dont_block_availability(): void
    {
        // Create cancelled reservations — should not block
        foreach ($this->chairIds as $chairId) {
            Reservation::create([
                'floor_plan_item_id' => $chairId,
                'customer_name' => 'Cancelled',
                'customer_email' => 'cancelled@test.com',
                'arrival_time' => '2026-03-15 19:00:00',
                'party_size' => 4,
                'status' => 'cancelled',
            ]);
        }

        $response = $this->postJson('/api/public/check-availability', [
            'date' => '2026-03-15',
            'time' => '19:00',
            'party_size' => 2,
        ]);

        $response->assertOk();
        $data = $response->json();
        $this->assertTrue($data['available']);
    }
}
