<?php

namespace Tests\Feature;

use App\Mail\RestaurantActivated;
use App\Models\Restaurant;
use App\Models\RestaurantModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * End-to-end coverage for the "superadmin decides what a tenant can access"
 * flow shipped 2026-08-10:
 *   - New registrations start pending with every module off
 *   - Dashboard/API is blocked until status = active
 *   - Route middleware `feature:X` returns 403 when the module is off
 *   - Superadmin update endpoint accepts the extended payload
 *   - Superadmin transitioning pending -> active queues an activation email
 */
class SuperadminModuleGatingTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        // Platform admin — bypasses the tenant gates entirely
        $this->superadmin = User::factory()->create(['role' => 'admin']);
        $this->activateTenant($this->superadmin);
    }

    // ─── Defaults on registration ─────────────────────────────────────────

    public function test_new_registration_lands_pending_with_all_modules_off(): void
    {
        $user = User::factory()->create();

        $this->assertEquals('pending', $user->restaurant->status);

        $mods = RestaurantModule::where('restaurant_id', $user->restaurant_id)->first();
        $this->assertNotNull($mods);
        foreach (RestaurantModule::FEATURE_FLAGS as $flag) {
            $this->assertFalse((bool) $mods->{$flag}, "Flag {$flag} should default to false for a fresh tenant");
        }
    }

    // ─── EnsureRestaurantActive middleware ───────────────────────────────

    public function test_dashboard_api_is_blocked_while_restaurant_pending(): void
    {
        $user = User::factory()->create(); // status = pending

        $response = $this->actingAs($user)->getJson('/api/settings');

        $response->assertStatus(403)
            ->assertJsonPath('error', 'restaurant_not_active')
            ->assertJsonPath('status', 'pending');
    }

    public function test_dashboard_api_is_blocked_while_restaurant_suspended(): void
    {
        $user = User::factory()->create();
        $user->restaurant()->update(['status' => 'suspended']);

        $response = $this->actingAs($user)->getJson('/api/settings');

        $response->assertStatus(403)->assertJsonPath('status', 'suspended');
    }

    public function test_dashboard_api_accessible_once_active(): void
    {
        $user = User::factory()->create();
        $this->activateTenant($user);

        $this->actingAs($user)->getJson('/api/settings')->assertOk();
    }

    public function test_superadmin_bypasses_restaurant_active_gate(): void
    {
        // Superadmin's OWN restaurant can be anything — they still reach admin routes.
        $this->superadmin->restaurant()->update(['status' => 'pending']);
        $this->actingAs($this->superadmin)->getJson('/api/admin/restaurants')->assertOk();
    }

    // ─── EnsureModule middleware ─────────────────────────────────────────

    public function test_public_contact_is_403_when_contact_module_off(): void
    {
        $user = User::factory()->create();
        $this->activateTenant($user); // active + all modules on
        $user->restaurant->modules->update(['contact_enabled' => false]);

        $response = $this->postJson("/api/public/contact?tenant={$user->restaurant->slug}", [
            'name' => 'X', 'email' => 'x@x.com', 'subject' => 'S', 'message' => 'M',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('error', 'module_disabled')
            ->assertJsonPath('module', 'contact');
    }

    public function test_public_menu_items_is_403_when_menu_module_off(): void
    {
        $user = User::factory()->create();
        $this->activateTenant($user);
        $user->restaurant->modules->update(['menu_enabled' => false]);

        $this->getJson("/api/public/menu-items?tenant={$user->restaurant->slug}")
            ->assertStatus(403);
    }

    public function test_admin_menu_items_is_403_when_menu_module_off(): void
    {
        $user = User::factory()->create();
        $this->activateTenant($user);
        $user->restaurant->modules->update(['menu_enabled' => false]);

        $this->actingAs($user)->getJson('/api/menu-items')->assertStatus(403);
    }

    public function test_public_reservations_are_403_when_reservations_module_off(): void
    {
        $user = User::factory()->create();
        $this->activateTenant($user);
        $user->restaurant->modules->update(['reservations_enabled' => false]);

        $this->postJson("/api/public/reservations?tenant={$user->restaurant->slug}", [
            'customer_name'  => 'X',
            'customer_email' => 'x@x.com',
            'arrival_time'   => now()->addDays(2)->toDateTimeString(),
            'party_size'     => 2,
        ])->assertStatus(403);
    }

    // ─── Superadmin update endpoint ──────────────────────────────────────

    public function test_superadmin_can_update_extended_module_flags(): void
    {
        $user = User::factory()->create();
        $rid = $user->restaurant_id;

        $this->actingAs($this->superadmin)
            ->putJson("/api/admin/restaurants/{$rid}/modules", [
                'reservations_enabled' => true,
                'contact_enabled'      => true,
                'gallery_enabled'      => true,
                'events_enabled'       => false,
                'cancellation_enabled' => true,
                'theme'                => 'noir',
                'layout'               => 'cinematic',
            ])
            ->assertOk();

        $mods = RestaurantModule::where('restaurant_id', $rid)->first();
        $this->assertTrue((bool) $mods->reservations_enabled);
        $this->assertTrue((bool) $mods->contact_enabled);
        $this->assertTrue((bool) $mods->gallery_enabled);
        $this->assertFalse((bool) $mods->events_enabled);
        $this->assertTrue((bool) $mods->cancellation_enabled);
        $this->assertEquals('noir', $mods->theme);
        $this->assertEquals('cinematic', $mods->layout);
    }

    public function test_theme_layout_reject_invalid_values(): void
    {
        $user = User::factory()->create();
        $rid = $user->restaurant_id;

        $this->actingAs($this->superadmin)
            ->putJson("/api/admin/restaurants/{$rid}/modules", ['theme' => 'neon'])
            ->assertStatus(422)->assertJsonValidationErrors('theme');

        $this->actingAs($this->superadmin)
            ->putJson("/api/admin/restaurants/{$rid}/modules", ['layout' => 'threejs'])
            ->assertStatus(422)->assertJsonValidationErrors('layout');
    }

    public function test_theme_layout_accept_null_to_release_lock(): void
    {
        $user = User::factory()->create();
        $rid = $user->restaurant_id;

        // First set a value
        $this->actingAs($this->superadmin)
            ->putJson("/api/admin/restaurants/{$rid}/modules", ['theme' => 'noir'])
            ->assertOk();

        // Then release it
        $this->actingAs($this->superadmin)
            ->putJson("/api/admin/restaurants/{$rid}/modules", ['theme' => null])
            ->assertOk();

        $this->assertNull(RestaurantModule::where('restaurant_id', $rid)->first()->theme);
    }

    // ─── Activation email flow ───────────────────────────────────────────

    public function test_pending_to_active_transition_queues_activation_email(): void
    {
        $user = User::factory()->create();
        $rid = $user->restaurant_id;

        $this->actingAs($this->superadmin)
            ->putJson("/api/admin/restaurants/{$rid}", ['status' => 'active'])
            ->assertOk();

        Mail::assertQueued(RestaurantActivated::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function test_suspended_to_active_does_not_send_activation_email(): void
    {
        $user = User::factory()->create();
        $user->restaurant()->update(['status' => 'suspended']);
        $rid = $user->restaurant_id;

        $this->actingAs($this->superadmin)
            ->putJson("/api/admin/restaurants/{$rid}", ['status' => 'active'])
            ->assertOk();

        Mail::assertNotQueued(RestaurantActivated::class);
    }

    // ─── Public settings exposes modules + status ────────────────────────

    public function test_public_settings_exposes_module_flags_and_status(): void
    {
        $user = User::factory()->create();
        $this->activateTenant($user);
        $user->restaurant->modules->update([
            'menu_enabled'    => true,
            'contact_enabled' => false,
        ]);

        $response = $this->getJson("/api/public/settings?tenant={$user->restaurant->slug}");
        $response->assertOk()
            ->assertJsonPath('restaurant_status', 'active')
            ->assertJsonPath('modules.menu_enabled', true)
            ->assertJsonPath('modules.contact_enabled', false);
    }

    public function test_module_reservations_off_overrides_tenant_setting_on(): void
    {
        $user = User::factory()->create();
        $this->activateTenant($user);
        // Tenant thinks reservations are on, but superadmin turned the module off
        $user->restaurant->settings()->update(['reservations_enabled' => true]);
        $user->restaurant->modules->update(['reservations_enabled' => false]);

        $response = $this->getJson("/api/public/settings?tenant={$user->restaurant->slug}");
        $response->assertOk()->assertJsonPath('reservations_enabled', false);
    }
}
