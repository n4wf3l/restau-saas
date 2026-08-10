<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantFloorPlanItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private RestaurantFloorPlan $floorPlan;
    private int $chairId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->activateTenant($this->user);
        $this->floorPlan = RestaurantFloorPlan::where('user_id', $this->user->id)->first();

        $chair = RestaurantFloorPlanItem::create([
            'floor_plan_id' => $this->floorPlan->id,
            'type' => 'chair',
            'x' => 1, 'y' => 1, 'rotation' => 0, 'floor_level' => 1,
        ]);
        $this->chairId = $chair->id;
    }

    // ─── Guest access ───────────────────────────────────────────────────

    public function test_guest_cannot_access_analytics(): void
    {
        $response = $this->getJson('/api/analytics/summary');
        $response->assertStatus(401);
    }

    // ─── Empty state ────────────────────────────────────────────────────

    public function test_returns_zero_stats_when_no_reservations(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/analytics/summary');
        $response->assertOk();
        $this->assertTrue($response->json('has_data'));
        $this->assertEquals(0, $response->json('headline.total_this_month'));
        $this->assertEquals(0, $response->json('headline.avg_party_size'));
        $this->assertNull($response->json('headline.pct_change'), 'No previous month = null pct');
    }

    // ─── Headline stats ─────────────────────────────────────────────────

    public function test_counts_reservations_this_month(): void
    {
        // 3 confirmed reservations this month
        for ($i = 0; $i < 3; $i++) {
            Reservation::create([
                'floor_plan_item_id' => $this->chairId,
                'customer_name' => "Guest {$i}",
                'customer_email' => "g{$i}@test.com",
                'customer_phone' => '0601020304',
                'arrival_time' => now()->startOfMonth()->addDays(5)->addHours($i),
                'party_size' => 2 + $i,
                'status' => 'confirmed',
            ]);
        }

        $response = $this->actingAs($this->user)->getJson('/api/analytics/summary');
        $response->assertOk();
        $this->assertEquals(3, $response->json('headline.total_this_month'));
        $this->assertEquals(3, $response->json('status_breakdown.confirmed'));
        $this->assertEquals(100, $response->json('headline.confirmed_rate'));
        // Avg party size = (2+3+4)/3 = 3
        $this->assertEquals(3.0, $response->json('headline.avg_party_size'));
    }

    public function test_deduplicates_multi_chair_reservations(): void
    {
        // A single booking that spans 4 rows (one per chair) — same email/time/size
        $arrival = now()->startOfMonth()->addDays(3)->setTime(19, 0);
        for ($i = 0; $i < 4; $i++) {
            Reservation::create([
                'floor_plan_item_id' => $this->chairId,
                'customer_name' => 'Family',
                'customer_email' => 'family@test.com',
                'customer_phone' => '0601020304',
                'arrival_time' => $arrival,
                'party_size' => 4,
                'status' => 'confirmed',
            ]);
        }

        $response = $this->actingAs($this->user)->getJson('/api/analytics/summary');
        $response->assertOk();
        $this->assertEquals(1, $response->json('headline.total_this_month'),
            '4 chair-rows for the same party must count as 1 booking');
    }

    // ─── Tenant isolation on analytics ──────────────────────────────────

    public function test_analytics_hide_other_tenants_reservations(): void
    {
        // Reservation belonging to a different tenant
        $otherUser = User::factory()->create();
        $otherFloorPlan = RestaurantFloorPlan::where('user_id', $otherUser->id)->first();
        $otherChair = RestaurantFloorPlanItem::create([
            'floor_plan_id' => $otherFloorPlan->id,
            'type' => 'chair', 'x' => 1, 'y' => 1, 'rotation' => 0, 'floor_level' => 1,
        ]);
        Reservation::create([
            'floor_plan_item_id' => $otherChair->id,
            'customer_name' => 'Other', 'customer_email' => 'other@test.com',
            'customer_phone' => '0700000000',
            'arrival_time' => now()->startOfMonth()->addDays(5)->setTime(19, 0),
            'party_size' => 2, 'status' => 'confirmed',
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/analytics/summary');
        $response->assertOk();
        $this->assertEquals(0, $response->json('headline.total_this_month'));
    }

    // ─── Chart data ─────────────────────────────────────────────────────

    public function test_returns_seven_days_of_week_labels(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/analytics/summary');
        $response->assertOk();
        $this->assertCount(7, $response->json('by_day_of_week'));
        $labels = array_column($response->json('by_day_of_week'), 'label');
        $this->assertEquals(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], $labels);
    }

    public function test_returns_hour_bucket_labels(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/analytics/summary');
        $response->assertOk();
        $hours = $response->json('by_hour');
        // 11h .. 23h = 13 buckets
        $this->assertCount(13, $hours);
        $this->assertEquals('11h', $hours[0]['label']);
        $this->assertEquals('23h', $hours[12]['label']);
    }
}
