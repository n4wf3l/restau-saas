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

    public function test_list_tenants_returns_users_with_roles_in_local(): void
    {
        $this->app['env'] = 'local';
        $user = User::factory()->create();

        $response = $this->getJson('/api/dev/tenants')->assertOk();
        $data = $response->json();
        $this->assertNotEmpty($data);
        $row = collect($data)->firstWhere('slug', $user->restaurant->slug);
        $this->assertNotNull($row);
        $this->assertCount(1, $row['users']);
        $this->assertEquals($user->email, $row['users'][0]['email']);
        $this->assertEquals('user', $row['users'][0]['role']);
        $this->assertEquals($user->id, $row['default_user']['id']);
    }

    public function test_login_as_owner_prefers_non_admin_user(): void
    {
        $this->app['env'] = 'local';
        // Owner tenant (role=user)
        $owner = User::factory()->create();
        // Platform admin that also happens to share the same restaurant_id
        // (dev artifact — a real bug we hit on 2026-08-10 when tinkering).
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->update(['restaurant_id' => $owner->restaurant_id]);

        $response = $this->postJson('/api/dev/login-as-owner', [
            'tenant' => $owner->restaurant->slug,
        ])->assertOk();

        // The non-admin owner must be picked, not the admin.
        $this->assertEquals($owner->id, $response->json('id'));
        $this->assertAuthenticatedAs($owner);
    }

    public function test_login_as_owner_can_target_a_specific_user_id(): void
    {
        $this->app['env'] = 'local';
        $owner = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->update(['restaurant_id' => $owner->restaurant_id]);

        // Explicit override — dev wants to log in as the admin for whatever reason.
        $this->postJson('/api/dev/login-as-owner', [
            'tenant'  => $owner->restaurant->slug,
            'user_id' => $admin->id,
        ])->assertOk();

        $this->assertAuthenticatedAs($admin);
    }

    // ─── list admins + login-as-user (SaaS-level /login dev shortcut) ─────

    public function test_list_admins_returns_404_outside_local_env(): void
    {
        $this->app['env'] = 'production';
        $this->getJson('/api/dev/admins')->assertStatus(404);
    }

    public function test_list_admins_returns_only_admin_users_in_local(): void
    {
        $this->app['env'] = 'local';
        User::factory()->create();                       // role=user
        $a1 = User::factory()->create(['role' => 'admin']);
        $a2 = User::factory()->create(['role' => 'admin']);

        $response = $this->getJson('/api/dev/admins')->assertOk();
        $ids = collect($response->json())->pluck('id')->all();

        $this->assertContains($a1->id, $ids);
        $this->assertContains($a2->id, $ids);
        $this->assertCount(2, $ids);
    }

    public function test_login_as_user_returns_404_outside_local_env(): void
    {
        $this->app['env'] = 'staging';
        $user = User::factory()->create();
        $this->postJson('/api/dev/login-as-user', ['user_id' => $user->id])
            ->assertStatus(404);
        $this->assertGuest();
    }

    public function test_login_as_user_logs_in_any_user_by_id_in_local(): void
    {
        $this->app['env'] = 'local';
        $admin = User::factory()->create(['role' => 'admin']);

        $this->postJson('/api/dev/login-as-user', ['user_id' => $admin->id])
            ->assertOk()
            ->assertJsonPath('id', $admin->id);

        $this->assertAuthenticatedAs($admin);
    }

    public function test_login_as_user_rejects_unknown_id(): void
    {
        $this->app['env'] = 'local';
        $this->postJson('/api/dev/login-as-user', ['user_id' => 999999])
            ->assertStatus(404);
        $this->assertGuest();
    }
}
