'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

// Types
interface Plan {
  id: 'standard' | 'premium';
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

interface FormData {
  // Plan
  plan: 'standard' | 'premium';
  
  // Profil
  entreprise: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  departement: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _SiretData {
  denomination: string;
  adresse: string;
  codePostal: string;
  ville: string;
}

// Plans disponibles
const PLANS: Plan[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 25,
    description: 'Idéal pour débuter',
    features: [
      '🎤 Assistant vocal IA',
      '📄 Devis & Factures illimités',
      '📱 Envoi WhatsApp',
      '☁️ Stockage cloud',
      '📊 Tableau de bord',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 45,
    description: 'Le pack complet',
    popular: true,
    features: [
      '✅ Tout du Standard +',
      '💳 Paiement client en ligne',
      '🏛️ Déclaration URSSAF auto',
      '📨 Notifications SMS',
      '📦 Gestion des stocks',
      '📈 Statistiques avancées',
      '🎯 Support prioritaire',
    ],
  },
];

// Départements DOM
const DEPARTEMENTS = [
  { value: '971', label: 'Guadeloupe (971)' },
  { value: '972', label: 'Martinique (972)' },
  { value: '973', label: 'Guyane (973)' },
  { value: '974', label: 'La Réunion (974)' },
  { value: '976', label: 'Mayotte (976)' },
  { value: '978', label: 'Saint-Martin (978)' },
  { value: '977', label: 'Saint-Barthélemy (977)' },
];

// Icônes
const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ArrowRightIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

const ArrowLeftIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
  </svg>
);

const SparklesIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const LoadingSpinner = ({ className = '' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [siretLoading, setSiretLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    plan: 'standard',
    entreprise: '',
    siret: '',
    adresse: '',
    codePostal: '',
    ville: '',
    departement: '972',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  // Gérer les changements de champs
  const handleChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  // Rechercher les infos SIRET via l'API Insee
  const lookupSiret = useCallback(async () => {
    const siret = formData.siret.replace(/\s/g, '');
    if (siret.length !== 14) {
      setError('Le SIRET doit contenir 14 chiffres');
      return;
    }

    setSiretLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/siret/${siret}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'SIRET non trouvé');
      }

      setFormData(prev => ({
        ...prev,
        entreprise: data.denomination || prev.entreprise,
        adresse: data.adresse || prev.adresse,
        codePostal: data.codePostal || prev.codePostal,
        ville: data.ville || prev.ville,
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche SIRET');
    } finally {
      setSiretLoading(false);
    }
  }, [formData.siret]);

  // Auto-lookup quand le SIRET est complet
  useEffect(() => {
    const siret = formData.siret.replace(/\s/g, '');
    if (siret.length === 14) {
      lookupSiret();
    }
  }, [formData.siret, lookupSiret]);

  // Valider l'étape actuelle
  const validateStep = useCallback(() => {
    if (step === 2) {
      if (!formData.entreprise) return 'Veuillez entrer le nom de votre entreprise';
      if (!formData.siret || formData.siret.replace(/\s/g, '').length !== 14) return 'SIRET invalide (14 chiffres requis)';
      if (!formData.email) return 'Veuillez entrer votre email';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email invalide';
      if (!formData.password) return 'Veuillez créer un mot de passe';
      if (formData.password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
      if (formData.password !== formData.confirmPassword) return 'Les mots de passe ne correspondent pas';
      if (!formData.acceptTerms) return 'Veuillez accepter les conditions d\'utilisation';
    }
    return null;
  }, [step, formData]);

  // Passer à l'étape suivante
  const nextStep = useCallback(() => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(s => Math.min(s + 1, 3));
  }, [validateStep]);

  // Revenir à l'étape précédente
  const prevStep = useCallback(() => {
    setError(null);
    setStep(s => Math.max(s - 1, 1));
  }, []);

  // Soumettre l'inscription et rediriger vers Stripe
  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Créer la session Stripe
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: formData.plan,
          email: formData.email,
          entreprise: formData.entreprise,
          siret: formData.siret,
          adresse: formData.adresse,
          codePostal: formData.codePostal,
          ville: formData.ville,
          departement: formData.departement,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }

      // Rediriger vers Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  }, [formData]);

  const selectedPlan = PLANS.find(p => p.id === formData.plan)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)`,
        }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Eolia Artisan</h1>
                <p className="text-xs text-emerald-400">Copilote devis</p>
              </div>
            </Link>

            <Link 
              href="/login" 
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Déjà inscrit ? <span className="text-emerald-400 font-medium">Se connecter</span>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Title */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Bienvenue chez Eolia Artisan
              </h2>
              <p className="text-slate-400 text-lg">
                Créez vos devis par la voix en quelques secondes
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                7 jours d&apos;essai gratuit • Sans engagement
              </div>
            </div>

            {/* Progress steps */}
            <div className="flex items-center justify-center gap-4 mb-10">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => s < step && setStep(s)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                      ${step === s 
                        ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40' 
                        : step > s 
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }
                    `}
                  >
                    {step > s ? <CheckIcon className="w-5 h-5" /> : s}
                  </button>
                  {s < 3 && (
                    <div className={`w-16 h-1 rounded-full transition-colors ${
                      step > s ? 'bg-emerald-500' : 'bg-slate-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step labels */}
            <div className="flex justify-center gap-8 md:gap-16 mb-8 text-sm">
              <span className={step === 1 ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                Choisir un plan
              </span>
              <span className={step === 2 ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                Votre profil
              </span>
              <span className={step === 3 ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                Paiement
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className="max-w-xl mx-auto mb-6 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Step 1: Choose Plan */}
            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleChange('plan', plan.id)}
                    className={`
                      relative p-6 rounded-2xl text-left transition-all duration-300
                      ${formData.plan === plan.id 
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500 scale-[1.02] shadow-xl shadow-emerald-500/20' 
                        : 'bg-slate-800/50 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                      }
                    `}
                  >
                    {/* Popular badge */}
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-xs font-semibold text-white shadow-lg">
                        ⭐ Le plus populaire
                      </div>
                    )}

                    {/* Selection indicator */}
                    <div className={`
                      absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${formData.plan === plan.id 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-slate-600'
                      }
                    `}>
                      {formData.plan === plan.id && <CheckIcon className="w-4 h-4 text-white" />}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{plan.description}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold text-white">{plan.price}€</span>
                      <span className="text-slate-400">/mois</span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Profile Form */}
            {step === 2 && (
              <div className="max-w-xl mx-auto bg-slate-800/50 rounded-2xl border border-slate-700 p-6 md:p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    🏢
                  </span>
                  Informations de votre entreprise
                </h3>

                <div className="space-y-5">
                  {/* SIRET avec auto-complétion */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Numéro SIRET *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.siret}
                        onChange={(e) => handleChange('siret', e.target.value.replace(/[^0-9\s]/g, ''))}
                        placeholder="123 456 789 00012"
                        maxLength={17}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                      />
                      {siretLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <LoadingSpinner className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                      {formData.entreprise && !siretLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Entrez votre SIRET, les informations seront remplies automatiquement
                    </p>
                  </div>

                  {/* Nom entreprise */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nom de l&apos;entreprise *
                    </label>
                    <input
                      type="text"
                      value={formData.entreprise}
                      onChange={(e) => handleChange('entreprise', e.target.value)}
                      placeholder="SARL Dupont Rénovation"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Adresse */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => handleChange('adresse', e.target.value)}
                      placeholder="123 Rue du Commerce"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Code postal + Ville */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={formData.codePostal}
                        onChange={(e) => handleChange('codePostal', e.target.value)}
                        placeholder="97200"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={formData.ville}
                        onChange={(e) => handleChange('ville', e.target.value)}
                        placeholder="Fort-de-France"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Département */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Département *
                    </label>
                    <select
                      value={formData.departement}
                      onChange={(e) => handleChange('departement', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none cursor-pointer"
                    >
                      {DEPARTEMENTS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <hr className="border-slate-700 my-6" />

                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      👤
                    </span>
                    Vos identifiants
                  </h3>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contact@monentreprise.fr"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Minimum 8 caractères
                    </p>
                  </div>

                  {/* Confirmer mot de passe */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirmer le mot de passe *
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* CGU */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm text-slate-400">
                      J&apos;accepte les{' '}
                      <a href="#" className="text-emerald-400 hover:underline">conditions générales d&apos;utilisation</a>
                      {' '}et la{' '}
                      <a href="#" className="text-emerald-400 hover:underline">politique de confidentialité</a>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="max-w-xl mx-auto">
                {/* Récapitulatif */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 md:p-8 mb-6">
                  <h3 className="text-xl font-bold text-white mb-6">Récapitulatif</h3>

                  <div className="space-y-4">
                    {/* Plan choisi */}
                    <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-xl">
                      <div>
                        <p className="font-medium text-white">Plan {selectedPlan.name}</p>
                        <p className="text-sm text-slate-400">{selectedPlan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{selectedPlan.price}€</p>
                        <p className="text-sm text-slate-400">/mois</p>
                      </div>
                    </div>

                    {/* Entreprise */}
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-slate-400">Entreprise</span>
                      <span className="text-white font-medium">{formData.entreprise}</span>
                    </div>

                    {/* Email */}
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-slate-400">Email</span>
                      <span className="text-white">{formData.email}</span>
                    </div>

                    {/* Essai gratuit */}
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          🎁
                        </div>
                        <div>
                          <p className="font-medium text-emerald-400">7 jours d&apos;essai gratuit</p>
                          <p className="text-sm text-slate-400">
                            Vous ne serez débité qu&apos;après la période d&apos;essai
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-600">
                      <span className="text-lg font-medium text-white">Aujourd&apos;hui</span>
                      <span className="text-2xl font-bold text-emerald-400">0,00 €</span>
                    </div>
                    <p className="text-sm text-slate-500 text-center">
                      Puis {selectedPlan.price}€/mois après les 7 jours d&apos;essai
                    </p>
                  </div>
                </div>

                {/* Paiement sécurisé */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Paiement sécurisé par Stripe
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-center gap-4 mt-10">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Retour
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                  Continuer
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="w-5 h-5" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      S&apos;abonner maintenant
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 border-t border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2024 Eolia Artisan. Tous droits réservés.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-white transition-colors">CGV</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
