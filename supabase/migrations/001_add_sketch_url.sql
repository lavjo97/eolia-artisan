-- Migration: Ajout du champ sketch_url pour les schémas de site
-- Exécuter cette migration dans votre dashboard Supabase > SQL Editor

-- Ajouter la colonne sketch_url à la table documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS sketch_url TEXT;

-- Créer le bucket de stockage pour les schémas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-plans',
  'site-plans',
  true,
  10485760, -- 10MB max
  ARRAY['image/png', 'image/svg+xml', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Politique de stockage: Lecture publique
CREATE POLICY "Public read access for site-plans" ON storage.objects
FOR SELECT USING (bucket_id = 'site-plans');

-- Politique de stockage: Upload pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload site-plans" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-plans');

-- Politique de stockage: Mise à jour pour propriétaire
CREATE POLICY "Users can update their own site-plans" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'site-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Politique de stockage: Suppression pour propriétaire
CREATE POLICY "Users can delete their own site-plans" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'site-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Index pour la recherche de documents avec schéma
CREATE INDEX IF NOT EXISTS idx_documents_sketch_url ON documents(sketch_url)
WHERE sketch_url IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN documents.sketch_url IS 'URL du schéma/plan de site dessiné par l''artisan';
