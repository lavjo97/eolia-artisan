import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, buildFormContext, parseAIResponse } from '@/lib/ai/chat-service';
import type { DevisFormData } from '@/components/DevisForm';

// Configuration pour le streaming
export const runtime = 'edge';

interface ChatRequest {
  message: string;
  formData: DevisFormData;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  apiKey?: string; // Clé API depuis les paramètres utilisateur
  model?: string;  // Modèle depuis les paramètres utilisateur
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, formData, conversationHistory = [], apiKey: userApiKey, model: userModel } = body;

    // Utiliser la clé API de l'utilisateur en priorité, sinon celle de l'environnement
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    const model = userModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key not configured',
          message: '⚠️ Clé API OpenAI non configurée. Ajoutez-la dans Paramètres → IA ou dans .env.local',
          fallback: true 
        },
        { status: 200 } // On retourne 200 pour permettre le fallback
      );
    }

    // Construire le contexte du formulaire
    const formContext = buildFormContext(formData);

    // Construire les messages pour l'API
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'system' as const, content: formContext },
      // Historique de conversation (limité aux 10 derniers échanges)
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Appel à l'API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3, // Plus déterministe pour les extractions
        max_tokens: 1000,
        response_format: { type: 'json_object' }, // Force JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      // Gérer les erreurs spécifiques
      if (response.status === 401) {
        return NextResponse.json({
          error: 'Invalid API key',
          message: '⚠️ Clé API OpenAI invalide. Vérifiez votre configuration.',
          fallback: true,
        });
      }
      
      if (response.status === 429) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          message: '⚠️ Limite de requêtes atteinte. Réessayez dans quelques secondes.',
          fallback: true,
        });
      }

      return NextResponse.json({
        error: 'API error',
        message: '⚠️ Erreur de communication avec l\'IA. Mode basique activé.',
        fallback: true,
      });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json({
        error: 'Empty response',
        message: '⚠️ L\'IA n\'a pas répondu. Réessayez.',
        fallback: true,
      });
    }

    // Parser la réponse
    const parsedResponse = parseAIResponse(aiContent);

    return NextResponse.json({
      success: true,
      ...parsedResponse,
      raw: aiContent, // Pour debug
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: '⚠️ Erreur serveur. Mode basique activé.',
      fallback: true,
    });
  }
}

// Endpoint GET pour vérifier le statut
export async function GET() {
  const hasEnvApiKey = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    aiEnabled: hasEnvApiKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    message: hasEnvApiKey 
      ? '✓ IA configurée via variable d\'environnement' 
      : 'Ajoutez votre clé API dans Paramètres → IA',
  });
}
