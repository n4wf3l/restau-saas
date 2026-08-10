<?php

namespace Tests\Feature;

use App\Mail\ReservationCancelled;
use App\Models\Reservation;
use App\Models\RestaurantFloorPlan;
use App\Models\RestaurantFloorPlanItem;
use App\Models\RestaurantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Customer self-serve cancellation via /api/public/reservations/cancel.
 * Requires code + matching email, scoped to the tenant, rate-limited.
 */
class PublicReservationCancelTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;
    private string $slugA;
    private RestaurantFloorPlanItem $chairA;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        $this->userA = User::factory()->create();
        $this->activateTenant($this->userA);
        $this->slugA = $this->userA->restaurant->slug;

        $planA = RestaurantFloorPlan::where('user_id', $this->userA->id)->first();
        $this->chairA = RestaurantFloorPlanItem::create([
            'floor_plan_id' => $planA->id,
            'type' => 'chair',
            'x' => 1, 'y' => 1, 'rotation' => 0, 'floor_level' => 1,
        ]);

        // Ensure emails are opted-in so ReservationCancelled dispatches
        RestaurantSetting::where('user_id', $this->userA->id)->update([
            'send_confirmation_email' => true,
        ]);
    }

    private function makeReservation(array $overrides = []): Reservation
    {
        return Reservation::create(array_merge([
            'floor_plan_item_id' => $this->chairA->id,
            'customer_name'  => 'Alice',
            'customer_email' => 'alice@example.com',
            'arrival_time'   => now()->addDays(2)->setTime(19, 0)->toDateTimeString(),
            'party_size'     => 2,
            'status'         => 'confirmed',
            'cancellation_code' => 'ABCD2345',
        ], $overrides));
    }

    public function test_cancel_succeeds_with_valid_code_and_email(): void
    {
        $r = $this->makeReservation();

        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'ABCD2345',
            'email' => 'alice@example.com',
        ]);

        $response->assertOk()->assertJsonStructure(['message', 'arrival_time', 'party_size']);
        $this->assertEquals('cancelled', $r->fresh()->status);
    }

    public function test_cancel_is_case_insensitive_for_code_and_email(): void
    {
        $r = $this->makeReservation();

        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'abcd2345',
            'email' => 'ALICE@EXAMPLE.COM',
        ]);

        $response->assertOk();
        $this->assertEquals('cancelled', $r->fresh()->status);
    }

    public function test_cancel_rejects_missing_fields(): void
    {
        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", []);
        $response->assertStatus(422)->assertJsonValidationErrors(['code', 'email']);
    }

    public function test_cancel_rejects_wrong_code_length(): void
    {
        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'SHORT',
            'email' => 'alice@example.com',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_cancel_returns_404_for_unknown_code(): void
    {
        $this->makeReservation();

        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'ZZZZ9999',
            'email' => 'alice@example.com',
        ]);
        $response->assertStatus(404);
    }

    public function test_cancel_returns_404_when_email_does_not_match(): void
    {
        $r = $this->makeReservation();

        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'ABCD2345',
            'email' => 'someone.else@example.com',
        ]);
        $response->assertStatus(404);
        $this->assertEquals('confirmed', $r->fresh()->status);
    }

    public function test_cancel_returns_409_when_already_cancelled(): void
    {
        $this->makeReservation(['status' => 'cancelled']);

        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'ABCD2345',
            'email' => 'alice@example.com',
        ]);
        $response->assertStatus(409);
    }

    public function test_cancel_returns_422_when_arrival_is_past(): void
    {
        $this->makeReservation([
            'arrival_time' => now()->subHours(3)->toDateTimeString(),
        ]);

        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'ABCD2345',
            'email' => 'alice@example.com',
        ]);
        $response->assertStatus(422);
    }

    public function test_cancel_cancels_all_rows_in_a_group(): void
    {
        // Simulate a party-of-3 booking with 3 rows sharing the same code
        $arrival = now()->addDays(2)->setTime(19, 0)->toDateTimeString();
        $rows = collect();
        for ($i = 0; $i < 3; $i++) {
            $rows->push(Reservation::create([
                'floor_plan_item_id' => $this->chairA->id,
                'customer_name'  => 'Group',
                'customer_email' => 'group@example.com',
                'arrival_time'   => $arrival,
                'party_size'     => 3,
                'status'         => 'confirmed',
                'cancellation_code' => 'GROUP123',
            ]));
        }

        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'GROUP123',
            'email' => 'group@example.com',
        ]);
        $response->assertOk();

        foreach ($rows as $r) {
            $this->assertEquals('cancelled', $r->fresh()->status);
        }
    }

    public function test_cancel_isolates_tenants(): void
    {
        // Tenant B has a reservation with the same code — must NOT be cancellable via tenant A
        $userB = User::factory()->create();
        $this->activateTenant($userB);
        $slugB = $userB->restaurant->slug;
        $planB = RestaurantFloorPlan::where('user_id', $userB->id)->first();
        $chairB = RestaurantFloorPlanItem::create([
            'floor_plan_id' => $planB->id,
            'type' => 'chair',
            'x' => 1, 'y' => 1, 'rotation' => 0, 'floor_level' => 1,
        ]);

        $bReservation = Reservation::create([
            'floor_plan_item_id' => $chairB->id,
            'customer_name'  => 'BobB',
            'customer_email' => 'bob@example.com',
            'arrival_time'   => now()->addDays(2)->setTime(19, 0)->toDateTimeString(),
            'party_size'     => 2,
            'status'         => 'confirmed',
            'cancellation_code' => 'SHARED12',
        ]);

        // Attacker tries to cancel B's reservation while scoped to tenant A
        $response = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'SHARED12',
            'email' => 'bob@example.com',
        ]);
        $response->assertStatus(404);
        $this->assertEquals('confirmed', $bReservation->fresh()->status,
            'Tenant B reservation must not have been cancelled via tenant A');
    }

    public function test_cancel_queues_confirmation_email(): void
    {
        $this->makeReservation();

        $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", [
            'code'  => 'ABCD2345',
            'email' => 'alice@example.com',
        ])->assertOk();

        Mail::assertQueued(ReservationCancelled::class);
    }

    public function test_cancel_rate_limits_after_10_requests_per_minute(): void
    {
        $payload = ['code' => 'ABCD2345', 'email' => 'alice@example.com'];

        for ($i = 0; $i < 10; $i++) {
            $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", $payload);
        }
        $eleventh = $this->postJson("/api/public/reservations/cancel?tenant={$this->slugA}", $payload);
        $eleventh->assertStatus(429);
    }
}
