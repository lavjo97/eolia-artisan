'use client';

import React from 'react';
import Link from 'next/link';

// Composant Logo animé
function AnimatedLogo() {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl rotate-6 opacity-80"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
    </div>
  );
}

// Icône check
function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Effets de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-500/5 to-transparent rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AnimatedLogo />
            <div>
              <h1 className="text-xl font-bold text-white">Eolia Artisan</h1>
              <p className="text-xs text-slate-400">Devis vocaux intelligents</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              7 jours d&apos;essai gratuit • Sans carte bancaire
            </div>

            {/* Titre principal */}
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Créez vos devis
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                par la voix
              </span>
            </h2>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              L&apos;assistant IA qui comprend les artisans. Dictez, modifiez et envoyez 
              vos devis en quelques secondes, même sur chantier.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/register"
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <span>Démarrer l&apos;essai gratuit</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/login"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <span>J&apos;ai déjà un compte</span>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span>+500 artisans</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1">4.9/5 avis</span>
              </div>
            </div>
          </div>

          {/* Preview mockup */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-3xl blur-2xl"></div>
              
              {/* Browser frame */}
              <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Browser header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-slate-700/50 rounded-lg px-4 py-1.5 text-sm text-slate-400 text-center">
                      eolia-artisan.vercel.app/copilote
                    </div>
                  </div>
                </div>
                
                {/* App preview */}
                <div className="p-6 min-h-[400px] bg-gradient-to-br from-slate-900 to-slate-800">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Chat panel mockup */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">Assistant IA</p>
                          <p className="text-sm text-emerald-400">● En écoute...</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                          &quot;Le client c&apos;est Monsieur Dupont à Fort-de-France&quot;
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-300">
                          ✓ Client ajouté : M. Dupont - Fort-de-France (972)
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                          &quot;Ajoute climatisation 2500 euros&quot;
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview panel mockup */}
                    <div className="bg-white rounded-xl p-4 text-slate-900">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">DEVIS N° DEV-001</h3>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Brouillon</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span>Client</span>
                          <span className="font-medium">M. Dupont</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span>Climatisation</span>
                          <span className="font-medium">2 500,00 €</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span>TVA (8.5%)</span>
                          <span className="font-medium">212,50 €</span>
                        </div>
                        <div className="flex justify-between py-2 text-lg font-bold text-emerald-600">
                          <span>Total TTC</span>
                          <span>2 712,50 €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Conçu pour les artisans des DOM-TOM
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Une application pensée pour le terrain, utilisable même avec des gants, 
              qui fonctionne hors-ligne et comprend vos contraintes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🎤',
                title: 'Commandes vocales',
                description: 'Dictez vos devis naturellement. L\'IA comprend le français et les accents créoles.'
              },
              {
                icon: '📱',
                title: 'Mode hors-ligne',
                description: 'Travaillez sans connexion internet. Tout se synchronise automatiquement.'
              },
              {
                icon: '🌴',
                title: 'TVA DOM automatique',
                description: 'Taux de TVA corrects pour 971, 972, 973, 974 et 976. Zéro erreur.'
              },
              {
                icon: '⚡',
                title: 'Envoi instantané',
                description: 'WhatsApp, email ou SMS. Vos devis partent en un clic.'
              },
              {
                icon: '📊',
                title: 'Tableau de bord',
                description: 'Suivez vos devis, factures et paiements en temps réel.'
              },
              {
                icon: '🔒',
                title: 'Données sécurisées',
                description: 'Vos informations sont chiffrées et sauvegardées automatiquement.'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h4 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {feature.title}
                </h4>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tarifs simples et transparents
            </h3>
            <p className="text-slate-400">
              Commencez gratuitement pendant 7 jours. Aucune carte bancaire requise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-emerald-500/30 transition-all">
              <h4 className="text-2xl font-bold text-white mb-2">Standard</h4>
              <p className="text-slate-400 mb-6">Idéal pour débuter</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold text-white">25€</span>
                <span className="text-slate-400">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Assistant vocal IA',
                  'Devis & Factures illimités',
                  'Envoi WhatsApp & Email',
                  'Stockage cloud',
                  'Tableau de bord'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/register?plan=standard"
                className="block w-full py-3 text-center bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
              >
                Essayer gratuitement
              </Link>
            </div>

            {/* Premium */}
            <div className="relative bg-gradient-to-b from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-3xl p-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-full">
                ⭐ Le plus populaire
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Premium</h4>
              <p className="text-slate-400 mb-6">Le pack complet</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold text-white">45€</span>
                <span className="text-slate-400">/mois</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Tout du Standard +',
                  'Paiement client en ligne',
                  'Déclaration URSSAF auto',
                  'Notifications SMS',
                  'Gestion des stocks',
                  'Support prioritaire'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/register?plan=premium"
                className="block w-full py-3 text-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25"
              >
                Essayer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à gagner du temps ?
            </h3>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Rejoignez les centaines d&apos;artisans qui créent leurs devis en quelques secondes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xl shadow-emerald-500/30"
              >
                Démarrer l&apos;essai gratuit
              </Link>
              <Link 
                href="/login"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <AnimatedLogo />
              <div>
                <p className="text-white font-medium">Eolia Artisan</p>
                <p className="text-sm text-slate-500">© 2024 Tous droits réservés</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="#" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="#" className="hover:text-white transition-colors">CGV</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
