<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Coverage for the SEO plumbing shipped 2026-08-10:
 *   - New settings fields (meta_description, address, phone, cuisine_type,
 *     price_range, og_image_url, meta_keywords, seo_checklist) are editable
 *     and returned by publicShow
 *   - Validation rejects invalid price_range and unknown checklist items
 *   - The tenant sitemap endpoint returns XML gated by module flags
 */
class SeoTest extends TestCase
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

    // ─── Settings fields ─────────────────────────────────────────────────

    public function test_tenant_can_save_seo_fields(): void
    {
        $payload = [
            'meta_description' => 'Restaurant halal à Tanger, viandes maturées, terrasse vue mer.',
            'meta_keywords'    => 'restaurant tanger, halal, grill',
            'og_image_url'     => 'https://example.com/og.jpg',
            'address'          => 'Ghandouri, Tanger, Maroc',
            'phone'            => '+212 5 39 12 34 56',
            'cuisine_type'     => 'Marocaine, Grill',
            'price_range'      => '€€',
        ];

        $response = $this->actingAs($this->user)->putJson('/api/settings', $payload);

        $response->assertOk();
        foreach ($payload as $k => $v) {
            $this->assertEquals($v, $response->json($k), "settings.{$k} did not round-trip");
        }
    }

    public function test_price_range_rejects_invalid_value(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/settings', ['price_range' => 'cheap'])
            ->assertStatus(422)->assertJsonValidationErrors('price_range');
    }

    public function test_seo_checklist_rejects_unknown_items(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/settings', ['seo_checklist' => ['gmb_created', 'made_up_item']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('seo_checklist.1');
    }

    public function test_seo_checklist_accepts_whitelisted_items(): void
    {
        $items = ['gmb_created', 'gmb_verified', 'tripadvisor_listed'];
        $this->actingAs($this->user)
            ->putJson('/api/settings', ['seo_checklist' => $items])
            ->assertOk()
            ->assertJson(['seo_checklist' => $items]);
    }

    // ─── Public settings endpoint ────────────────────────────────────────

    public function test_public_settings_exposes_seo_fields(): void
    {
        $this->actingAs($this->user)->putJson('/api/settings', [
            'meta_description' => 'Great local restaurant',
            'address'          => '10 rue Test',
            'phone'            => '+212 5 39 00 00 00',
            'cuisine_type'     => 'Marocaine',
            'price_range'      => '€€',
        ])->assertOk();

        $response = $this->getJson("/api/public/settings?tenant={$this->slug}");
        $response->assertOk()
            ->assertJsonPath('meta_description', 'Great local restaurant')
            ->assertJsonPath('address',          '10 rue Test')
            ->assertJsonPath('phone',            '+212 5 39 00 00 00')
            ->assertJsonPath('cuisine_type',     'Marocaine')
            ->assertJsonPath('price_range',      '€€');
    }

    // ─── Sitemap ─────────────────────────────────────────────────────────

    public function test_sitemap_returns_xml_with_active_module_urls(): void
    {
        // All modules on (activateTenant already flipped them)
        $response = $this->get("/api/public/sitemap?tenant={$this->slug}");

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=utf-8');
        $body = $response->getContent();
        $this->assertStringContainsString('<urlset', $body);
        $this->assertStringContainsString("/r/{$this->slug}/menu", $body);
        $this->assertStringContainsString("/r/{$this->slug}/gallery", $body);
        $this->assertStringContainsString("/r/{$this->slug}/reservation", $body);
        $this->assertStringContainsString("/r/{$this->slug}/contact", $body);
    }

    public function test_sitemap_hides_urls_for_disabled_modules(): void
    {
        // Turn off menu + contact + gallery
        $this->user->restaurant->modules->update([
            'menu_enabled'    => false,
            'contact_enabled' => false,
            'gallery_enabled' => false,
        ]);

        $body = $this->get("/api/public/sitemap?tenant={$this->slug}")->assertOk()->getContent();

        $this->assertStringNotContainsString("/r/{$this->slug}/menu", $body);
        $this->assertStringNotContainsString("/r/{$this->slug}/contact", $body);
        $this->assertStringNotContainsString("/r/{$this->slug}/gallery", $body);
        // Homepage + legal always present
        $this->assertMatchesRegularExpression("#<loc>[^<]+/r/{$this->slug}</loc>#", $body);
        $this->assertStringContainsString("/r/{$this->slug}/privacy", $body);
    }
}
