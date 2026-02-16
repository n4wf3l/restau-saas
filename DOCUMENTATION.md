# 🏗️ Guide Complet - Laravel 12 + React 18 + Sanctum Auth + Éditeur Floor Plan

## ✅ Installation et Configuration Complètes

Toutes les étapes d'implémentation ont été réalisées. Voici le récapitulatif et les commandes pour démarrer.

---

## 📦 Structure du Projet

```
restau-saas/
├── backend/          # Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── FloorPlanController.php
│   │   │   └── FloorPlanItemController.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── RestaurantFloorPlan.php
│   │   │   └── RestaurantFloorPlanItem.php
│   │   └── Observers/
│   │       └── UserObserver.php
│   ├── database/migrations/
│   │   ├── *_create_restaurant_floor_plans_table.php
│   │   └── *_create_restaurant_floor_plan_items_table.php
│   ├── routes/api.php
│   └── .env
│
└── frontend/         # React + Vite + TypeScript
    ├── src/
    │   ├── components/
    │   │   ├── ProtectedRoute.tsx
    │   │   └── floorplan/
    │   │       └── FloorPlanEditor.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   ├── lib/
    │   │   ├── api.ts
    │   │   ├── auth.ts
    │   │   └── types.ts
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   └── Dashboard.tsx
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

---

## 🚀 Commandes de Démarrage

### Backend (dans le terminal #1)
```powershell
cd C:\Users\ajari\Documents\GitHub\restau-saas\backend
php artisan serve
# Démarre sur http://127.0.0.1:8000
```

### Frontend (dans le terminal #2)
```powershell
cd C:\Users\ajari\Documents\GitHub\restau-saas\frontend
npm run dev
# Démarre sur http://localhost:5173
```

---

## ⚙️ Configuration .env (Backend)

Le fichier `.env` a été configuré avec :

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
SESSION_DOMAIN=localhost

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
```

---

## 🔐 Endpoints API Créés

### Auth (via Laravel Breeze)
- `POST /login` - Connexion
- `POST /register` - Inscription
- `POST /logout` - Déconnexion
- `GET /api/user` - Utilisateur connecté (auth:sanctum)

### Floor Plans
- `GET /api/floor-plans/current` - Récupérer le plan + items
- `PUT /api/floor-plans/current` - Modifier (name, width, height)

### Floor Plan Items
- `PUT /api/floor-plans/current/items` - Sauvegarder tous les items (bulk)
- `POST /api/floor-plans/current/items` - Ajouter un item
- `DELETE /api/floor-plans/current/items/{id}` - Supprimer un item

---

## ⚠️ LES 3 PIÈGES CLASSIQUES (et solutions)

### 1️⃣ CORS et credentials
**PROBLÈME :** Les cookies ne passent pas entre domaines.

**SOLUTION :**
- ✅ Backend : `config/cors.php` → `supports_credentials = true`
- ✅ Frontend : axios → `withCredentials: true`
- ✅ `.env` → `FRONTEND_URL=http://localhost:5173`

### 2️⃣ CSRF Cookie avant login/register
**PROBLÈME :** Laravel Sanctum exige un token CSRF pour les routes stateful.

**SOLUTION :**
- ✅ Toujours appeler `await csrf()` AVANT `login()` ou `register()`
- ✅ `csrf()` fait `GET /sanctum/csrf-cookie` qui set le cookie `XSRF-TOKEN`

```typescript
// ✅ BON
await csrf();
await api.post("/login", { email, password });

// ❌ MAUVAIS
await api.post("/login", { email, password }); // 419 CSRF token mismatch
```

### 3️⃣ 127.0.0.1 vs localhost
**PROBLÈME :** Les cookies ne fonctionnent PAS entre `127.0.0.1` et `localhost` (domaines différents).

**SOLUTIONS POSSIBLES :**

#### Option A (RECOMMANDÉE) : Tout en localhost
```env
# Backend .env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
```
```typescript
// Frontend api.ts
baseURL: "http://localhost:8000"
```
```powershell
# Démarrer Laravel sur localhost
php artisan serve --host=localhost --port=8000
```

#### Option B : Tout en 127.0.0.1
```env
# Backend .env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173
SESSION_DOMAIN=127.0.0.1
```
```typescript
// Frontend api.ts
baseURL: "http://127.0.0.1:8000"
```
```powershell
# Démarrer Vite sur 127.0.0.1
# Dans vite.config.ts, ajouter :
server: {
  host: '127.0.0.1'
}
```

**⚠️ NE JAMAIS MÉLANGER les deux !**

---

## ✅ CHECKLIST DE TEST

### Test 1 : Inscription
1. Ouvrir http://localhost:5173
2. Cliquer "S'inscrire"
3. Remplir : Nom, Email, Mot de passe (8+ caractères), Confirmer
4. Cliquer "S'inscrire"
5. ✅ **Succès** : Redirection vers `/dashboard` avec message "Compte créé avec succès !"

