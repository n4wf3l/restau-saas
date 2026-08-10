<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\SiteImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Non-negotiable safety net: tenant A must NEVER see or mutate tenant B's data.
 * A breach of these tests means real customer data could leak. Keep the coverage
 * broad — one test per endpoint category is worth more than exhaustive edge cases
 * on any single endpoint.
 */
class MultiTenancyIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;
    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();
        // UserObserver auto-provisions restaurant + settings + floor plan per user
        $this->userA = User::factory()->create();
        $this->userB = User::factory()->create();
        $this->activateTenant($this->userA);
        $this->activateTenant($this->userB);
    }

    // ─── Menu items ─────────────────────────────────────────────────────

    public function test_menu_items_index_hides_other_tenant_items(): void
    {
        MenuItem::create([
            'user_id' => $this->userB->id,
            'restaurant_id' => $this->userB->restaurant_id,
            'name' => 'B-only dish', 'price' => 10, 'is_available' => true,
        ]);

        $response = $this->actingAs($this->userA)->getJson('/api/menu-items');

        $response->assertOk();
        $this->assertCount(0, $response->json(), 'User A must not see any of user B menu items');
    }

    public function test_menu_items_update_rejects_other_tenant_item(): void
    {
        $bItem = MenuItem::create([
            'user_id' => $this->userB->id,
            'restaurant_id' => $this->userB->restaurant_id,
            'name' => 'B-item', 'price' => 12,
        ]);

        $response = $this->actingAs($this->userA)->putJson("/api/menu-items/{$bItem->id}", [
            'name' => 'Hacked', 'price' => 1,
        ]);

        $this->assertContains($response->status(), [403, 404],
            'Cross-tenant update must fail with 403 or 404');
        $this->assertEquals('B-item', $bItem->fresh()->name, 'DB record must remain untouched');
    }

    public function test_menu_items_destroy_rejects_other_tenant_item(): void
    {
        $bItem = MenuItem::create([
            'user_id' => $this->userB->id,
            'restaurant_id' => $this->userB->restaurant_id,
            'name' => 'B-item', 'price' => 12,
        ]);

        $response = $this->actingAs($this->userA)->deleteJson("/api/menu-items/{$bItem->id}");

        $this->assertContains($response->status(), [403, 404]);
        $this->assertNotNull(MenuItem::find($bItem->id), 'Item must still exist');
    }

    // ─── Site images ────────────────────────────────────────────────────

    public function test_site_images_index_hides_other_tenant_images(): void
    {
        SiteImage::create([
            'restaurant_id' => $this->userB->restaurant_id,
            'category' => 'hero',
            'image_url' => '/b-only.jpg',
            'alt' => 'B only',
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($this->userA)->getJson('/api/site-images');

        $response->assertOk();
        $this->assertCount(0, $response->json());
    }

    // ─── Settings ───────────────────────────────────────────────────────

    public function test_settings_show_returns_own_tenant_settings_only(): void
    {
        $this->userB->restaurant->settings->update(['restaurant_name' => 'Chez B']);
        $this->userA->restaurant->settings->update(['restaurant_name' => 'Chez A']);

        $response = $this->actingAs($this->userA)->getJson('/api/settings');

        $response->assertOk();
        $this->assertEquals('Chez A', $response->json('restaurant_name'));
    }

    public function test_settings_update_only_affects_own_tenant(): void
    {
        $bName = $this->userB->restaurant->settings->restaurant_name;

        $response = $this->actingAs($this->userA)->putJson('/api/settings', [
            'restaurant_name' => 'Renamed by A',
        ]);

        $response->assertOk();
        $this->assertEquals('Renamed by A', $this->userA->restaurant->settings->fresh()->restaurant_name);
        $this->assertEquals($bName, $this->userB->restaurant->settings->fresh()->restaurant_name,
            'User B settings must remain untouched');
    }

    // ─── Public API (tenant via query) ──────────────────────────────────

    public function test_public_settings_returns_correct_tenant_by_slug(): void
    {
        $this->userA->restaurant->update(['slug' => 'tenant-a']);
        $this->userB->restaurant->update(['slug' => 'tenant-b']);
        $this->userA->restaurant->settings->update(['restaurant_name' => 'Chez A']);
        $this->userB->restaurant->settings->update(['restaurant_name' => 'Chez B']);

        $a = $this->getJson('/api/public/settings?tenant=tenant-a');
        $b = $this->getJson('/api/public/settings?tenant=tenant-b');

        $a->assertOk()->assertJsonPath('restaurant_name', 'Chez A');
        $b->assertOk()->assertJsonPath('restaurant_name', 'Chez B');
    }

    public function test_public_endpoints_reject_unknown_tenant(): void
    {
        $response = $this->getJson('/api/public/settings?tenant=does-not-exist');
        $response->assertStatus(404)->assertJsonPath('error', 'Restaurant not found');
    }
}
