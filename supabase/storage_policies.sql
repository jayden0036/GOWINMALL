-- GOWINMALL — Politiques de stockage (Storage)
-- À exécuter dans Supabase Dashboard > Storage > Policies
-- Ou via SQL Editor après création des buckets

-- ============================================
-- Bucket: offer-covers (PUBLIC)
-- ============================================

-- Lecture publique pour tout le monde
CREATE POLICY "Public read offer covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-covers');

-- Insertion pour utilisateurs authentifiés (propriétaires de l'offre)
CREATE POLICY "Authenticated users can upload offer covers"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'offer-covers'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Mise à jour/suppression par le propriétaire
CREATE POLICY "Users can update own offer covers"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'offer-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own offer covers"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'offer-covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- Bucket: identity-documents (PRIVATE)
-- ============================================

-- Lecture : seulement le propriétaire du document et admins
CREATE POLICY "Users can read own identity documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'identity-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins peuvent tout lire
CREATE POLICY "Admins can read all identity documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'identity-documents'
    AND EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
        AND u.raw_user_meta_data->>'role' IN ('owner', 'admin', 'moderator')
    )
);

-- Insertion : seulement le propriétaire
CREATE POLICY "Users can upload own identity documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'identity-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Suppression : propriétaire ou admins
CREATE POLICY "Users can delete own identity documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'identity-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete identity documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'identity-documents'
    AND EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = auth.uid()
        AND u.raw_user_meta_data->>'role' IN ('owner', 'admin')
    )
);