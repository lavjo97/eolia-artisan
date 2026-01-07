'use client';

import Link from 'next/link';
import { useInitData, useDevis, useArtisan } from '@/lib/storage/indexed-db';

// Icônes SVG
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

export default function HomePage() {
  const { loading: initLoading } = useInitData();
  const { devis, loading: devisLoading } = useDevis();
  const { artisan, loading: artisanLoading } = useArtisan();

  const isLoading = initLoading || devisLoading || artisanLoading;

  // Stats
  const devisCount = devis.length;
  const devisBrouillon = devis.filter(d => d.statut === 'brouillon').length;
  const totalTTC = devis.reduce((sum, d) => sum + d.totalTTC, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading-spinner w-12 h-12 mx-auto block mb-4" />
          <p className="text-solaire-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container-app safe-top safe-bottom">
      {/* Header avec logo */}
      <header className="text-center mb-8 pt-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-solaire-accent to-solaire-accent-glow shadow-solaire-lg mb-4">
          <SunIcon />
        </div>
        <h1 className="text-3xl font-bold text-solaire-text text-glow">
          Eolia Artisan
        </h1>
        <p className="text-solaire-text-secondary mt-2">
          Devis professionnels pour artisans DOM-TOM
        </p>
      </header>

      {/* Message de bienvenue ou info artisan */}
      {artisan ? (
        <div className="card mb-6 border-l-4 border-l-solaire-accent">
          <p className="text-sm text-solaire-text-muted">Connecté en tant que</p>
          <p className="font-semibold text-solaire-text">
            {artisan.entreprise || `${artisan.prenom} ${artisan.nom}`}
          </p>
          <p className="text-sm text-solaire-text-secondary">
            {artisan.ville} ({artisan.departement})
          </p>
        </div>
      ) : (
        <div className="card mb-6 bg-solaire-warning/10 border-l-4 border-l-solaire-warning">
          <p className="text-solaire-warning font-medium">
            Configurez votre profil artisan pour commencer
          </p>
        </div>
      )}

      {/* Actions principales */}
      <div className="grid gap-4 mb-8">
        {/* Nouveau bouton Copilote - Interface épurée */}
        <Link
          href="/copilote"
          className="relative overflow-hidden text-center py-6 rounded-touch-lg flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-touch-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
          <MicIcon />
          Copilote Devis
          <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">Nouveau</span>
        </Link>

        <Link
          href="/devis/nouveau"
          className="btn-primary text-center text-touch-lg py-6 flex items-center justify-center gap-3 shine-effect"
        >
          <PlusIcon />
          Nouveau Devis (Formulaire)
        </Link>

        <Link
          href="/devis"
          className="btn-secondary text-center flex items-center justify-center gap-3"
        >
          <FileTextIcon />
          Mes Devis ({devisCount})
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-solaire-accent">{devisCount}</p>
          <p className="text-sm text-solaire-text-muted">Devis créés</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-solaire-accent-glow">{devisBrouillon}</p>
          <p className="text-sm text-solaire-text-muted">En brouillon</p>
        </div>
        <div className="card text-center col-span-2">
          <p className="text-2xl font-bold text-solaire-success">{formatPrice(totalTTC)}</p>
          <p className="text-sm text-solaire-text-muted">Total devis TTC</p>
        </div>
      </div>

      {/* Fonctionnalités */}
      <section className="space-y-4">
        <h2 className="section-title">Fonctionnalités</h2>
        
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-full bg-solaire-accent/20 text-solaire-accent">
            <MicIcon />
          </div>
          <div>
            <h3 className="font-semibold text-solaire-text">Dictée Vocale</h3>
            <p className="text-sm text-solaire-text-secondary">
              Remplissez vos devis en parlant. Idéal sur chantier avec des gants.
            </p>
          </div>
        </div>

        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-full bg-solaire-success/20 text-solaire-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-solaire-text">Mode Hors-ligne</h3>
            <p className="text-sm text-solaire-text-secondary">
              Travaillez sans connexion. Vos données sont sauvegardées localement.
            </p>
          </div>
        </div>

        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-full bg-solaire-info/20 text-solaire-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              <text x="10" y="17" fontSize="10" fill="currentColor">€</text>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-solaire-text">TVA DOM</h3>
            <p className="text-sm text-solaire-text-secondary">
              Taux de TVA automatiques pour Guadeloupe, Martinique, Guyane, Réunion, Mayotte.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-solaire-border text-center">
        <p className="text-xs text-solaire-text-muted">
          Eolia Artisan v1.0 • Application PWA hors-ligne
        </p>
        <p className="text-xs text-solaire-text-muted mt-1">
          Optimisé pour une utilisation en extérieur 🌴
        </p>
      </footer>
    </main>
  );
}
