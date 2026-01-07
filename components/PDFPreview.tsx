'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Devis } from '@/lib/types';

// Import dynamique pour éviter les erreurs SSR avec react-pdf
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <LoadingButton /> }
);

const BlobProvider = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.BlobProvider),
  { ssr: false }
);

// Import du template PDF
import { DevisDocument } from '@/lib/pdf/devis-template';

// Icônes SVG
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
);

const LoadingButton = () => (
  <button className="btn-primary opacity-50 cursor-wait" disabled>
    <span className="loading-spinner" />
    Génération...
  </button>
);

export interface PDFPreviewProps {
  devis: Devis;
  className?: string;
}

/**
 * Composant pour prévisualiser et télécharger un devis en PDF
 */
export function PDFPreview({ devis, className = '' }: PDFPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileName = `Devis_${devis.numero}_${devis.client?.nom || 'Client'}.pdf`;

  // Générer l'aperçu PDF
  const handlePreview = useCallback(async () => {
    setIsGenerating(true);
    setShowPreview(true);
  }, []);

  // Fermer l'aperçu
  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Partager le PDF (Web Share API)
  const handleShare = useCallback(async (blob: Blob) => {
    if (!navigator.share) {
      // Fallback: télécharger si le partage n'est pas supporté
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      await navigator.share({
        files: [file],
        title: `Devis ${devis.numero}`,
        text: `Devis pour ${devis.client?.nom || 'Client'}`,
      });
    } catch {
      // L'utilisateur a annulé ou erreur
      console.log('Partage annulé ou non supporté');
    }
  }, [devis, fileName]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Boutons d'action */}
      <div className="flex flex-wrap gap-3">
        {/* Bouton Télécharger */}
        <PDFDownloadLink
          document={<DevisDocument devis={devis} />}
          fileName={fileName}
        >
          {({ loading }) =>
            loading ? (
              <LoadingButton />
            ) : (
              <button className="btn-primary flex items-center gap-2">
                <DownloadIcon />
                Télécharger PDF
              </button>
            )
          }
        </PDFDownloadLink>

        {/* Bouton Aperçu */}
        <button
          onClick={handlePreview}
          className="btn-secondary flex items-center gap-2"
          disabled={isGenerating && showPreview}
        >
          <EyeIcon />
          Aperçu
        </button>

        {/* Bouton Partager */}
        <BlobProvider document={<DevisDocument devis={devis} />}>
          {({ blob, loading }) => (
            <button
              onClick={() => blob && handleShare(blob)}
              className="btn-secondary flex items-center gap-2"
              disabled={loading || !blob}
            >
              {loading ? (
                <span className="loading-spinner w-5 h-5" />
              ) : (
                <ShareIcon />
              )}
              Partager
            </button>
          )}
        </BlobProvider>
      </div>

      {/* Résumé du devis */}
      <div className="card">
        <h3 className="text-lg font-semibold text-solaire-text mb-4">
          Résumé du devis
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-solaire-text-muted">Numéro:</span>
            <span className="ml-2 font-medium text-solaire-text">{devis.numero}</span>
          </div>
          <div>
            <span className="text-solaire-text-muted">Date:</span>
            <span className="ml-2 font-medium text-solaire-text">
              {new Date(devis.date).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div>
            <span className="text-solaire-text-muted">Client:</span>
            <span className="ml-2 font-medium text-solaire-text">
              {devis.client?.entreprise || `${devis.client?.prenom || ''} ${devis.client?.nom || ''}`}
            </span>
          </div>
          <div>
            <span className="text-solaire-text-muted">Lignes:</span>
            <span className="ml-2 font-medium text-solaire-text">{devis.lignes.length}</span>
          </div>
          <div className="col-span-2 pt-4 border-t border-solaire-border">
            <div className="flex justify-between items-center">
              <span className="text-solaire-text-muted">Total HT:</span>
              <span className="font-medium text-solaire-text">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(devis.totalHT)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-solaire-text-muted">TVA:</span>
              <span className="font-medium text-solaire-text">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(devis.totalTVA)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-solaire-border">
              <span className="text-lg font-bold text-solaire-accent-glow">Total TTC:</span>
              <span className="text-xl font-bold text-solaire-accent">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(devis.totalTTC)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'aperçu */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-solaire-bg border-b border-solaire-border">
              <h3 className="text-lg font-semibold text-solaire-text">
                Aperçu - {devis.numero}
              </h3>
              <button
                onClick={handleClosePreview}
                className="p-2 text-solaire-text hover:text-solaire-accent transition-colors"
                aria-label="Fermer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Contenu PDF */}
            <div className="h-[calc(100%-64px)] overflow-auto bg-gray-200">
              <BlobProvider document={<DevisDocument devis={devis} />}>
                {({ blob, loading, error }) => {
                  if (loading) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <span className="loading-spinner w-12 h-12 mx-auto block mb-4" />
                          <p className="text-gray-600">Génération du PDF...</p>
                        </div>
                      </div>
                    );
                  }

                  if (error) {
                    return (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-red-500">Erreur lors de la génération du PDF</p>
                      </div>
                    );
                  }

                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    return (
                      <iframe
                        src={url}
                        className="w-full h-full"
                        title="Aperçu PDF"
                      />
                    );
                  }

                  return null;
                }}
              </BlobProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFPreview;
