/**
 * Client Supabase pour Eolia
 * Utilisé pour l'authentification et le stockage
 */

import { createClient } from '@supabase/supabase-js';

// Variables d'environnement Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client Supabase singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour la base de données
export interface Profile {
  id: string;
  email: string;
  company_name: string;
  siret: string;
  address: string;
  city: string;
  plan: 'standard' | 'premium';
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  type: 'devis' | 'facture';
  number: string;
  client_name: string;
  client_address?: string;
  total_ht: number;
  total_ttc: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid';
  sketch_url?: string; // URL du schéma/dessin associé
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentLine {
  id: string;
  document_id: string;
  designation: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tva_rate: number;
  total_ht: number;
  order_index: number;
}

/**
 * Upload une image vers Supabase Storage
 * @param bucket - Nom du bucket (ex: 'site-plans')
 * @param path - Chemin du fichier dans le bucket
 * @param file - Fichier ou Blob à uploader
 * @returns URL publique de l'image ou null en cas d'erreur
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Blob | File
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Erreur upload Supabase:', error);
      return null;
    }

    // Récupérer l'URL publique
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (err) {
    console.error('Erreur uploadToStorage:', err);
    return null;
  }
}

/**
 * Met à jour le sketch_url d'un document
 * @param documentId - ID du document
 * @param sketchUrl - URL du schéma
 */
export async function updateDocumentSketch(
  documentId: string,
  sketchUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('documents')
      .update({ sketch_url: sketchUrl, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (error) {
      console.error('Erreur mise à jour sketch:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erreur updateDocumentSketch:', err);
    return false;
  }
}

/**
 * Récupère un document par son ID
 * @param documentId - ID du document
 */
export async function getDocument(documentId: string): Promise<Document | null> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('Erreur récupération document:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Erreur getDocument:', err);
    return null;
  }
}
