/**
 * API Route - Configuration pour OpenAI Realtime API
 * Fournit la clé API de manière sécurisée pour les connexions WebSocket
 */

import { NextRequest, NextResponse } from 'next/server';

// Vérifier si la requête est légitime (origine, etc.)
function isValidRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // En développement, accepter localhost
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // En production, vérifier l'origine
  const allowedOrigins = [
    'https://eolia-artisan.vercel.app',
    'https://eolia-artisan-laville-jordan-s-projects.vercel.app',
  ];
  
  if (origin && allowedOrigins.some(o => origin.includes(o))) {
    return true;
  }
  
  if (referer && allowedOrigins.some(o => referer.includes(o))) {
    return true;
  }
  
  // Accepter si pas d'origin (appels directs depuis le serveur)
  return !origin;
}

export async function GET(request: NextRequest) {
  // Vérifier la validité de la requête
  if (!isValidRequest(request)) {
    return NextResponse.json(
      { error: 'Accès non autorisé' },
      { status: 403 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API OpenAI non configurée. Configurez OPENAI_API_KEY dans Vercel.' },
      { status: 401 }
    );
  }

  // Log pour debug (masqué en production)
  console.log('[Realtime API] Clé API disponible:', apiKey.substring(0, 10) + '...');

  // Retourner la clé pour la connexion WebSocket
  // Note: Ceci est nécessaire car le WebSocket doit être initié côté client
  return NextResponse.json({
    success: true,
    apiKey: apiKey,
    wsUrl: 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
    model: 'gpt-4o-realtime-preview-2024-12-17',
  });
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la validité de la requête
    if (!isValidRequest(request)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { action } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée. Configurez OPENAI_API_KEY dans Vercel.' },
        { status: 401 }
      );
    }

    if (action === 'get_config') {
      return NextResponse.json({
        success: true,
        apiKey: apiKey,
        wsUrl: 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        model: 'gpt-4o-realtime-preview-2024-12-17',
      });
    }

    if (action === 'verify') {
      // Vérifier que la clé est valide en faisant un appel test
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        
        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: 'Clé API valide',
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Clé API invalide',
          }, { status: 401 });
        }
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Impossible de vérifier la clé API',
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    console.error('Erreur API realtime:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
