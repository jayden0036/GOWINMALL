# GOWINMALL — Configuration Supabase

## 1. Créer le projet Supabase

1. Aller sur https://supabase.com/dashboard
2. Cliquer "New Project"
3. Nom: `gowinmall`
4. Région: choisie selon vos utilisateurs (ex: Europe West pour Kinshasa)
5. Noter l'URL du projet et les clés API

## 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Secret ! Ne pas exposer côté client
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ou https://gowinmall.vercel.app en prod
```

## 3. Appliquer les migrations

### Option A : Via Supabase Dashboard (recommandé pour débuter)
1. Aller dans **SQL Editor**
2. Copier-coller le contenu de `supabase/migrations/0001_initial_schema.sql` → Run
3. Copier-coller le contenu de `supabase/migrations/0002_rpc_functions.sql` → Run
4. Aller dans **Storage** → Créer les buckets :
   - `offer-covers` (Public)
   - `identity-documents` (Private)
5. Aller dans **Storage > Policies** → Appliquer les politiques de `supabase/storage_policies.sql`

### Option B : Via Supabase CLI (développement local)
```bash
# Installer CLI
npm i -g supabase

# Login
supabase login

# Lier le projet
supabase link --project-ref <VOTRE_PROJECT_REF>

# Pousser les migrations
supabase db push

# Ou pour développement 100% local
supabase start
```

## 4. Configurer l'Auth

Dans **Authentication > Settings** :
- **Site URL** : `https://gowinmall.vercel.app` (prod) ou `http://localhost:3000` (dev)
- **Redirect URLs** : ajouter `https://gowinmall.vercel.app/auth/callback` et `http://localhost:3000/auth/callback`

### Google OAuth
1. Créer un projet Google Cloud Console
2. Activer "Google Identity" / OAuth 2.0
3. **Authorized redirect URIs** : `https://<PROJECT>.supabase.co/auth/v1/callback`
4. Dans Supabase > **Authentication > Providers > Google** :
   - Activer
   - Coller Client ID et Client Secret

## 5. Configurer les rôles admin

Dans **Authentication > Users** :
1. Trouver votre utilisateur
2. Cliquer les 3 points > "Edit user metadata"
3. Ajouter : `{"role": "owner"}`

Rôles disponibles :
- `owner` : Accès complet (finances, taux commissions, payouts)
- `admin` : Gestion utilisateurs, documents, commande, finances (lecture)
- `moderator` : Lecture seule (documents, utilisateurs)

## 6. Exécuter les seeds (données de test)

Dans **SQL Editor** :
```sql
-- Exécuter supabase/seed.sql (après avoir créé des users de test)
```

## 7. Vérifier le fonctionnement

```bash
# Lancer l'app
npm run dev

# Tester :
# - http://localhost:3000/register (inscription)
# - http://localhost:3000/login (connexion)
# - http://localhost:3000/catalogue (catalogue)
# - http://localhost:3000/vendre (créer offre - nécessite identité vérifiée)
# - http://localhost:3000/admin (admin - nécessite rôle owner/admin + 2FA)
```

## 8. Déployer sur Vercel

1. Connecter le repo GitHub à Vercel
2. Ajouter les variables d'environnement dans Vercel Project Settings
3. Déployer

### Variables Vercel (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://gowinmall.vercel.app
```

### Mettre à jour Supabase Auth pour la prod
- Site URL : `https://gowinmall.vercel.app`
- Redirect URLs : `https://gowinmall.vercel.app/auth/callback`
- Google OAuth : ajouter `https://gowinmall.vercel.app` dans les authorized domains

## 9. Maintenance

### Ajouter une migration
```bash
supabase migration new nom_de_la_migration
# Éditer le fichier créé dans supabase/migrations/
supabase db push
```

### Backup base de données
Dans Supabase Dashboard > **Database > Backups** ou :
```bash
supabase db dump --schema public -f backup.sql
```

### Surveiller
- **Logs** : Supabase Dashboard > Logs
- **Performance** : Database > Advisors
- **Stockage** : Storage > Usage

## Structure des fichiers Supabase

```
supabase/
├── config.toml           # Config CLI (local dev)
├── migrations/
│   ├── 0001_initial_schema.sql   # Tables, RLS, indexes
│   └── 0002_rpc_functions.sql    # Fonctions RPC (logique métier)
├── seed.sql              # Données de test
└── storage_policies.sql  # Politiques RLS pour Storage
```

## Notes importantes

- **RLS activé partout** : La sécurité se fait au niveau base de données
- **Service Role Key** : Jamais côté client, seulement pour scripts admin/backoffice
- **Buckets** : `offer-covers` = public (images catalogue), `identity-documents` = privé (pièces d'identité)
- **Commission** : Calculée côté serveur via RPC `commission_of()` pour éviter la manipulation
- **Audit log** : Toute action admin est tracée dans `audit_log`