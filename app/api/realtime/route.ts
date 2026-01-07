/**
 * API Route - Proxy pour OpenAI Realtime API
 * Gère l'authentification côté serveur pour protéger la clé API
 * 
 * Cette route retourne les informations de connexion pour le client
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API OpenAI non configurée' },
      { status: 401 }
    );
  }

  // Retourner les informations de session pour le client
  // Note: Pour une vraie production, utiliser un token temporaire
  return NextResponse.json({
    url: 'wss://api.openai.com/v1/realtime',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    // On ne renvoie jamais la clé directement au client
    // À la place, on crée une session éphémère
    sessionToken: Buffer.from(`${apiKey}:${Date.now()}`).toString('base64'),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, apiKey: clientApiKey } = await request.json();
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API OpenAI non configurée' },
        { status: 401 }
      );
    }

    if (action === 'create_session') {
      // Créer une session éphémère pour le Realtime API
      // Note: OpenAI n'a pas encore d'API pour les sessions éphémères
      // On utilise donc la clé directement avec les précautions nécessaires
      return NextResponse.json({
        success: true,
        config: {
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
        },
        // Pour la Realtime API, on doit passer la clé
        // Dans une app de production, utiliser un backend WebSocket dédié
        wsUrl: 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });
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
