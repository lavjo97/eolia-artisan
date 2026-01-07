import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour créer une session Stripe Checkout
 * Avec 7 jours d'essai gratuit
 */

// Configuration des prix Stripe (à créer dans le Dashboard Stripe)
const STRIPE_PRICES = {
  standard: process.env.STRIPE_PRICE_STANDARD || 'price_standard_placeholder',
  premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_placeholder',
};

// Clé secrète Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

interface CheckoutRequest {
  plan: 'standard' | 'premium';
  email: string;
  entreprise: string;
  siret: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  departement: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { plan, email, entreprise, siret, adresse, codePostal, ville, departement } = body;

    // Validation
    if (!plan || !['standard', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      );
    }

    if (!email || !entreprise || !siret) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier la configuration Stripe
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured');
      
      // Mode développement: simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          url: `/register/success?session_id=dev_session_${Date.now()}`,
          sessionId: `dev_session_${Date.now()}`,
          mode: 'development',
        });
      }
      
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

    // Créer la session Stripe Checkout
    const priceId = STRIPE_PRICES[plan];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000';

    // Appeler l'API Stripe directement
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': email,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'subscription_data[trial_period_days]': '7', // 7 jours d'essai
        'subscription_data[metadata][entreprise]': entreprise,
        'subscription_data[metadata][siret]': siret,
        'subscription_data[metadata][departement]': departement,
        'subscription_data[metadata][plan]': plan,
        'metadata[entreprise]': entreprise,
        'metadata[siret]': siret,
        'metadata[adresse]': adresse || '',
        'metadata[codePostal]': codePostal || '',
        'metadata[ville]': ville || '',
        'metadata[departement]': departement,
        'success_url': `${baseUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${baseUrl}/register?cancelled=true`,
        'allow_promotion_codes': 'true',
        'billing_address_collection': 'required',
        'locale': 'fr',
      }).toString(),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error('Stripe error:', session);
      return NextResponse.json(
        { error: session.error?.message || 'Erreur Stripe' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}

// Vérifier le statut de la configuration
export async function GET() {
  const isConfigured = !!STRIPE_SECRET_KEY;
  
  return NextResponse.json({
    configured: isConfigured,
    mode: process.env.NODE_ENV,
    plans: {
      standard: {
        price: 25,
        priceId: STRIPE_PRICES.standard,
      },
      premium: {
        price: 45,
        priceId: STRIPE_PRICES.premium,
      },
    },
    trialDays: 7,
  });
}
