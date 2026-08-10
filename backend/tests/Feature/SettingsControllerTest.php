<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->activateTenant($this->user);
    }

    // ─── Read ────────────────────────────────────────────────────────────

    public function test_authenticated_user_can_read_own_settings(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/settings');
        $response->assertOk()
            ->assertJsonStructure(['id', 'restaurant_id', 'theme', 'layout', 'restaurant_name']);
    }

    public function test_public_settings_returns_theme_and_layout(): void
    {
        $slug = $this->user->restaurant->slug;
        $response = $this->getJson("/api/public/settings?tenant={$slug}");
        $response->assertOk()
            ->assertJsonStructure(['theme', 'layout', 'restaurant_name', 'opening_hours']);
        $this->assertEquals('coffee', $response->json('theme'));
        $this->assertEquals('classic', $response->json('layout'));
    }

    // ─── Update: restaurant_name ─────────────────────────────────────────

    public function test_can_update_restaurant_name(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/settings', [
            'restaurant_name' => 'Bistrot de la Place',
        ]);
        $response->assertOk();
        $this->assertEquals('Bistrot de la Place',
            $this->user->restaurant->settings->fresh()->restaurant_name);
    }

    // ─── Update: theme ───────────────────────────────────────────────────

    public function test_can_update_theme_to_valid_value(): void
    {
        foreach (['coffee', 'noir', 'sable'] as $theme) {
            $response = $this->actingAs($this->user)->putJson('/api/settings', ['theme' => $theme]);
            $response->assertOk();
            $this->assertEquals($theme, $this->user->restaurant->settings->fresh()->theme);
        }
    }

    public function test_theme_rejects_invalid_value(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/settings', [
            'theme' => 'rainbow-unicorn',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors('theme');
    }

    // ─── Update: layout ──────────────────────────────────────────────────

    public function test_can_update_layout_to_valid_value(): void
    {
        foreach (['classic', 'cinematic'] as $layout) {
            $response = $this->actingAs($this->user)->putJson('/api/settings', ['layout' => $layout]);
            $response->assertOk();
            $this->assertEquals($layout, $this->user->restaurant->settings->fresh()->layout);
        }
    }

    public function test_layout_rejects_invalid_value(): void
    {
        $response = $this->actingAs($this->user)->putJson('/api/settings', [
            'layout' => 'ninja-mode',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors('layout');
    }

    // ─── Update: opening_hours ───────────────────────────────────────────

    public function test_can_update_opening_hours(): void
    {
        $hours = [
            'monday'    => ['open' => '11:00', 'close' => '22:00', 'closed' => false],
            'tuesday'   => ['open' => '11:00', 'close' => '22:00', 'closed' => false],
            'wednesday' => ['open' => '00:00', 'close' => '00:00', 'closed' => true],
            'thursday'  => ['open' => '11:00', 'close' => '22:00', 'closed' => false],
            'friday'    => ['open' => '11:00', 'close' => '23:00', 'closed' => false],
            'saturday'  => ['open' => '11:00', 'close' => '23:00', 'closed' => false],
            'sunday'    => ['open' => '00:00', 'close' => '00:00', 'closed' => true],
        ];
        $response = $this->actingAs($this->user)->putJson('/api/settings', [
            'opening_hours' => $hours,
        ]);
        $response->assertOk();
        $saved = $this->user->restaurant->settings->fresh()->opening_hours;
        $this->assertEquals($hours['monday']['open'], $saved['monday']['open']);
        $this->assertTrue($saved['wednesday']['closed']);
    }

    // ─── Cache invalidation ──────────────────────────────────────────────

    public function test_updating_settings_invalidates_public_cache(): void
    {
        $slug = $this->user->restaurant->slug;

        // Warm cache
        $this->getJson("/api/public/settings?tenant={$slug}")->assertOk();

        // Update via admin
        $this->actingAs($this->user)->putJson('/api/settings', ['theme' => 'noir'])->assertOk();

        // Public read reflects new value immediately (cache was busted)
        $response = $this->getJson("/api/public/settings?tenant={$slug}");
        $response->assertOk();
        $this->assertEquals('noir', $response->json('theme'));
    }

    // ─── Auth ────────────────────────────────────────────────────────────

    public function test_guest_cannot_read_settings(): void
    {
        $response = $this->getJson('/api/settings');
        $response->assertStatus(401);
    }

    public function test_guest_cannot_update_settings(): void
    {
        $response = $this->putJson('/api/settings', ['restaurant_name' => 'Hacked']);
        $response->assertStatus(401);
    }
}
