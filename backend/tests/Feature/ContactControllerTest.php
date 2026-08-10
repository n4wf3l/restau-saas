<?php

namespace Tests\Feature;

use App\Mail\ContactMessage;
use App\Mail\RecruitmentApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactControllerTest extends TestCase
{
    use RefreshDatabase;

    private string $slug;

    protected function setUp(): void
    {
        parent::setUp();
        // Public routes need a tenant to resolve; UserObserver auto-provisions one
        $user = User::factory()->create();
        $this->activateTenant($user);
        $this->slug = $user->restaurant->slug;
        Mail::fake();
    }

    // ─── Contact form ───────────────────────────────────────────────────

    public function test_contact_accepts_valid_payload(): void
    {
        $response = $this->postJson("/api/public/contact?tenant={$this->slug}", [
            'name'    => 'Jane Doe',
            'email'   => 'jane@example.com',
            'phone'   => '0601020304',
            'subject' => 'Réservation pour 8 personnes',
            'message' => 'Bonjour, est-il possible de réserver pour 8 personnes vendredi soir ?',
        ]);

        $response->assertOk()->assertJsonPath('message', 'Message envoyé avec succès.');
        Mail::assertQueued(ContactMessage::class);
    }

    public function test_contact_rejects_missing_required_fields(): void
    {
        $response = $this->postJson("/api/public/contact?tenant={$this->slug}", []);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);
        Mail::assertNothingQueued();
    }

    public function test_contact_rejects_invalid_email(): void
    {
        $response = $this->postJson("/api/public/contact?tenant={$this->slug}", [
            'name'    => 'X',
            'email'   => 'not-an-email',
            'subject' => 'Test',
            'message' => 'Test',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_contact_accepts_optional_phone(): void
    {
        $response = $this->postJson("/api/public/contact?tenant={$this->slug}", [
            'name'    => 'Jane Doe',
            'email'   => 'jane@example.com',
            'subject' => 'Question',
            'message' => 'Simple question sans numéro.',
        ]);
        $response->assertOk();
    }

    // ─── Recruitment form ───────────────────────────────────────────────

    public function test_recruit_accepts_valid_payload(): void
    {
        $response = $this->postJson("/api/public/recruit?tenant={$this->slug}", [
            'name'       => 'John Chef',
            'email'      => 'chef@example.com',
            'phone'      => '0601020304',
            'position'   => 'cuisinier',
            'experience' => '5 ans en brasserie',
            'message'    => 'Passionné par la cuisine méditerranéenne.',
        ]);
        $response->assertOk()->assertJsonPath('message', 'Candidature envoyée avec succès.');
        Mail::assertQueued(RecruitmentApplication::class);
    }

    public function test_recruit_rejects_missing_position(): void
    {
        $response = $this->postJson("/api/public/recruit?tenant={$this->slug}", [
            'name'       => 'John',
            'email'      => 'j@example.com',
            'experience' => '3 ans',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors('position');
    }

    // ─── Tenant resolution ─────────────────────────────────────────────

    public function test_contact_rejects_unknown_tenant(): void
    {
        $response = $this->postJson('/api/public/contact?tenant=does-not-exist', [
            'name'    => 'X', 'email' => 'x@x.com',
            'subject' => 'S',  'message' => 'M',
        ]);
        $response->assertStatus(404);
    }

    // ─── Rate limiting (throttle:3,1 = 3 per minute) ────────────────────

    public function test_contact_rate_limits_after_3_requests_per_minute(): void
    {
        $payload = [
            'name' => 'Spammer', 'email' => 's@s.com',
            'subject' => 'Spam', 'message' => 'Lorem ipsum.',
        ];
        for ($i = 0; $i < 3; $i++) {
            $this->postJson("/api/public/contact?tenant={$this->slug}", $payload)->assertOk();
        }
        $fourth = $this->postJson("/api/public/contact?tenant={$this->slug}", $payload);
        $fourth->assertStatus(429);
    }
}
