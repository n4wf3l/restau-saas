<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guardrails on the local-dev impersonation shortcut. The endpoint MUST
 * refuse (404) when the app isn't running in the local environment so
 * this can never be exploited on staging or production.
 */
class DevControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_as_owner_returns_404_outside_local_env(): void
    {
        $this->app['env'] = 'production';
        $user = User::factory()->create();

        $this->postJson('/api/dev/login-as-owner', ['tenant' => $user->restaurant->slug])
            ->assertStatus(404);

        $this->assertGuest();
    }

    public function test_list_tenants_returns_404_outside_local_env(): void
    {
        $this->app['env'] = 'staging';
        $this->getJson('/api/dev/tenants')->assertStatus(404);
    }

    public function test_login_as_owner_logs_in_the_owner_in_local(): void
    {
        $this->app['env'] = 'local';
        $user = User::factory()->create();

        $this->postJson('/api/dev/login-as-owner', ['tenant' => $user->restaurant->slug])
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', $user->email);

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_as_owner_rejects_unknown_slug(): void
    {
        $this->app['env'] = 'local';
        $this->postJson('/api/dev/login-as-owner', ['tenant' => 'no-such-restaurant'])
            ->assertStatus(404);
        $this->assertGuest();
    }

    public function test_list_tenants_returns_owner_email_in_local(): void
    {
        $this->app['env'] = 'local';
        $user = User::factory()->create();

        $response = $this->getJson('/api/dev/tenants')->assertOk();
        $data = $response->json();
        $this->assertNotEmpty($data);
        $this->assertEquals($user->restaurant->slug, $data[0]['slug']);
        $this->assertEquals($user->email, $data[0]['owner_email']);
    }
}
