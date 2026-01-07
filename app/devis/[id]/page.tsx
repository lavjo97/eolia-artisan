'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { getDevisById, updateDevis, deleteDevis } from '@/lib/storage/indexed-db';
import { PDFPreview } from '@/components/PDFPreview';
import { Devis, StatutDevis } from '@/lib/types';

// Icônes SVG
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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

export default function DevisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const devisId = params.id as string;

  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Charger le devis
  useEffect(() => {
    const loadDevis = async () => {
      try {
        setLoading(true);
        const data = await getDevisById(devisId);
        if (data) {
          setDevis(data);
        } else {
          setError('Devis non trouvé');
        }
      } catch {
        setError('Erreur lors du chargement du devis');
      } finally {
        setLoading(false);
      }
    };

    loadDevis();
  }, [devisId]);

  // Changer le statut du devis
  const handleChangeStatut = useCallback(async (newStatut: StatutDevis) => {
    if (!devis) return;

    try {
      const updated = await updateDevis(devis.id, { statut: newStatut });
      setDevis(updated);
    } catch {
      setError('Erreur lors de la mise à jour du statut');
    }
  }, [devis]);

  // Supprimer le devis
  const handleDelete = useCallback(async () => {
    if (!devis) return;

    setIsDeleting(true);
    try {
      await deleteDevis(devis.id);
      router.push('/devis');
    } catch {
      setError('Erreur lors de la suppression');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [devis, router]);

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container-app">
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="loading-spinner w-10 h-10" />
        </div>
      </div>
    );
  }

  if (error || !devis) {
    return (
      <div className="container-app safe-top safe-bottom">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/devis" className="btn-icon">
            <ChevronLeftIcon />
          </Link>
          <h1 className="page-title flex-1 mb-0">Devis</h1>
        </header>

        <div className="card bg-solaire-error/10 border-l-4 border-l-solaire-error">
          <p className="text-solaire-error">{error || 'Devis non trouvé'}</p>
          <Link href="/devis" className="btn-primary mt-4 inline-flex">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Link href="/devis" className="btn-icon">
          <ChevronLeftIcon />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-solaire-text">{devis.numero}</h1>
            <span className={STATUT_STYLES[devis.statut]}>
              {STATUT_LABELS[devis.statut]}
            </span>
          </div>
          <p className="text-sm text-solaire-text-secondary">
            {formatDate(devis.date)}
          </p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-icon text-solaire-error hover:bg-solaire-error/10"
          aria-label="Supprimer"
        >
          <TrashIcon />
        </button>
      </header>

      {/* Changer le statut */}
      <div className="card mb-6">
        <h2 className="text-sm font-medium text-solaire-text-secondary mb-3">
          Changer le statut
        </h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUT_LABELS) as StatutDevis[]).map((statut) => (
            <button
              key={statut}
              onClick={() => handleChangeStatut(statut)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                devis.statut === statut
                  ? 'bg-solaire-accent text-solaire-text-inverse shadow-solaire'
                  : 'bg-solaire-bg-elevated text-solaire-text-secondary hover:text-solaire-text hover:border-solaire-accent border border-solaire-border'
              }`}
            >
              {STATUT_LABELS[statut]}
            </button>
          ))}
        </div>
      </div>

      {/* Informations client */}
      <div className="card mb-6">
        <h2 className="section-title">Client</h2>
        {devis.client?.entreprise && (
          <p className="font-semibold text-solaire-text">{devis.client.entreprise}</p>
        )}
        <p className="text-solaire-text">
          {devis.client?.prenom} {devis.client?.nom}
        </p>
        <p className="text-solaire-text-secondary text-sm">
          {devis.client?.adresse}
        </p>
        <p className="text-solaire-text-secondary text-sm">
          {devis.client?.codePostal} {devis.client?.ville}
        </p>
        {devis.client?.telephone && (
          <p className="text-solaire-text-secondary text-sm mt-2">
            Tél: {devis.client.telephone}
          </p>
        )}
        {devis.client?.email && (
          <p className="text-solaire-text-secondary text-sm">
            {devis.client.email}
          </p>
        )}
      </div>

      {/* Objet du devis */}
      <div className="card mb-6 bg-solaire-accent/10 border-l-4 border-l-solaire-accent">
        <h2 className="text-sm font-medium text-solaire-accent mb-1">Objet</h2>
        <p className="text-solaire-text font-medium">{devis.objet}</p>
        {devis.description && (
          <p className="text-sm text-solaire-text-secondary mt-2 italic">
            {devis.description}
          </p>
        )}
      </div>

      {/* Lignes du devis */}
      <div className="card mb-6">
        <h2 className="section-title">Détail des prestations</h2>
        <div className="space-y-4">
          {devis.lignes.map((ligne) => (
            <div
              key={ligne.id}
              className="p-4 bg-solaire-bg-elevated rounded-touch border border-solaire-border"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium text-solaire-text">{ligne.designation}</p>
                  {ligne.description && (
                    <p className="text-sm text-solaire-text-muted italic">{ligne.description}</p>
                  )}
                  <p className="text-sm text-solaire-text-secondary mt-1">
                    {ligne.quantite} {ligne.unite} × {formatPrice(ligne.prixUnitaireHT)}
                    {ligne.tauxTVA > 0 && ` (TVA ${ligne.tauxTVA}%)`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-solaire-accent">
                    {formatPrice(ligne.montantTTC)}
                  </p>
                  <p className="text-xs text-solaire-text-muted">TTC</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="mt-6 pt-4 border-t border-solaire-border">
          <div className="flex justify-between mb-2">
            <span className="text-solaire-text-secondary">Total HT</span>
            <span className="font-medium text-solaire-text">{formatPrice(devis.totalHT)}</span>
          </div>
          {devis.detailTVA.map((tva) => (
            <div key={tva.taux} className="flex justify-between mb-2">
              <span className="text-solaire-text-muted text-sm">TVA {tva.taux}%</span>
              <span className="text-solaire-text text-sm">{formatPrice(tva.montantTVA)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t border-solaire-border">
            <span className="text-lg font-bold text-solaire-accent-glow">Total TTC</span>
            <span className="text-xl font-bold text-solaire-accent text-glow">
              {formatPrice(devis.totalTTC)}
            </span>
          </div>
        </div>
      </div>

      {/* Conditions */}
      {(devis.conditionsPaiement || devis.delaiExecution || devis.notes) && (
        <div className="card mb-6">
          <h2 className="section-title">Conditions</h2>
          {devis.conditionsPaiement && (
            <p className="text-sm text-solaire-text-secondary mb-2">
              <span className="font-medium text-solaire-text">Paiement:</span>{' '}
              {devis.conditionsPaiement}
            </p>
          )}
          {devis.delaiExecution && (
            <p className="text-sm text-solaire-text-secondary mb-2">
              <span className="font-medium text-solaire-text">Délai:</span>{' '}
              {devis.delaiExecution}
            </p>
          )}
          {devis.notes && (
            <p className="text-sm text-solaire-text-secondary">
              <span className="font-medium text-solaire-text">Notes:</span>{' '}
              {devis.notes}
            </p>
          )}
        </div>
      )}

      {/* Aperçu et téléchargement PDF */}
      <div className="card mb-6">
        <h2 className="section-title">Document PDF</h2>
        <PDFPreview devis={devis} />
      </div>

      {/* Mentions légales */}
      <div className="card mb-6">
        <h2 className="section-title">Mentions légales</h2>
        <ul className="space-y-1">
          {devis.mentionsLegales.map((mention, index) => (
            <li key={index} className="text-xs text-solaire-text-muted">
              • {mention}
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="card max-w-md w-full animate-slide-up">
            <h2 className="text-lg font-bold text-solaire-text mb-2">
              Supprimer ce devis ?
            </h2>
            <p className="text-solaire-text-secondary mb-6">
              Cette action est irréversible. Le devis {devis.numero} sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary flex-1 bg-solaire-error hover:bg-solaire-error/80"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading-spinner w-5 h-5" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
