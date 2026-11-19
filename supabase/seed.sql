-- GOWINMALL — Données de seed (développement local)
-- Exécuté automatiquement avec `supabase db reset`

-- 1. Utilisateurs de test (créés via auth.users, ici on suppose qu'ils existent)
-- Pour créer des users de test, utiliser Supabase Dashboard ou `supabase auth` commands

-- 2. Profils de test (à adapter selon les users créés)
-- Les IDs doivent correspondre à des auth.users existants
-- INSERT INTO public.profiles (id, first_name, last_name, phone, city, country, account_type, accepted_terms_at)
-- VALUES
--   ('<USER_ID_1>', 'Jean', 'Dupont', '+243810000001', 'Kinshasa', 'République démocratique du Congo', 'vendeur', NOW()),
--   ('<USER_ID_2>', 'Marie', 'Kabongo', '+243810000002', 'Lubumbashi', 'République démocratique du Congo', 'particulier', NOW());

-- 3. Moyens de paiement plateforme (pour les acheteurs)
INSERT INTO public.platform_payment_methods (label, instructions, sort_order, is_active) VALUES
    ('M-Pesa', 'Envoyez l''argent au +243 81 000 0000 (GOWINMALL). Indiquez le code de commande comme motif.', 1, TRUE),
    ('Airtel Money', 'Envoyez l''argent au +243 97 000 0000 (GOWINMALL). Indiquez le code de commande comme motif.', 2, TRUE),
    ('Orange Money', 'Envoyez l''argent au +243 89 000 0000 (GOWINMALL). Indiquez le code de commande comme motif.', 3, TRUE),
    ('Virement bancaire', 'Contactez l''équipe pour les coordonnées bancaires.', 4, FALSE)
ON CONFLICT DO NOTHING;

-- 4. Taux de commission par défaut
INSERT INTO public.fee_schedule (offer_type, rate_bps) VALUES
    ('digital', 1000),   -- 10%
    ('physical', 800),   -- 8%
    ('service', 1200)    -- 12%
ON CONFLICT (offer_type) DO UPDATE SET
    rate_bps = EXCLUDED.rate_bps,
    updated_at = NOW();

-- 5. Exemples d'offres (à décommenter et adapter les seller_id)
-- INSERT INTO public.offers (seller_id, offer_type, title, description, price_amount, currency, status) VALUES
--   ('<SELLER_USER_ID>', 'digital', 'Guide complet SEO 2024', 'Ebook PDF de 150 pages...', 1500, 'USD', 'published'),
--   ('<SELLER_USER_ID>', 'physical', 'Smartphone reconditionné', 'Excellent état, garantie 6 mois', 25000000, 'CDF', 'published'),
--   ('<SELLER_USER_ID>', 'service', 'Création site web vitrine', 'Design moderne, responsive, 5 pages', 50000, 'USD', 'published');

-- 6. Infos de livraison pour les offres d'exemple
-- INSERT INTO public.offer_delivery (offer_id, delivery_info) VALUES
--   ('<OFFER_ID_1>', 'Lien de téléchargement envoyé par email après paiement'),
--   ('<OFFER_ID_2>', 'Remise en main propre à Kinshasa (Gombe) ou livraison Express 24h'),
--   ('<OFFER_ID_3>', 'Réalisation sous 7 jours après validation du cahier des charges');