### Test 2 : Persistance de session
1. Après inscription, rafraîchir la page (F5)
2. ✅ **Succès** : Toujours connecté sur `/dashboard` (pas de redirect vers login)

### Test 3 : Éditeur de Floor Plan
1. Sur `/dashboard`, observer la grille 20x12
2. Cliquer sur "🪑 Table" puis cliquer dans une cellule
3. Cliquer sur "💺 Chaise" et placer une chaise
4. Cliquer sur "🧱 Mur" et tracer un mur
5. Tester le drag (maintenir clic + glisser)
6. Tester la rotation (0°, 90°, 180°, 270°)
7. Cliquer "💾 Sauvegarder"
8. ✅ **Succès** : Toast "Plan sauvegardé !"

### Test 4 : Persistance des items
1. Après sauvegarde, rafraîchir la page (F5)
2. ✅ **Succès** : Tous les items placés sont toujours là

### Test 5 : Gomme
1. Sélectionner "🗑️ Gomme"
2. Cliquer sur des items pour les supprimer
3. Sauvegarder
4. ✅ **Succès** : Items supprimés

### Test 6 : Déconnexion
1. Cliquer "Déconnexion" en haut à droite
2. ✅ **Succès** : Redirect vers `/login` avec toast "Déconnexion réussie"

### Test 7 : Reconnexion
1. Se reconnecter avec les mêmes identifiants
2. ✅ **Succès** : Retour sur `/dashboard` avec le plan intact

### Test 8 : Protection des routes
1. Se déconnecter
2. Taper manuellement http://localhost:5173/dashboard dans la barre
3. ✅ **Succès** : Redirect automatique vers `/login`

---

## 🎨 Fonctionnalités de l'Éditeur

### Outils disponibles
- 🪑 **Table** : Place une table
- 💺 **Chaise** : Place une chaise
- 🧱 **Mur** : Place un mur
- ⬜ **Vide** : Cellule vide
- 🗑️ **Gomme** : Supprime un item

### Contrôles
- **Click** : Place l'item sélectionné
- **Click + Drag** : Place/efface en continu
- **Rotation** : 0°, 90°, 180°, 270°
- **Sauvegarde** : Bulk save (tous les items en une fois)
- **Tout effacer** : Vide la grille

### Caractéristiques
- Grille 20x12 par défaut (configurable)
- Drag & drop pour placement rapide
- Rotation des items
- Sauvegarde bulk (performant)
- Toast notifications pour feedback
- Responsive (scroll si grille grande)

---

## 🔧 Commandes Backend Utiles

```powershell
# Créer un nouveau contrôleur
php artisan make:controller Api/MonController

# Créer un model + migration
php artisan make:model MonModel -m

# Exécuter les migrations
php artisan migrate

# Rollback dernière migration
php artisan migrate:rollback

# Vider le cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Liste des routes
php artisan route:list
```

---

## 🎯 Points d'Amélioration Futurs

### Backend
- Policies pour vérifier ownership (déjà protégé par auth:sanctum)
- Validation plus stricte (taille max de la grille, etc.)
- Pagination si beaucoup d'items
- Versionning du floor plan (historique)
- Export/Import JSON

### Frontend
- Undo/Redo
- Copier-coller d'items
- Sélection multiple
- Zoom in/out
- Grille personnalisable (taille)
- Thèmes de couleurs
- Mode dark
- Raccourcis clavier
- Prévisualisation 3D

---

## 🐛 Debugging

### Si erreur 419 CSRF token mismatch
1. Vérifier que `csrf()` est appelé AVANT login/register
2. Vérifier `SESSION_DOMAIN` dans `.env`
3. Vérifier que frontend et backend utilisent le MÊME domaine (localhost OU 127.0.0.1)
4. Clear les cookies du navigateur

### Si erreur 401 Unauthenticated
1. Vérifier que l'utilisateur est bien connecté
2. Vérifier `withCredentials: true` dans axios
3. Vérifier `supports_credentials: true` dans cors.php

### Si CORS error
1. Vérifier `FRONTEND_URL` dans `.env`
2. Vérifier `allowed_origins` dans `config/cors.php`
3. Redémarrer le serveur Laravel après modification .env

---

## 📝 Résumé des Technologies

- **Backend :** Laravel 12, Sanctum, SQLite
- **Frontend :** React 18, TypeScript, Vite, Tailwind CSS
- **Auth :** Session-based (cookies) via Sanctum
- **Router :** React Router DOM v6
- **Notifications :** React Hot Toast
- **HTTP Client :** Axios

---

## 🎉 Déploiement

### Backend (Production)
```bash
# .env production
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.votre-domaine.com
FRONTEND_URL=https://votre-domaine.com
SANCTUM_STATEFUL_DOMAINS=votre-domaine.com
SESSION_DOMAIN=.votre-domaine.com

# Optimisations
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend (Production)
```bash
# .env.production
VITE_API_URL=https://api.votre-domaine.com

# Build
npm run build

# Déployer le dossier dist/
```

---

✅ **Le projet est maintenant fonctionnel et prêt à être testé !**
