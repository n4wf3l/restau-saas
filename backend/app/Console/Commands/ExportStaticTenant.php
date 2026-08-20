<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ExportStaticTenant extends Command
{
    protected $signature = 'tenant:export-static {slug : Restaurant slug to export}';

    protected $description = 'Freeze a tenant\'s public data + media into frontend/public/static-tenant/<slug>/ for GH Pages vitrine builds.';

    private const ENDPOINTS = [
        'settings'     => '/api/public/settings',
        'menu-items'   => '/api/public/menu-items',
        'site-images'  => '/api/public/site-images',
        'tables'       => '/api/public/tables',
    ];

    public function handle(HttpKernel $kernel): int
    {
        $slug = $this->argument('slug');

        $restaurant = Restaurant::where('slug', $slug)->first();
        if (! $restaurant) {
            $this->error("No restaurant with slug '{$slug}'.");
            return self::FAILURE;
        }

        $outDir   = base_path("../frontend/public/static-tenant/{$slug}");
        $mediaDir = "{$outDir}/media";
        File::ensureDirectoryExists($mediaDir);

        $copiedFiles = [];

        foreach (self::ENDPOINTS as $name => $path) {
            $this->info("→ {$path}");

            $request  = Request::create("{$path}?tenant={$slug}", 'GET');
            $response = $kernel->handle($request);

            if ($response->getStatusCode() >= 400) {
                $this->warn("  skipped (HTTP {$response->getStatusCode()}) — module likely OFF");
                File::put("{$outDir}/{$name}.json", $name === 'settings' ? '{}' : '[]');
                continue;
            }

            $data = json_decode($response->getContent(), true);
            $data = $this->rewriteStorageUrls($data, $slug, $mediaDir, $copiedFiles);

            File::put(
                "{$outDir}/{$name}.json",
                json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            );
        }

        $this->info('');
        $this->info("Wrote " . count(self::ENDPOINTS) . " JSON file(s) + " . count($copiedFiles) . " media file(s) to:");
        $this->line("  {$outDir}");
        $this->info('');
        $this->comment("Next: commit frontend/public/static-tenant/{$slug}/ and push. GH Actions will build & deploy.");

        return self::SUCCESS;
    }

    /**
     * Recursively walk the payload and, for every string looking like a /storage/... URL,
     * copy the underlying file into media/ and rewrite the URL.
     */
    private function rewriteStorageUrls(mixed $node, string $slug, string $mediaDir, array &$copiedFiles): mixed
    {
        if (is_array($node)) {
            foreach ($node as $k => $v) {
                $node[$k] = $this->rewriteStorageUrls($v, $slug, $mediaDir, $copiedFiles);
            }
            return $node;
        }

        if (is_string($node) && str_starts_with($node, '/storage/')) {
            $relative = substr($node, strlen('/storage/'));
            $source   = storage_path("app/public/{$relative}");

            if (! is_file($source)) {
                $this->warn("  missing file: {$node}");
                return $node;
            }

            $dest = "{$mediaDir}/{$relative}";
            File::ensureDirectoryExists(dirname($dest));

            if (! isset($copiedFiles[$source])) {
                File::copy($source, $dest);
                $copiedFiles[$source] = true;
            }

            return "/static-tenant/{$slug}/media/{$relative}";
        }

        return $node;
    }
}
