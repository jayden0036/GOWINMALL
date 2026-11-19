-- GOWINMALL — Schema initial complet
-- Migration 0001

-- 1. Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profils utilisateurs (liés à auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    post_name TEXT,
    phone TEXT,
    city TEXT,
    country TEXT DEFAULT 'République démocratique du Congo',
    gender TEXT CHECK (gender IN ('homme', 'femme', 'autre')),
    account_type TEXT NOT NULL DEFAULT 'particulier'
        CHECK (account_type IN ('particulier', 'vendeur', 'entreprise', 'prestataire', 'affilie')),
    accepted_terms_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherches admin
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END $$;

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Offres (produits/services)
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_type TEXT NOT NULL CHECK (offer_type IN ('digital', 'physical', 'service')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_amount BIGINT NOT NULL CHECK (price_amount > 0), -- cents pour USD, francs pour CDF
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
    cover_path TEXT, -- chemin dans le bucket offer-covers
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'suspended', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_seller_id ON public.offers(seller_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_offer_type ON public.offers(offer_type);
CREATE INDEX idx_offers_created_at ON public.offers(created_at DESC);

CREATE TRIGGER trigger_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Informations de livraison pour les offres
CREATE TABLE public.offer_delivery (
    offer_id UUID PRIMARY KEY REFERENCES public.offers(id) ON DELETE CASCADE,
    delivery_info TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Commandes
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE RESTRICT,
    offer_title TEXT NOT NULL, -- dénormalisé pour affichage rapide
    offer_type TEXT NOT NULL CHECK (offer_type IN ('digital', 'physical', 'service')),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    unit_amount BIGINT NOT NULL CHECK (unit_amount > 0), -- montant payé par l'acheteur
    seller_amount BIGINT, -- montant que le vendeur reçoit (après commission)
    commission_amount BIGINT,
    commission_rate_bps INTEGER, -- taux de commission en points de base (ex: 500 = 5%)
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
    status TEXT NOT NULL DEFAULT 'pending_payment'
        CHECK (status IN ('pending_payment', 'payment_declared', 'paid', 'completed', 'cancelled', 'refunded')),
    payment_reference TEXT, -- référence déclarée par l'acheteur
    payout_status TEXT NOT NULL DEFAULT 'none'
        CHECK (payout_status IN ('none', 'due', 'paid')),
    payout_reference TEXT, -- référence de l'envoi au vendeur
    buyer_note TEXT, -- message de l'acheteur au vendeur
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payout_status ON public.orders(payout_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_offer_id ON public.orders(offer_id);

CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Documents d'identité
CREATE TABLE public.identity_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('carte_electeur', 'passeport', 'permis_conduire', 'carte_identite')),
    storage_path TEXT NOT NULL, -- chemin dans le bucket identity-documents
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id), -- admin qui a validé/refusé
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_documents_user_id ON public.identity_documents(user_id);
CREATE INDEX idx_identity_documents_status ON public.identity_documents(status);
CREATE INDEX idx_identity_documents_created_at ON public.identity_documents(created_at DESC);

-- 7. Coordonnées de reversement vendeurs
CREATE TABLE public.seller_payout_details (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    method TEXT NOT NULL CHECK (method IN ('mpesa', 'airtel', 'orange', 'afrimoney', 'bank', 'other')),
    account TEXT NOT NULL, -- numéro de téléphone ou IBAN
    holder_name TEXT NOT NULL, -- nom du titulaire du compte
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_seller_payout_details_updated_at
BEFORE UPDATE ON public.seller_payout_details
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Grille des frais (commissions par type d'offre)
CREATE TABLE public.fee_schedule (
    offer_type TEXT PRIMARY KEY CHECK (offer_type IN ('digital', 'physical', 'service')),
    rate_bps INTEGER NOT NULL CHECK (rate_bps >= 0 AND rate_bps <= 5000), -- max 50%
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valeurs par défaut
INSERT INTO public.fee_schedule (offer_type, rate_bps) VALUES
    ('digital', 1000),   -- 10%
    ('physical', 800),   -- 8%
    ('service', 1200)    -- 12%
ON CONFLICT (offer_type) DO NOTHING;

CREATE TRIGGER trigger_fee_schedule_updated_at
BEFORE UPDATE ON public.fee_schedule
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Moyens de paiement plateforme (pour les acheteurs)
CREATE TABLE public.platform_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL, -- ex: "M-Pesa", "Airtel Money"
    instructions TEXT NOT NULL, -- instructions affichées à l'acheteur
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Journal d'audit admin
CREATE TABLE public.audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target TEXT, -- ID de l'objet concerné (offer_id, user_id, etc.)
    metadata JSONB, -- infos supplémentaires
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- 11. Row Level Security (RLS)

-- Profils
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin', 'moderator')
        )
    );

-- Offres
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published offers are public" ON public.offers
    FOR SELECT USING (status = 'published');

CREATE POLICY "Sellers can manage own offers" ON public.offers
    FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all offers" ON public.offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin', 'moderator')
        )
    );

-- Offer delivery
ALTER TABLE public.offer_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can manage own delivery info" ON public.offer_delivery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.offers o
            WHERE o.id = offer_delivery.offer_id
            AND o.seller_id = auth.uid()
        )
    );

CREATE POLICY "Buyers can view delivery info for paid orders" ON public.offer_delivery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders ord
            JOIN public.offers o ON o.id = ord.offer_id
            WHERE o.id = offer_delivery.offer_id
            AND ord.buyer_id = auth.uid()
            AND ord.status IN ('paid', 'completed')
        )
    );

CREATE POLICY "Admins can view all delivery info" ON public.offer_delivery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin', 'moderator')
        )
    );

-- Commandes
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own orders (payment declaration, completion)" ON public.orders
    FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin')
        )
    );

-- Documents d'identité
ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.identity_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.identity_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" ON public.identity_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin', 'moderator')
        )
    );

CREATE POLICY "Admins can update documents (approve/reject)" ON public.identity_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin')
        )
    );

-- Coordonnées de reversement
ALTER TABLE public.seller_payout_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payout details" ON public.seller_payout_details
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Owner can view all payout details" ON public.seller_payout_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' = 'owner'
        )
    );

-- Grille des frais (lecture publique, écriture admin)
ALTER TABLE public.fee_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fee schedule" ON public.fee_schedule
    FOR SELECT USING (TRUE);

CREATE POLICY "Owner can update fee schedule" ON public.fee_schedule
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' = 'owner'
        )
    );

-- Moyens de paiement plateforme (lecture publique pour acheteurs, écriture admin)
ALTER TABLE public.platform_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods" ON public.platform_payment_methods
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage payment methods" ON public.platform_payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin')
        )
    );

-- Journal d'audit (lecture admin seulement)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON public.audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('owner', 'admin')
        )
    );

-- 12. Fonctions RPC (stockées dans une migration séparée pour clarté)
-- Voir 0002_rpc_functions.sql