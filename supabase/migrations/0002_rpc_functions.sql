-- GOWINMALL — Fonctions RPC (PostgreSQL)
-- Migration 0002

-- 1. Fonction utilitaire : calculer la commission
CREATE OR REPLACE FUNCTION public.commission_of(p_amount BIGINT, p_rate_bps INTEGER)
RETURNS BIGINT LANGUAGE sql IMMUTABLE AS $$
    SELECT FLOOR((p_amount * p_rate_bps) / 10000.0)::BIGINT;
$$;

-- 2. Rôle admin de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.my_admin_role()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT u.raw_user_meta_data->>'role'
    INTO v_role
    FROM auth.users u
    WHERE u.id = auth.uid();
    RETURN v_role;
END $$;

-- 3. Journaliser une action admin
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action TEXT,
    p_target TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.audit_log (user_id, action, target, metadata)
    VALUES (auth.uid(), p_action, p_target, p_metadata);
END $$;

-- 4. Passer une commande (depuis l'offre)
CREATE OR REPLACE FUNCTION public.place_order(
    p_offer_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_offer RECORD;
    v_buyer UUID := auth.uid();
    v_commission BIGINT;
    v_seller_amount BIGINT;
    v_order_id UUID;
BEGIN
    -- Vérifier l'utilisateur
    IF v_buyer IS NULL THEN
        RAISE EXCEPTION 'Non connecté';
    END IF;

    -- Récupérer l'offre
    SELECT *
    INTO v_offer
    FROM public.offers
    WHERE id = p_offer_id
    AND status = 'published'
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Offre introuvable ou non publiée';
    END IF;

    IF v_offer.seller_id = v_buyer THEN
        RAISE EXCEPTION 'Vous ne pouvez pas acheter votre propre offre';
    END IF;

    -- Calculer commission et montant vendeur
    v_commission := public.commission_of(v_offer.price_amount, (
        SELECT rate_bps FROM public.fee_schedule WHERE offer_type = v_offer.offer_type
    ));
    v_seller_amount := v_offer.price_amount - v_commission;

    -- Créer la commande
    INSERT INTO public.orders (
        offer_id,
        offer_title,
        offer_type,
        buyer_id,
        seller_id,
        unit_amount,
        seller_amount,
        commission_amount,
        commission_rate_bps,
        currency,
        status,
        buyer_note
    ) VALUES (
        v_offer.id,
        v_offer.title,
        v_offer.offer_type,
        v_buyer,
        v_offer.seller_id,
        v_offer.price_amount,
        v_seller_amount,
        v_commission,
        (SELECT rate_bps FROM public.fee_schedule WHERE offer_type = v_offer.offer_type),
        v_offer.currency,
        'pending_payment',
        p_note
    ) RETURNING id INTO v_order_id;

    -- Log
    PERFORM public.log_admin_action('commande_creee', v_order_id, jsonb_build_object('offer_id', p_offer_id));

    RETURN v_order_id;
END $$;

-- 5. Déclarer un paiement (acheteur)
CREATE OR REPLACE FUNCTION public.declare_payment(
    p_order_id UUID,
    p_reference TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order RECORD;
    v_buyer UUID := auth.uid();
BEGIN
    IF v_buyer IS NULL THEN
        RAISE EXCEPTION 'Non connecté';
    END IF;

    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande introuvable';
    END IF;

    IF v_order.buyer_id != v_buyer THEN
        RAISE EXCEPTION 'Non autorisé';
    END IF;

    IF v_order.status != 'pending_payment' THEN
        RAISE EXCEPTION 'Commande non en attente de paiement';
    END IF;

    IF TRIM(p_reference) = '' THEN
        RAISE EXCEPTION 'Référence de paiement requise';
    END IF;

    UPDATE public.orders
    SET status = 'payment_declared',
        payment_reference = TRIM(p_reference),
        updated_at = NOW()
    WHERE id = p_order_id;

    PERFORM public.log_admin_action('paiement_declare', p_order_id, jsonb_build_object('reference', TRIM(p_reference)));
END $$;

-- 6. Annuler une commande (acheteur ou admin)
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order RECORD;
    v_user UUID := auth.uid();
    v_role TEXT;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Non connecté';
    END IF;

    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande introuvable';
    END IF;

    v_role := public.my_admin_role();

    IF v_order.buyer_id != v_user AND v_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Non autorisé';
    END IF;

    IF v_order.status IN ('completed', 'cancelled', 'refunded') THEN
        RAISE EXCEPTION 'Commande déjà terminée ou annulée';
    END IF;

    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id;

    PERFORM public.log_admin_action('commande_annulee', p_order_id, jsonb_build_object('by_role', COALESCE(v_role, 'buyer')));
END $$;

-- 7. Confirmer le paiement (admin)
CREATE OR REPLACE FUNCTION public.confirm_payment(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order RECORD;
    v_role TEXT;
BEGIN
    v_role := public.my_admin_role();
    IF v_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Réservé aux administrateurs';
    END IF;

    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande introuvable';
    END IF;

    IF v_order.status NOT IN ('pending_payment', 'payment_declared') THEN
        RAISE EXCEPTION 'Commande non éligible à la confirmation';
    END IF;

    -- Pour les produits physiques/services : le reversement est dû après confirmation de réception
    -- Pour les produits digitaux : le reversement est dû immédiatement
    UPDATE public.orders
    SET status = 'paid',
        payout_status = CASE
            WHEN v_order.offer_type = 'digital' THEN 'due'
            ELSE 'due'
        END,
        updated_at = NOW()
    WHERE id = p_order_id;

    PERFORM public.log_admin_action('paiement_confirme', p_order_id);
END $$;

-- 8. Confirmer la réception (acheteur) -> completed
CREATE OR REPLACE FUNCTION public.complete_order(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order RECORD;
    v_buyer UUID := auth.uid();
BEGIN
    IF v_buyer IS NULL THEN
        RAISE EXCEPTION 'Non connecté';
    END IF;

    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande introuvable';
    END IF;

    IF v_order.buyer_id != v_buyer THEN
        RAISE EXCEPTION 'Non autorisé';
    END IF;

    IF v_order.status != 'paid' THEN
        RAISE EXCEPTION 'Commande non payée';
    END IF;

    IF v_order.offer_type = 'digital' THEN
        RAISE EXCEPTION 'Les produits digitaux sont automatiquement complétés';
    END IF;

    UPDATE public.orders
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = p_order_id;

    PERFORM public.log_admin_action('commande_completee', p_order_id);
END $$;

-- 9. Marquer un reversement comme payé (owner)
CREATE OR REPLACE FUNCTION public.mark_payout_paid(
    p_order_id UUID,
    p_reference TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order RECORD;
    v_role TEXT;
BEGIN
    v_role := public.my_admin_role();
    IF v_role != 'owner' THEN
        RAISE EXCEPTION 'Réservé au propriétaire';
    END IF;

    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande introuvable';
    END IF;

    IF v_order.payout_status != 'due' THEN
        RAISE EXCEPTION 'Aucun reversement dû pour cette commande';
    END IF;

    UPDATE public.orders
    SET payout_status = 'paid',
        payout_reference = NULLIF(TRIM(p_reference), ''),
        updated_at = NOW()
    WHERE id = p_order_id;

    PERFORM public.log_admin_action('reversement_marque_paye', p_order_id, jsonb_build_object('reference', p_reference));
END $$;

-- 10. Modifier le taux de commission (owner)
CREATE OR REPLACE FUNCTION public.set_fee_rate(
    p_type TEXT,
    p_bps INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := public.my_admin_role();
    IF v_role != 'owner' THEN
        RAISE EXCEPTION 'Réservé au propriétaire';
    END IF;

    IF p_bps < 0 OR p_bps > 5000 THEN
        RAISE EXCEPTION 'Taux invalide (0-5000 bps)';
    END IF;

    IF p_type NOT IN ('digital', 'physical', 'service') THEN
        RAISE EXCEPTION 'Type d''offre invalide';
    END IF;

    UPDATE public.fee_schedule
    SET rate_bps = p_bps,
        updated_at = NOW()
    WHERE offer_type = p_type;

    IF NOT FOUND THEN
        INSERT INTO public.fee_schedule (offer_type, rate_bps)
        VALUES (p_type, p_bps);
    END IF;

    PERFORM public.log_admin_action('taux_commission_modifie', p_type, jsonb_build_object('new_bps', p_bps));
END $$;

-- 11. Enregistrer/mettre à jour les coordonnées de reversement
CREATE OR REPLACE FUNCTION public.save_payout_details(
    p_method TEXT,
    p_account TEXT,
    p_holder TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user UUID := auth.uid();
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Non connecté';
    END IF;

    IF p_method NOT IN ('mpesa', 'airtel', 'orange', 'afrimoney', 'bank', 'other') THEN
        RAISE EXCEPTION 'Méthode invalide';
    END IF;

    IF TRIM(p_account) = '' THEN
        RAISE EXCEPTION 'Numéro/compte requis';
    END IF;

    IF TRIM(p_holder) = '' THEN
        RAISE EXCEPTION 'Nom du titulaire requis';
    END IF;

    INSERT INTO public.seller_payout_details (user_id, method, account, holder_name)
    VALUES (v_user, p_method, TRIM(p_account), TRIM(p_holder))
    ON CONFLICT (user_id) DO UPDATE SET
        method = EXCLUDED.method,
        account = EXCLUDED.account,
        holder_name = EXCLUDED.holder_name,
        updated_at = NOW();
END $$;

-- 12. Vérifier si l'utilisateur a une identité vérifiée
CREATE OR REPLACE FUNCTION public.is_identity_verified(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.identity_documents
        WHERE user_id = p_user_id
        AND status = 'approved'
    );
$$;

-- 13. Vérifier si un vendeur a des coordonnées de reversement
CREATE OR REPLACE FUNCTION public.has_payout_details(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.seller_payout_details
        WHERE user_id = p_user_id
    );
$$;

-- 14. Obtenir le résumé finances (pour admin/owner)
CREATE OR REPLACE FUNCTION public.get_finances_summary()
RETURNS TABLE (
    currency TEXT,
    volume BIGINT,
    commission BIGINT,
    due BIGINT,
    paid BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := public.my_admin_role();
    IF v_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Réservé aux administrateurs';
    END IF;

    RETURN QUERY
    SELECT
        o.currency,
        COALESCE(SUM(o.unit_amount), 0)::BIGINT AS volume,
        COALESCE(SUM(o.commission_amount), 0)::BIGINT AS commission,
        COALESCE(SUM(CASE WHEN o.payout_status = 'due' THEN o.seller_amount ELSE 0 END), 0)::BIGINT AS due,
        COALESCE(SUM(CASE WHEN o.payout_status = 'paid' THEN o.seller_amount ELSE 0 END), 0)::BIGINT AS paid
    FROM public.orders o
    WHERE o.status IN ('paid', 'completed')
    GROUP BY o.currency;
END $$;