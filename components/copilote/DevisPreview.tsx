'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import { DevisFormData } from '@/components/DevisForm';
import { calculerLigne, calculerTotauxDevis, LigneDevis } from '@/lib/types';

// Icônes
const DownloadIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const FileIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const PrintIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const ShieldIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const BankIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="18" height="11" rx="2"/>
    <path d="m12 2 9 5H3z"/>
  </svg>
);

interface DevisPreviewProps {
  formData: DevisFormData;
  entreprise?: {
    nom: string;
    adresse?: string;
    siret?: string;
    telephone?: string;
    email?: string;
    logo?: string;
    tvaExonere?: boolean;
    validiteDevis?: number;
    conditionsPaiement?: string;
    modesPaiement?: string[];
    assurance?: {
      nom: string;
      numero: string;
      zone: string;
    };
    banque?: {
      nom: string;
      iban: string;
      bic: string;
    };
  };
  onExportPDF?: () => void;
}

export function DevisPreview({ formData, entreprise, onExportPDF }: DevisPreviewProps) {
  const devisRef = useRef<HTMLDivElement>(null);

  // Générer le numéro de devis
  const numeroDevis = useMemo(() => {
    const hasContent = formData.lignes.some(l => l.designation) || formData.clientNom;
    if (!hasContent) return 'DEV-DRAFT';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `DEV-${year}${month}${day}-${random}`;
  }, [formData.lignes, formData.clientNom]);

  // Calculer les totaux
  const totaux = useMemo(() => {
    const lignesCalculees: LigneDevis[] = formData.lignes.map((ligne, index) => {
      const montants = calculerLigne(ligne.quantite, ligne.prixUnitaireHT, ligne.tauxTVA);
      return {
        ...ligne,
        id: `ligne-${index}`,
        ...montants,
      };
    });
    const base = calculerTotauxDevis(lignesCalculees);
    
    // Calculer la remise
    let remise = 0;
    if (formData.remisePercent && formData.remisePercent > 0) {
      remise = Math.round(base.totalTTC * formData.remisePercent) / 100;
    } else if (formData.remiseAmount && formData.remiseAmount > 0) {
      remise = formData.remiseAmount;
    }
    
    // Acompte de 30%
    const acompte = Math.round((base.totalTTC - remise) * 0.3 * 100) / 100;
    
    return {
      ...base,
      remise: Math.round(remise * 100) / 100,
      totalNet: Math.round((base.totalTTC - remise) * 100) / 100,
      acompte,
    };
  }, [formData.lignes, formData.remisePercent, formData.remiseAmount]);

  // Format prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  // Export PDF via print
  const handleExportPDF = useCallback(() => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      window.print();
    }
  }, [onExportPDF]);

  const today = new Date();
  const validiteJours = entreprise?.validiteDevis || 30;
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + validiteJours);

  const hasLines = formData.lignes.some(l => l.designation && l.prixUnitaireHT > 0);
  const hasClient = formData.clientNom || formData.clientEntreprise;
  const modesPaiement = entreprise?.modesPaiement || ['Virement bancaire', 'Chèque'];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 print:hidden">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Aperçu du Devis
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">Mise à jour automatique</span>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PrintIcon className="w-4 h-4" />
            Imprimer
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Devis Content */}
      <div className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
        <div 
          ref={devisRef}
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none print:max-w-none"
        >
          {/* Devis Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                {/* Logo placeholder */}
                {entreprise?.logo ? (
                  <img src={entreprise.logo} alt="Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {(entreprise?.nom || 'E').charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-blue-600 uppercase tracking-wide">
                    {entreprise?.nom || 'VOTRE ENTREPRISE'}
                  </h1>
                  {entreprise?.adresse ? (
                    <p className="text-sm text-gray-500 mt-1">{entreprise.adresse}</p>
                  ) : (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <span>⚙️</span>
                      Configurez vos informations dans les paramètres
                    </p>
                  )}
                  {entreprise?.siret && (
                    <p className="text-xs text-gray-400 mt-1">SIRET : {entreprise.siret}</p>
                  )}
                  {(entreprise?.telephone || entreprise?.email) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {entreprise.telephone && <span>📞 {entreprise.telephone}</span>}
                      {entreprise.telephone && entreprise.email && <span className="mx-2">•</span>}
                      {entreprise.email && <span>✉️ {entreprise.email}</span>}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase">Devis N°</p>
                <p className="text-lg font-bold text-gray-800">{numeroDevis}</p>
              </div>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-100">
            {/* Client */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Client</p>
              {hasClient ? (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">
                    {formData.clientPrenom} {formData.clientNom}
                  </p>
                  {formData.clientEntreprise && (
                    <p className="text-sm text-gray-600">{formData.clientEntreprise}</p>
                  )}
                  {formData.clientAdresse && (
                    <p className="text-sm text-gray-500">{formData.clientAdresse}</p>
                  )}
                  {(formData.clientCodePostal || formData.clientVille) && (
                    <p className="text-sm text-gray-500">
                      {formData.clientCodePostal} {formData.clientVille}
                    </p>
                  )}
                  {formData.clientTelephone && (
                    <p className="text-sm text-gray-500">📞 {formData.clientTelephone}</p>
                  )}
                  {formData.clientEmail && (
                    <p className="text-sm text-gray-500">✉️ {formData.clientEmail}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-amber-600 italic">
                  En attente des informations client...
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="text-right space-y-2">
              <div>
                <span className="text-amber-600 text-sm">Date : </span>
                <span className="text-gray-800 font-medium">{formatDate(today)}</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Valable jusqu&apos;au : </span>
                <span className="text-gray-800">{formatDate(validUntil)}</span>
              </div>
              {formData.delaiExecution && (
                <div>
                  <span className="text-gray-500 text-sm">Délai d&apos;exécution : </span>
                  <span className="text-gray-800">{formData.delaiExecution}</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {formData.objet || 'Nouveau Devis'}
            </h2>
            {formData.description && (
              <p className="text-sm text-gray-500 mt-2">{formData.description}</p>
            )}
          </div>

          {/* Lines */}
          <div className="px-6 pb-6">
            {hasLines ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Désignation</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase w-20">Qté</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase w-24">P.U. HT</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase w-16">TVA</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase w-28">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lignes.filter(l => l.designation).map((ligne, index) => {
                    const montantHT = ligne.quantite * ligne.prixUnitaireHT;
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-2">
                          <p className="font-medium text-gray-800">{ligne.designation}</p>
                          {ligne.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{ligne.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600 text-sm">
                          {ligne.quantite} {ligne.unite}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600 text-sm">
                          {formatPrice(ligne.prixUnitaireHT)}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500 text-sm">
                          {entreprise?.tvaExonere ? '—' : `${ligne.tauxTVA}%`}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-gray-800">
                          {formatPrice(montantHT)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Commencez à dicter votre devis</p>
                <p className="text-gray-400 text-sm mt-1">Les lignes apparaîtront ici au fur et à mesure</p>
              </div>
            )}
          </div>

          {/* Totals */}
          {hasLines && (
            <div className="px-6 pb-6">
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex justify-between w-72">
                    <span className="text-gray-500">Total HT</span>
                    <span className="font-medium text-gray-800">{formatPrice(totaux.totalHT)}</span>
                  </div>
                  {!entreprise?.tvaExonere && totaux.detailTVA.map((tva) => (
                    <div key={tva.taux} className="flex justify-between w-72">
                      <span className="text-gray-500">TVA {tva.taux}%</span>
                      <span className="text-gray-600">{formatPrice(tva.montantTVA)}</span>
                    </div>
                  ))}
                  {entreprise?.tvaExonere && (
                    <div className="flex justify-between w-72 text-gray-500 italic text-sm">
                      <span>TVA non applicable, art. 293 B du CGI</span>
                    </div>
                  )}
                  <div className="flex justify-between w-72">
                    <span className="text-gray-500">Total TTC</span>
                    <span className="font-medium text-gray-800">{formatPrice(entreprise?.tvaExonere ? totaux.totalHT : totaux.totalTTC)}</span>
                  </div>
                  {totaux.remise > 0 && (
                    <div className="flex justify-between w-72 text-green-600">
                      <span>Remise {formData.remisePercent ? `(${formData.remisePercent}%)` : ''}</span>
                      <span className="font-medium">- {formatPrice(totaux.remise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-72 pt-3 border-t-2 border-amber-200 mt-2">
                    <span className="text-lg font-bold text-amber-600">Net à payer</span>
                    <span className="text-lg font-bold text-amber-600">{formatPrice(totaux.totalNet)}</span>
                  </div>
                  <div className="flex justify-between w-72 text-sm">
                    <span className="text-gray-500">Acompte 30%</span>
                    <span className="text-gray-700 font-medium">{formatPrice(totaux.acompte)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditions de règlement */}
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Conditions de règlement</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>Acompte de 30% à la commande</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>Solde : {entreprise?.conditionsPaiement || 'À réception de facture'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>Modes de paiement acceptés : {modesPaiement.join(', ')}</span>
              </li>
            </ul>
          </div>

          {/* Pénalités de retard - Mention légale obligatoire */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Pénalités de retard</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              En cas de retard de paiement, une pénalité égale à 3 fois le taux d&apos;intérêt légal en vigueur sera appliquée, 
              ainsi qu&apos;une indemnité forfaitaire de 40€ pour frais de recouvrement 
              (art. L441-6 et D441-5 du Code de commerce).
            </p>
          </div>

          {/* Assurance décennale & RIB */}
          <div className="px-6 py-4 border-t border-gray-200 grid grid-cols-2 gap-6">
            {/* Assurance */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldIcon className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-gray-700">Assurance décennale</h4>
              </div>
              {entreprise?.assurance ? (
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p><span className="text-gray-400">Assureur :</span> {entreprise.assurance.nom}</p>
                  <p><span className="text-gray-400">N° Police :</span> {entreprise.assurance.numero}</p>
                  <p><span className="text-gray-400">Zone :</span> {entreprise.assurance.zone}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Non renseignée</p>
              )}
            </div>

            {/* RIB */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BankIcon className="w-4 h-4 text-green-500" />
                <h4 className="text-sm font-semibold text-gray-700">Coordonnées bancaires</h4>
              </div>
              {entreprise?.banque ? (
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p><span className="text-gray-400">Banque :</span> {entreprise.banque.nom}</p>
                  <p><span className="text-gray-400">IBAN :</span> <span className="font-mono">{entreprise.banque.iban}</span></p>
                  <p><span className="text-gray-400">BIC :</span> <span className="font-mono">{entreprise.banque.bic}</span></p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Non renseignées</p>
              )}
            </div>
          </div>

          {/* Signature */}
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2">Bon pour accord - Le Client</p>
                <div className="h-24 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                  Signature
                </div>
                <p className="text-xs text-gray-400 mt-2">Date : ____/____/________</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2">L&apos;Entreprise</p>
                <div className="h-24 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                  Signature & Cachet
                </div>
              </div>
            </div>
          </div>

          {/* Footer légal */}
          <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400">
              Devis établi le {formatDate(today)} • Valable {validiteJours} jours
              {entreprise?.siret && ` • SIRET ${entreprise.siret}`}
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [data-devis-preview], [data-devis-preview] * {
            visibility: visible;
          }
          [data-devis-preview] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default DevisPreview;
