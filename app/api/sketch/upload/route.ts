/**
 * API Route - Upload de schéma vers Supabase Storage
 * POST /api/sketch/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client Supabase avec clé service (côté serveur)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Vérifier la configuration Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Configuration Supabase manquante');
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le fichier du FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const quoteId = formData.get('quoteId') as string | null;
    const bucket = formData.get('bucket') as string || 'site-plans';

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    if (!quoteId) {
      return NextResponse.json(
        { error: 'ID du devis manquant' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${quoteId}/${timestamp}.${extension}`;

    console.log(`📤 Upload schéma: ${filename} (${file.size} bytes)`);

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Créer le bucket s'il n'existe pas
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);

    if (!bucketExists) {
      console.log(`📦 Création du bucket: ${bucket}`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/svg+xml', 'image/jpeg'],
      });

      if (createError) {
        console.error('Erreur création bucket:', createError);
        // Continuer quand même, le bucket existe peut-être déjà
      }
    }

    // Upload du fichier
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type || 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Erreur upload Supabase:', error);
      return NextResponse.json(
        { error: `Erreur upload: ${error.message}` },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`✅ Upload réussi: ${publicUrl.publicUrl}`);

    // Mettre à jour le document avec l'URL du schéma
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        sketch_url: publicUrl.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    if (updateError) {
      console.warn('Avertissement: document non mis à jour:', updateError.message);
      // Ne pas échouer car l'upload a réussi
    }

    return NextResponse.json({
      success: true,
      url: publicUrl.publicUrl,
      path: data.path,
      quoteId,
    });

  } catch (err) {
    console.error('Erreur API sketch/upload:', err);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Configuration App Router (bodyParser automatique avec FormData)
