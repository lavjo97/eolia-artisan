'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Icônes
const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const SparklesIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const ArrowRightIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

// Loading fallback
function LoadingFallback() {
  return (
    <div className="animate-pulse text-center">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg className="w-12 h-12 text-emerald-400 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Chargement...
      </h2>
    </div>
  );
}

// Success content component that uses useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Simuler la vérification du paiement
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="animate-pulse">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-12 h-12 text-emerald-400 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Vérification du paiement...
        </h2>
        <p className="text-slate-400">
          Veuillez patienter quelques secondes
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Success animation */}
      <div className="relative mb-8">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce-once">
          <CheckCircleIcon className="w-12 h-12 text-white" />
        </div>
        {/* Confetti effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                backgroundColor: ['#10b981', '#14b8a6', '#fbbf24', '#f472b6'][i % 4],
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${i * 30}deg) translateY(-60px)`,
              }}
            />
          ))}
        </div>
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        🎉 Bienvenue chez Eolia !
      </h2>
      
      <p className="text-lg text-slate-300 mb-2">
        Votre inscription a été effectuée avec succès.
      </p>
      
      <p className="text-slate-400 mb-8">
        Votre essai gratuit de 7 jours commence maintenant.
      </p>

      {/* What's next */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 mb-8 text-left">
        <h3 className="text-lg font-semibold text-white mb-4">
          🚀 Prochaines étapes
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </span>
            <span className="text-slate-300">
              Configurez votre entreprise dans les paramètres
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </span>
            <span className="text-slate-300">
              Autorisez le microphone pour la dictée vocale
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </span>
            <span className="text-slate-300">
              Créez votre premier devis par la voix !
            </span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      <Link
        href="/copilote"
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
      >
        Accéder à mon espace
        <ArrowRightIcon className="w-5 h-5" />
      </Link>

      <p className="text-sm text-slate-500 mt-6">
        Un email de confirmation a été envoyé à votre adresse
      </p>
    </>
  );
}

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Eolia Artisan</h1>
            </div>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full text-center">
          <Suspense fallback={<LoadingFallback />}>
            <SuccessContent />
          </Suspense>
        </div>
      </main>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-out;
        }
        
        @keyframes confetti {
          0% { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateY(-120px) scale(0); }
        }
        .animate-confetti {
          animation: confetti 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
