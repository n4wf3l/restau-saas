<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MenuItemControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_index_returns_user_menu_items(): void
    {
        MenuItem::create([
            'user_id' => $this->user->id,
            'name' => 'Tiramisu',
            'price' => 8.50,
            'category' => 'Desserts',
            'is_available' => true,
            'order' => 1,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/menu-items');

        $response->assertOk();
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('Tiramisu', $data[0]['name']);
    }

    public function test_index_does_not_return_other_users_items(): void
    {
        $otherUser = User::factory()->create();
        MenuItem::create([
            'user_id' => $otherUser->id,
            'name' => 'Pizza',
            'price' => 12.00,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/menu-items');

        $response->assertOk()->assertJson([]);
    }

    public function test_store_creates_menu_item(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/menu-items', [
            'name' => 'Pasta Carbonara',
            'price' => 14.50,
            'ingredients' => 'Pâtes, œufs, lardons, parmesan',
            'category' => 'Plats',
            'is_halal' => false,
            'is_available' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('menu_items', [
            'name' => 'Pasta Carbonara',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_store_with_image_upload(): void
    {
        Storage::fake('public');

        $response = $this->actingAs($this->user)->post('/api/menu-items', [
            'name' => 'Burger',
            'price' => 15.00,
            'image' => UploadedFile::fake()->image('burger.jpg', 600, 400),
        ]);

        $response->assertStatus(201);
        $item = MenuItem::first();
        $this->assertNotNull($item->image_url);
        $this->assertStringContains('menu-images/', $item->image_url);
    }

    public function test_store_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/menu-items', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'price']);
    }

    public function test_store_validates_price_non_negative(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/menu-items', [
            'name' => 'Salade',
            'price' => -5,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['price']);
    }

    public function test_update_modifies_menu_item(): void
    {
        $item = MenuItem::create([
            'user_id' => $this->user->id,
            'name' => 'Old Name',
            'price' => 10.00,
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/menu-items/{$item->id}", [
            'name' => 'New Name',
            'price' => 12.50,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('menu_items', [
            'id' => $item->id,
            'name' => 'New Name',
            'price' => 12.50,
        ]);
    }

    public function test_update_rejects_other_users_item(): void
    {
        $otherUser = User::factory()->create();
        $item = MenuItem::create([
            'user_id' => $otherUser->id,
            'name' => 'Not Mine',
            'price' => 10.00,
        ]);

        $response = $this->actingAs($this->user)->putJson("/api/menu-items/{$item->id}", [
            'name' => 'Hacked',
        ]);

        $response->assertStatus(403);
    }

    public function test_destroy_deletes_menu_item(): void
    {
        $item = MenuItem::create([
            'user_id' => $this->user->id,
            'name' => 'To Delete',
            'price' => 5.00,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/menu-items/{$item->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Menu item deleted');
        $this->assertDatabaseMissing('menu_items', ['id' => $item->id]);
    }

    public function test_destroy_rejects_other_users_item(): void
    {
        $otherUser = User::factory()->create();
        $item = MenuItem::create([
            'user_id' => $otherUser->id,
            'name' => 'Not Mine',
            'price' => 10.00,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/menu-items/{$item->id}");

        $response->assertStatus(403);
    }

    public function test_public_index_returns_available_items_only(): void
    {
        MenuItem::create([
            'user_id' => $this->user->id,
            'name' => 'Available',
            'price' => 10.00,
            'is_available' => true,
        ]);
        MenuItem::create([
            'user_id' => $this->user->id,
            'name' => 'Unavailable',
            'price' => 10.00,
            'is_available' => false,
        ]);

        $response = $this->getJson('/api/public/menu-items');

        $response->assertOk();
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('Available', $data[0]['name']);
    }

    /**
     * Custom assertion for string contains (PHPUnit 10+).
     */
    private function assertStringContains(string $needle, string $haystack): void
    {
        $this->assertTrue(
            str_contains($haystack, $needle),
            "Failed asserting that '{$haystack}' contains '{$needle}'."
        );
    }
}
