<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Reservation;
use App\Models\RestaurantFloorPlanItem;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RealisticDataSeeder extends Seeder
{
    public function run(): void
    {
        $userIds = \App\Models\User::pluck('id')->toArray();

        // ─── Clear existing data ───
        MenuItem::whereIn('user_id', $userIds)->delete();
        Reservation::withTrashed()->forceDelete();

        // ─── MENU ITEMS ───
        $order = 0;
        $menu = [
            // ── Entrées ──
            'Entrées' => [
                ['name' => 'Velouté de butternut', 'ingredients' => 'Butternut rôti, crème fraîche, noisettes torréfiées, huile de noisette, ciboulette', 'price' => 8.50, 'is_halal' => true],
                ['name' => 'Tartare de saumon', 'ingredients' => 'Saumon frais, avocat, mangue, citron vert, sésame noir, gingembre mariné', 'price' => 12.00, 'is_halal' => false],
                ['name' => 'Burrata crémeuse', 'ingredients' => 'Burrata di Puglia, tomates anciennes, pesto de basilic frais, roquette, pignons de pin', 'price' => 13.50, 'is_halal' => true],
                ['name' => 'Briouates au fromage', 'ingredients' => 'Feuille de brick, fromage de chèvre, miel, thym, noix concassées', 'price' => 9.00, 'is_halal' => true],
                ['name' => 'Soupe à l\'oignon gratinée', 'ingredients' => 'Oignons caramélisés, bouillon de bœuf, croûtons, gruyère fondu', 'price' => 9.50, 'is_halal' => false],
                ['name' => 'Salade César', 'ingredients' => 'Laitue romaine, parmesan, croûtons à l\'ail, sauce César maison, anchois', 'price' => 11.00, 'is_halal' => false],
            ],

            // ── Plats Principaux ──
            'Plats Principaux' => [
                ['name' => 'Filet de bœuf grillé', 'ingredients' => 'Filet de bœuf Black Angus 250g, sauce au poivre, gratin dauphinois, haricots verts', 'price' => 28.00, 'is_halal' => false],
                ['name' => 'Tajine d\'agneau', 'ingredients' => 'Épaule d\'agneau confite, pruneaux, amandes, miel, cannelle, semoule fine', 'price' => 22.00, 'is_halal' => true],
                ['name' => 'Saumon en croûte d\'herbes', 'ingredients' => 'Pavé de saumon, croûte de parmesan et herbes, purée de céleri, beurre blanc', 'price' => 24.00, 'is_halal' => false],
                ['name' => 'Poulet fermier rôti', 'ingredients' => 'Poulet fermier Label Rouge, jus de rôti, pommes de terre grenaille, légumes de saison', 'price' => 19.50, 'is_halal' => true],
                ['name' => 'Risotto aux champignons', 'ingredients' => 'Riz Arborio, cèpes, shiitaké, pleurotes, parmesan 24 mois, truffe noire', 'price' => 21.00, 'is_halal' => true],
                ['name' => 'Couscous Royal', 'ingredients' => 'Semoule fine, agneau, merguez, poulet, légumes du soleil, bouillon parfumé, harissa maison', 'price' => 23.00, 'is_halal' => true],
                ['name' => 'Burger gourmet', 'ingredients' => 'Steak haché 180g, cheddar affiné, bacon croustillant, oignons confits, sauce truffe, frites maison', 'price' => 18.50, 'is_halal' => false],
                ['name' => 'Pavé de thon mi-cuit', 'ingredients' => 'Thon rouge snacké, sésame, sauce teriyaki, riz vinaigré, wakamé, edamame', 'price' => 25.00, 'is_halal' => true],
            ],

            // ── Pâtes & Pizzas ──
            'Pâtes & Pizzas' => [
                ['name' => 'Tagliatelles à la truffe', 'ingredients' => 'Pâtes fraîches maison, crème de truffe noire, parmesan, roquette', 'price' => 19.00, 'is_halal' => true],
                ['name' => 'Penne all\'Arrabbiata', 'ingredients' => 'Penne rigate, sauce tomate pimentée, ail, basilic frais, pecorino', 'price' => 14.00, 'is_halal' => true],
                ['name' => 'Pizza Margherita', 'ingredients' => 'Pâte maison, sauce tomate San Marzano, mozzarella di bufala, basilic frais', 'price' => 13.00, 'is_halal' => true],
                ['name' => 'Pizza 4 Fromages', 'ingredients' => 'Mozzarella, gorgonzola, chèvre, parmesan, miel, noix', 'price' => 15.50, 'is_halal' => true],
                ['name' => 'Lasagnes maison', 'ingredients' => 'Pâtes fraîches, bolognaise au bœuf mijoté, béchamel, parmesan gratiné', 'price' => 16.00, 'is_halal' => false],
            ],

            // ── Desserts ──
            'Desserts' => [
                ['name' => 'Fondant au chocolat', 'ingredients' => 'Chocolat noir Valrhona 70%, beurre, œufs, cœur coulant, glace vanille', 'price' => 10.00, 'is_halal' => true],
                ['name' => 'Crème brûlée à la vanille', 'ingredients' => 'Crème, vanille de Madagascar, sucre caramélisé, tuile croustillante', 'price' => 9.00, 'is_halal' => true],
                ['name' => 'Tiramisu classique', 'ingredients' => 'Mascarpone, biscuits cuillère, café espresso, cacao amer', 'price' => 9.50, 'is_halal' => true],
                ['name' => 'Tarte Tatin', 'ingredients' => 'Pommes caramélisées, pâte feuilletée, crème fraîche épaisse', 'price' => 10.50, 'is_halal' => true],
                ['name' => 'Panna cotta aux fruits rouges', 'ingredients' => 'Crème vanillée, coulis de framboises, fraises, myrtilles, menthe', 'price' => 8.50, 'is_halal' => true],
                ['name' => 'Cheese-cake New York', 'ingredients' => 'Fromage frais Philadelphia, sablé breton, coulis de fruits de la passion', 'price' => 11.00, 'is_halal' => true],
            ],

            // ── Boissons ──
            'Boissons' => [
                ['name' => 'Eau minérale (75cl)', 'ingredients' => 'Evian ou San Pellegrino', 'price' => 4.50, 'is_halal' => true],
                ['name' => 'Limonade artisanale', 'ingredients' => 'Citron pressé, sucre de canne, eau pétillante, menthe fraîche', 'price' => 5.00, 'is_halal' => true],
                ['name' => 'Thé à la menthe', 'ingredients' => 'Thé vert gunpowder, menthe fraîche, sucre', 'price' => 4.00, 'is_halal' => true],
                ['name' => 'Jus d\'orange pressé', 'ingredients' => 'Oranges fraîches pressées à la commande', 'price' => 5.50, 'is_halal' => true],
                ['name' => 'Café gourmand', 'ingredients' => 'Espresso, mini fondant chocolat, crème brûlée, macaron du jour', 'price' => 8.00, 'is_halal' => true],
                ['name' => 'Smoothie tropical', 'ingredients' => 'Mangue, ananas, fruit de la passion, lait de coco', 'price' => 6.50, 'is_halal' => true],
            ],

            // ── Enfants ──
            'Menu Enfant' => [
                ['name' => 'Nuggets de poulet & frites', 'ingredients' => 'Nuggets de poulet pané, frites maison, ketchup', 'price' => 9.00, 'is_halal' => true],
                ['name' => 'Mini burger', 'ingredients' => 'Steak haché, fromage fondu, salade, frites maison', 'price' => 10.00, 'is_halal' => true],
                ['name' => 'Pâtes au beurre & parmesan', 'ingredients' => 'Penne, beurre frais, parmesan râpé', 'price' => 7.50, 'is_halal' => true],
            ],
        ];

        foreach ($userIds as $userId) {
            $order = 0;
            foreach ($menu as $category => $items) {
                foreach ($items as $item) {
                    MenuItem::create([
                        'user_id'      => $userId,
                        'name'         => $item['name'],
                        'ingredients'  => $item['ingredients'],
                        'price'        => $item['price'],
                        'is_halal'     => $item['is_halal'],
                        'image_url'    => null,
                        'category'     => $category,
                        'is_available' => true,
                        'order'        => $order++,
                    ]);
                }
            }
        }

        $totalItems = count($userIds) * array_sum(array_map('count', $menu));
        $this->command->info("✓ {$totalItems} menu items created across " . count($menu) . " categories for " . count($userIds) . " users.");

        // ─── RESERVATIONS ───
        // Get chair IDs grouped by table
        $chairs = RestaurantFloorPlanItem::where('type', 'chair')->get();
        $tableChairs = $chairs->groupBy('table_name')->filter(fn($group, $name) => $name !== '');

        $now = Carbon::now();
        $today = $now->copy()->startOfDay();

        $reservations = [
            // ── Today — confirmed (lunch)
            [
                'customer_name'  => 'Sophie Martin',
                'customer_email' => 'sophie.martin@gmail.com',
                'customer_phone' => '+32 470 12 34 56',
                'arrival_time'   => $today->copy()->setTime(12, 0),
                'party_size'     => 2,
                'status'         => 'confirmed',
                'notes'          => 'Anniversaire de mariage, si possible table calme',
                'table'          => 'Table Entrance',
            ],
            // ── Today — confirmed (lunch)
            [
                'customer_name'  => 'Mohammed El Amrani',
                'customer_email' => 'mohammed.ea@hotmail.com',
                'customer_phone' => '+32 485 67 89 01',
                'arrival_time'   => $today->copy()->setTime(12, 30),
                'party_size'     => 4,
                'status'         => 'confirmed',
                'notes'          => 'Menu halal uniquement',
                'table'          => 'Table Big',
            ],
            // ── Today — pending (dinner)
            [
                'customer_name'  => 'Claire Dubois',
                'customer_email' => 'claire.dubois@outlook.com',
                'customer_phone' => '+32 479 23 45 67',
                'arrival_time'   => $today->copy()->setTime(19, 0),
                'party_size'     => 2,
                'status'         => 'pending',
                'notes'          => '',
                'table'          => 'Table 5',
            ],
            // ── Today — pending (dinner)
            [
                'customer_name'  => 'Jean-Pierre Leroy',
                'customer_email' => 'jp.leroy@gmail.com',
                'customer_phone' => '+32 496 34 56 78',
                'arrival_time'   => $today->copy()->setTime(19, 30),
                'party_size'     => 4,
                'status'         => 'pending',
                'notes'          => 'Chaise haute pour bébé svp',
                'table'          => 'Table VIP 2',
            ],
            // ── Today — confirmed (dinner)
            [
                'customer_name'  => 'Fatima Benali',
                'customer_email' => 'fatima.b@gmail.com',
                'customer_phone' => '+32 488 45 67 89',
                'arrival_time'   => $today->copy()->setTime(20, 0),
                'party_size'     => 2,
                'status'         => 'confirmed',
                'notes'          => 'Allergie aux noix',
                'table'          => 'Table 6',
            ],
            // ── Today — completed (lunch earlier)
            [
                'customer_name'  => 'Pierre Vandenberghe',
                'customer_email' => 'pvdb@skynet.be',
                'customer_phone' => '+32 474 56 78 90',
                'arrival_time'   => $today->copy()->setTime(12, 0),
                'party_size'     => 2,
                'status'         => 'completed',
                'notes'          => '',
                'table'          => 'Terasse A',
            ],
            // ── Tomorrow — pending
            [
                'customer_name'  => 'Amina Chaoui',
                'customer_email' => 'amina.chaoui@gmail.com',
                'customer_phone' => '+32 491 67 89 01',
                'arrival_time'   => $today->copy()->addDay()->setTime(12, 30),
                'party_size'     => 2,
                'status'         => 'pending',
                'notes'          => 'Végétarienne',
                'table'          => 'Terrasse B',
            ],
            // ── Tomorrow — confirmed (big group)
            [
                'customer_name'  => 'Luc Janssens',
                'customer_email' => 'luc.janssens@proximus.be',
                'customer_phone' => '+32 478 78 90 12',
                'arrival_time'   => $today->copy()->addDay()->setTime(19, 0),
                'party_size'     => 4,
                'status'         => 'confirmed',
                'notes'          => 'Repas d\'affaires, discrétion appréciée',
                'table'          => 'Table VIP 2',
            ],
            // ── Tomorrow — pending (dinner)
            [
                'customer_name'  => 'Sarah De Smet',
                'customer_email' => 'sarah.desmet@gmail.com',
                'customer_phone' => '+32 486 89 01 23',
                'arrival_time'   => $today->copy()->addDay()->setTime(20, 0),
                'party_size'     => 2,
                'status'         => 'pending',
                'notes'          => '',
                'table'          => 'Table Entrance',
            ],
            // ── Day after tomorrow — pending
            [
                'customer_name'  => 'Youssef Benmoussa',
                'customer_email' => 'youssef.bm@gmail.com',
                'customer_phone' => '+32 492 90 12 34',
                'arrival_time'   => $today->copy()->addDays(2)->setTime(19, 30),
                'party_size'     => 4,
                'status'         => 'pending',
                'notes'          => 'Fête de famille, dessert avec bougie',
                'table'          => 'Table Big',
            ],
            // ── Yesterday — cancelled
            [
                'customer_name'  => 'Marc Peeters',
                'customer_email' => 'marc.p@telenet.be',
                'customer_phone' => '+32 475 01 23 45',
                'arrival_time'   => $today->copy()->subDay()->setTime(19, 0),
                'party_size'     => 2,
                'status'         => 'cancelled',
                'notes'          => 'Annulé pour raison personnelle',
                'table'          => 'Table 5',
            ],
            // ── Yesterday — no_show (soft deleted)
            [
                'customer_name'  => 'Thomas Hermans',
                'customer_email' => 'thomas.h@gmail.com',
                'customer_phone' => '+32 483 12 34 56',
                'arrival_time'   => $today->copy()->subDay()->setTime(20, 0),
                'party_size'     => 2,
                'status'         => 'no_show',
                'notes'          => '',
                'table'          => 'Table 6',
                'soft_delete'    => true,
            ],
        ];

        // ── Event reservation
        Reservation::create([
            'floor_plan_item_id' => $chairs->first()->id,
            'customer_name'      => 'Entreprise Delhaize',
            'customer_email'     => 'events@delhaize.be',
            'customer_phone'     => '+32 2 412 21 11',
            'arrival_time'       => $today->copy()->addDays(5)->setTime(19, 0),
            'party_size'         => 20,
            'status'             => 'pending',
            'notes'              => 'Soirée team building, budget 50€/personne',
            'is_event'           => true,
            'event_details'      => 'Privatisation de l\'étage 2 pour 20 personnes. Menu 3 services + boissons. Besoin d\'un vidéoprojecteur.',
        ]);

        Reservation::create([
            'floor_plan_item_id' => $chairs->first()->id,
            'customer_name'      => 'Famille Rousseau',
            'customer_email'     => 'rousseau.famille@gmail.com',
            'customer_phone'     => '+32 477 55 66 77',
            'arrival_time'       => $today->copy()->addDays(10)->setTime(12, 0),
            'party_size'         => 15,
            'status'             => 'confirmed',
            'notes'              => 'Baptême du petit Lucas',
            'is_event'           => true,
            'event_details'      => 'Repas de baptême pour 15 personnes. Menu enfant x3. Gâteau amené par le client. Décoration autorisée ?',
        ]);

        $resCount = 2; // events already created

        foreach ($reservations as $res) {
            $tableName = $res['table'];
            $chairIds = $tableChairs->get($tableName);

            if (!$chairIds || $chairIds->isEmpty()) {
                $this->command->warn("⚠ Table '{$tableName}' not found, skipping reservation for {$res['customer_name']}");
                continue;
            }

            $neededChairs = min($res['party_size'], $chairIds->count());

            for ($i = 0; $i < $neededChairs; $i++) {
                $reservation = Reservation::create([
                    'floor_plan_item_id' => $chairIds[$i]->id,
                    'customer_name'      => $res['customer_name'],
                    'customer_email'     => $res['customer_email'],
                    'customer_phone'     => $res['customer_phone'],
                    'arrival_time'       => $res['arrival_time'],
                    'party_size'         => $res['party_size'],
                    'status'             => $res['status'],
                    'notes'              => $res['notes'],
                    'is_event'           => false,
                ]);

                if (!empty($res['soft_delete'])) {
                    $reservation->delete(); // soft delete
                }
            }

            $resCount++;
        }

        $this->command->info('✓ ' . $resCount . ' reservation groups created (including 2 events).');
    }
}
