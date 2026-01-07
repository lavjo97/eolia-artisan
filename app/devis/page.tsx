'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useDevis } from '@/lib/storage/indexed-db';
import { Devis, StatutDevis } from '@/lib/types';

// Icônes SVG
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const STATUT_LABELS: Record<StatutDevis, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré',
};

const STATUT_STYLES: Record<StatutDevis, string> = {
  brouillon: 'badge-warning',
  envoye: 'badge bg-solaire-info/20 text-solaire-info border border-solaire-info/30',
  accepte: 'badge-success',
  refuse: 'badge-error',
  expire: 'badge bg-solaire-text-muted/20 text-solaire-text-muted border border-solaire-text-muted/30',
};

interface DevisCardProps {
  devis: Devis;
}

function DevisCard({ devis }: DevisCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Link href={`/devis/${devis.id}`} className="block">
      <article className="card hover:border-solaire-accent transition-all duration-200 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-solaire-accent">
                {devis.numero}
              </span>
              <span className={STATUT_STYLES[devis.statut]}>
                {STATUT_LABELS[devis.statut]}
              </span>
            </div>
            <h3 className="font-semibold text-solaire-text truncate">
              {devis.client?.entreprise || `${devis.client?.prenom || ''} ${devis.client?.nom || ''}`}
            </h3>
            <p className="text-sm text-solaire-text-secondary truncate">
              {devis.objet}
            </p>
            <p className="text-xs text-solaire-text-muted mt-1">
              {formatDate(devis.date)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-solaire-accent">
              {formatPrice(devis.totalTTC)}
            </p>
            <p className="text-xs text-solaire-text-muted">
              {devis.lignes.length} ligne{devis.lignes.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function DevisListPage() {
  const { devis, loading, error } = useDevis();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutDevis | 'all'>('all');

  // Filtrer les devis
  const filteredDevis = useMemo(() => {
    return devis.filter((d) => {
      // Filtre par statut
      if (filterStatut !== 'all' && d.statut !== filterStatut) {
        return false;
      }

      // Filtre par recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchNumero = d.numero.toLowerCase().includes(query);
        const matchClient =
          d.client?.nom?.toLowerCase().includes(query) ||
          d.client?.entreprise?.toLowerCase().includes(query);
        const matchObjet = d.objet.toLowerCase().includes(query);

        return matchNumero || matchClient || matchObjet;
      }

      return true;
    });
  }, [devis, searchQuery, filterStatut]);

  if (loading) {
    return (
      <div className="container-app">
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="loading-spinner w-10 h-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-app safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Link href="/" className="btn-icon">
          <ChevronLeftIcon />
        </Link>
        <h1 className="page-title flex-1 mb-0">Mes Devis</h1>
        <Link href="/devis/nouveau" className="btn-primary py-3 px-4">
          <PlusIcon />
        </Link>
      </header>

      {/* Barre de recherche */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="search"
            placeholder="Rechercher un devis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
          <SearchIcon />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-solaire-text-muted pointer-events-none">
            <SearchIcon />
          </div>
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4">
        <button
          onClick={() => setFilterStatut('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filterStatut === 'all'
              ? 'bg-solaire-accent text-solaire-text-inverse'
              : 'bg-solaire-bg-elevated text-solaire-text-secondary hover:text-solaire-text'
          }`}
        >
          Tous ({devis.length})
        </button>
        {(Object.keys(STATUT_LABELS) as StatutDevis[]).map((statut) => {
          const count = devis.filter((d) => d.statut === statut).length;
          if (count === 0) return null;
          return (
            <button
              key={statut}
              onClick={() => setFilterStatut(statut)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatut === statut
                  ? 'bg-solaire-accent text-solaire-text-inverse'
                  : 'bg-solaire-bg-elevated text-solaire-text-secondary hover:text-solaire-text'
              }`}
            >
              {STATUT_LABELS[statut]} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des devis */}
      {error ? (
        <div className="card bg-solaire-error/10 border-l-4 border-l-solaire-error">
          <p className="text-solaire-error">{error.message}</p>
        </div>
      ) : filteredDevis.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-solaire-bg-elevated mb-4">
            <FileIcon />
          </div>
          <h2 className="text-lg font-semibold text-solaire-text mb-2">
            {searchQuery || filterStatut !== 'all'
              ? 'Aucun devis trouvé'
              : 'Aucun devis'}
          </h2>
          <p className="text-solaire-text-secondary mb-6">
            {searchQuery || filterStatut !== 'all'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Créez votre premier devis pour commencer'}
          </p>
          {!searchQuery && filterStatut === 'all' && (
            <Link href="/devis/nouveau" className="btn-primary">
              <PlusIcon />
              Créer un devis
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevis.map((d) => (
            <DevisCard key={d.id} devis={d} />
          ))}
        </div>
      )}

      {/* Compteur de résultats */}
      {filteredDevis.length > 0 && (
        <p className="text-center text-sm text-solaire-text-muted mt-6">
          {filteredDevis.length} devis affiché{filteredDevis.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
