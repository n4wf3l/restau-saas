<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Coverage for the tenant-controlled show_moroccan_decorations toggle
 * (defaults to true; editable via /api/settings; exposed on publicShow).
 */
class MoroccanDecorationsToggleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $slug;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->activateTenant($this->user);
        $this->slug = $this->user->restaurant->slug;
    }

    public function test_defaults_to_true_on_fresh_tenant(): void
    {
        $response = $this->getJson("/api/public/settings?tenant={$this->slug}");
        $response->assertOk()->assertJsonPath('show_moroccan_decorations', true);
    }

    public function test_tenant_can_disable_decorations(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/settings', ['show_moroccan_decorations' => false])
            ->assertOk()
            ->assertJson(['show_moroccan_decorations' => false]);

        $this->getJson("/api/public/settings?tenant={$this->slug}")
            ->assertOk()
            ->assertJsonPath('show_moroccan_decorations', false);
    }

    public function test_rejects_non_boolean_value(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/settings', ['show_moroccan_decorations' => 'oui-svp'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('show_moroccan_decorations');
    }
}
