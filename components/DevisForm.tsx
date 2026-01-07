'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { VoiceButton } from '@/components/VoiceButton';
import { VoiceCommandBar, emitVoiceCommandResult } from '@/components/VoiceCommandBar';
import { parseVoiceIntent, applyIntentToForm } from '@/lib/voice/intent-parser';
import {
  LigneDevis,
  Client,
  DepartementDOM,
  TypeTVA,
  TVA_DOM,
  UNITES,
  calculerLigne,
  calculerTotauxDevis,
  getTauxTVA,
} from '@/lib/types';

// Icônes SVG
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export interface DevisFormData {
  // Client
  clientNom: string;
  clientPrenom: string;
  clientEntreprise: string;
  clientAdresse: string;
  clientCodePostal: string;
  clientVille: string;
  clientDepartement: DepartementDOM | string;
  clientTelephone: string;
  clientEmail: string;
  // Devis
  objet: string;
  description: string;
  lignes: Omit<LigneDevis, 'id' | 'montantHT' | 'montantTVA' | 'montantTTC'>[];
  // Remise
  remisePercent?: number;
  remiseAmount?: number;
  // Conditions
  conditionsPaiement: string;
  delaiExecution: string;
  notes: string;
}

export interface DevisFormProps {
  initialData?: Partial<DevisFormData>;
  /** Données contrôlées du formulaire (pour l'édition conversationnelle) */
  controlledData?: DevisFormData;
  /** Callback quand les données changent (mode contrôlé) */
  onDataChange?: (data: DevisFormData) => void;
  clients?: Client[];
  artisanDepartement?: DepartementDOM;
  onSubmit: (data: DevisFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const DEPARTEMENTS_OPTIONS = [
  { value: '', label: 'Sélectionner un département' },
  { value: '971', label: '971 - Guadeloupe' },
  { value: '972', label: '972 - Martinique' },
  { value: '973', label: '973 - Guyane' },
  { value: '974', label: '974 - La Réunion' },
  { value: '976', label: '976 - Mayotte' },
];

const TVA_OPTIONS = [
  { value: 'normal', label: 'Taux normal' },
  { value: 'reduit', label: 'Taux réduit' },
  { value: 'super_reduit', label: 'Taux super-réduit' },
  { value: 'exonere', label: 'Exonéré' },
];

const defaultLigne = (): Omit<LigneDevis, 'id' | 'montantHT' | 'montantTVA' | 'montantTTC'> => ({
  designation: '',
  description: '',
  quantite: 1,
  unite: 'u',
  prixUnitaireHT: 0,
  tauxTVA: 8.5,
  typeTVA: 'normal',
});

export function DevisForm({
  initialData,
  controlledData,
  onDataChange,
  clients = [],
  artisanDepartement = '972',
  onSubmit,
  onCancel,
  isLoading = false,
}: DevisFormProps) {
  // État du formulaire (interne ou contrôlé)
  const [internalFormData, setInternalFormData] = useState<DevisFormData>({
    clientNom: initialData?.clientNom || '',
    clientPrenom: initialData?.clientPrenom || '',
    clientEntreprise: initialData?.clientEntreprise || '',
    clientAdresse: initialData?.clientAdresse || '',
    clientCodePostal: initialData?.clientCodePostal || '',
    clientVille: initialData?.clientVille || '',
    clientDepartement: initialData?.clientDepartement || artisanDepartement,
    clientTelephone: initialData?.clientTelephone || '',
    clientEmail: initialData?.clientEmail || '',
    objet: initialData?.objet || '',
    description: initialData?.description || '',
    lignes: initialData?.lignes || [defaultLigne()],
    remisePercent: initialData?.remisePercent,
    remiseAmount: initialData?.remiseAmount,
    conditionsPaiement: initialData?.conditionsPaiement || 'Paiement à réception de facture',
    delaiExecution: initialData?.delaiExecution || '',
    notes: initialData?.notes || '',
  });

  // Utiliser les données contrôlées si fournies, sinon les données internes
  const formData = controlledData || internalFormData;
  
  // Fonction pour mettre à jour les données (notifie le parent si contrôlé)
  const setFormData = useCallback((updater: DevisFormData | ((prev: DevisFormData) => DevisFormData)) => {
    if (controlledData && onDataChange) {
      const newData = typeof updater === 'function' ? updater(controlledData) : updater;
      onDataChange(newData);
    } else {
      setInternalFormData(updater);
    }
  }, [controlledData, onDataChange]);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [, setActiveVoiceField] = useState<string | null>(null);
  const [totaux, setTotaux] = useState({ 
    totalHT: 0, 
    totalTVA: 0, 
    totalTTC: 0, 
    remise: 0,
    totalNetTTC: 0,
    detailTVA: [] as { taux: number; baseHT: number; montantTVA: number }[] 
  });

  // Fonction pour obtenir le taux TVA
  const getDepartmentTVA = useCallback((dept: string, type: TypeTVA): number => {
    return getTauxTVA(dept as DepartementDOM, type);
  }, []);

  // Calculer les totaux à chaque changement de lignes ou remise
  useEffect(() => {
    const lignesCalculees: LigneDevis[] = formData.lignes.map((ligne, index) => {
      const montants = calculerLigne(ligne.quantite, ligne.prixUnitaireHT, ligne.tauxTVA);
      return {
        ...ligne,
        id: `ligne-${index}`,
        ...montants,
      };
    });
    const baseTotaux = calculerTotauxDevis(lignesCalculees);
    
    // Calculer la remise
    let remise = 0;
    if (formData.remisePercent && formData.remisePercent > 0) {
      remise = Math.round(baseTotaux.totalTTC * formData.remisePercent) / 100;
    } else if (formData.remiseAmount && formData.remiseAmount > 0) {
      remise = formData.remiseAmount;
    }
    
    const totalNetTTC = Math.max(0, baseTotaux.totalTTC - remise);
    
    setTotaux({
      ...baseTotaux,
      remise: Math.round(remise * 100) / 100,
      totalNetTTC: Math.round(totalNetTTC * 100) / 100,
    });
  }, [formData.lignes, formData.remisePercent, formData.remiseAmount]);

  // Handler pour les commandes vocales globales
  const handleVoiceCommand = useCallback((text: string) => {
    const intent = parseVoiceIntent(text);
    const { updatedData, message } = applyIntentToForm(intent, formData, getDepartmentTVA);
    
    const success = intent.type !== 'unknown' && intent.confidence >= 0.4;
    
    if (success) {
      setFormData(updatedData);
    }
    
    // Émettre le résultat pour l'affichage
    emitVoiceCommandResult(message, success);
  }, [formData, getDepartmentTVA, setFormData]);

  // Mettre à jour le taux TVA quand le département change
  useEffect(() => {
    if (formData.clientDepartement) {
      const dept = formData.clientDepartement as DepartementDOM;
      setFormData((prev) => ({
        ...prev,
        lignes: prev.lignes.map((ligne) => ({
          ...ligne,
          tauxTVA: getTauxTVA(dept, ligne.typeTVA),
        })),
      }));
    }
  }, [formData.clientDepartement]);

  // Gérer la sélection d'un client existant
  const handleClientSelect = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId) {
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        setFormData((prev) => ({
          ...prev,
          clientNom: client.nom,
          clientPrenom: client.prenom || '',
          clientEntreprise: client.entreprise || '',
          clientAdresse: client.adresse,
          clientCodePostal: client.codePostal,
          clientVille: client.ville,
          clientDepartement: client.departement,
          clientTelephone: client.telephone || '',
          clientEmail: client.email || '',
        }));
      }
    }
  }, [clients]);

  // Gérer les changements de champs
  const handleChange = useCallback((field: keyof DevisFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Gérer les changements de lignes
  const handleLigneChange = useCallback((
    index: number,
    field: keyof Omit<LigneDevis, 'id' | 'montantHT' | 'montantTVA' | 'montantTTC'>,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newLignes = [...prev.lignes];
      const ligne = { ...newLignes[index] };

      if (field === 'typeTVA') {
        ligne.typeTVA = value as TypeTVA;
        ligne.tauxTVA = getTauxTVA(prev.clientDepartement as DepartementDOM, value as TypeTVA);
      } else if (field === 'quantite' || field === 'prixUnitaireHT' || field === 'tauxTVA') {
        (ligne as Record<string, unknown>)[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
      } else {
        (ligne as Record<string, unknown>)[field] = value;
      }

      newLignes[index] = ligne;
      return { ...prev, lignes: newLignes };
    });
  }, []);

  // Ajouter une ligne
  const addLigne = useCallback(() => {
    const dept = formData.clientDepartement as DepartementDOM;
    const newLigne = defaultLigne();
    newLigne.tauxTVA = getTauxTVA(dept, 'normal');
    setFormData((prev) => ({ ...prev, lignes: [...prev.lignes, newLigne] }));
  }, [formData.clientDepartement]);

  // Supprimer une ligne
  const removeLigne = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index),
    }));
  }, []);

  // Gérer la transcription vocale
  const handleVoiceTranscript = useCallback((field: string, text: string) => {
    if (field.startsWith('ligne-')) {
      const [, indexStr, ligneField] = field.split('-');
      const index = parseInt(indexStr, 10);
      handleLigneChange(index, ligneField as keyof Omit<LigneDevis, 'id' | 'montantHT' | 'montantTVA' | 'montantTTC'>, text);
    } else {
      handleChange(field as keyof DevisFormData, text);
    }
    setActiveVoiceField(null);
  }, [handleChange, handleLigneChange]);

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  // Obtenir la config TVA du département
  const tvaConfig = TVA_DOM[formData.clientDepartement as DepartementDOM];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section Client */}
      <section className="card">
        <h2 className="section-title flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-solaire-accent flex items-center justify-center text-sm font-bold text-solaire-text-inverse">1</span>
          Informations Client
        </h2>

        {/* Sélection client existant */}
        {clients.length > 0 && (
          <div className="mb-6">
            <Select
              label="Client existant"
              value={selectedClientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              options={[
                { value: '', label: 'Nouveau client' },
                ...clients.map((c) => ({
                  value: c.id,
                  label: c.entreprise || `${c.prenom || ''} ${c.nom}`.trim(),
                })),
              ]}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom *"
            value={formData.clientNom}
            onChange={(e) => handleChange('clientNom', e.target.value)}
            required
            rightElement={
              <VoiceButton
                size="sm"
                showStatus={false}
                onTranscript={(text) => handleVoiceTranscript('clientNom', text)}
              />
            }
          />
          <Input
            label="Prénom"
            value={formData.clientPrenom}
            onChange={(e) => handleChange('clientPrenom', e.target.value)}
          />
          <Input
            label="Entreprise"
            value={formData.clientEntreprise}
            onChange={(e) => handleChange('clientEntreprise', e.target.value)}
            className="md:col-span-2"
          />
          <Input
            label="Adresse *"
            value={formData.clientAdresse}
            onChange={(e) => handleChange('clientAdresse', e.target.value)}
            required
            className="md:col-span-2"
            rightElement={
              <VoiceButton
                size="sm"
                showStatus={false}
                onTranscript={(text) => handleVoiceTranscript('clientAdresse', text)}
              />
            }
          />
          <Input
            label="Code postal *"
            value={formData.clientCodePostal}
            onChange={(e) => handleChange('clientCodePostal', e.target.value)}
            required
          />
          <Input
            label="Ville *"
            value={formData.clientVille}
            onChange={(e) => handleChange('clientVille', e.target.value)}
            required
          />
          <Select
            label="Département *"
            value={formData.clientDepartement}
            onChange={(e) => handleChange('clientDepartement', e.target.value)}
            options={DEPARTEMENTS_OPTIONS}
            hint={tvaConfig ? `TVA: ${tvaConfig.tauxNormal}% (${tvaConfig.nom})` : undefined}
          />
          <Input
            label="Téléphone"
            type="tel"
            value={formData.clientTelephone}
            onChange={(e) => handleChange('clientTelephone', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={formData.clientEmail}
            onChange={(e) => handleChange('clientEmail', e.target.value)}
            className="md:col-span-2"
          />
        </div>
      </section>

      {/* Section Objet du devis */}
      <section className="card">
        <h2 className="section-title flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-solaire-accent flex items-center justify-center text-sm font-bold text-solaire-text-inverse">2</span>
          Objet du Devis
        </h2>

        <div className="space-y-4">
          <Input
            label="Objet *"
            value={formData.objet}
            onChange={(e) => handleChange('objet', e.target.value)}
            placeholder="Ex: Installation chauffe-eau solaire"
            required
            rightElement={
              <VoiceButton
                size="sm"
                showStatus={false}
                onTranscript={(text) => handleVoiceTranscript('objet', text)}
              />
            }
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Description détaillée des travaux..."
            rows={4}
            rightElement={
              <VoiceButton
                size="sm"
                showStatus={false}
                onTranscript={(text) => handleVoiceTranscript('description', text)}
              />
            }
          />
        </div>
      </section>

      {/* Section Lignes de devis */}
      <section className="card">
        <h2 className="section-title flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-solaire-accent flex items-center justify-center text-sm font-bold text-solaire-text-inverse">3</span>
          Prestations & Fournitures
        </h2>

        {/* Barre de commande vocale */}
        <div className="mb-6">
          <VoiceCommandBar
            onCommand={handleVoiceCommand}
          />
        </div>

        <div className="space-y-4">
          {formData.lignes.map((ligne, index) => (
            <div
              key={index}
              className="card-elevated space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-solaire-accent">
                  Ligne {index + 1}
                </span>
                {formData.lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLigne(index)}
                    className="p-2 text-solaire-error hover:bg-solaire-error/10 rounded-touch transition-colors"
                    aria-label="Supprimer la ligne"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Désignation *"
                  value={ligne.designation}
                  onChange={(e) => handleLigneChange(index, 'designation', e.target.value)}
                  placeholder="Ex: Chauffe-eau solaire 200L"
                  required
                  className="md:col-span-2"
                  rightElement={
                    <VoiceButton
                      size="sm"
                      showStatus={false}
                      onTranscript={(text) => handleVoiceTranscript(`ligne-${index}-designation`, text)}
                    />
                  }
                />
                <Input
                  label="Quantité *"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ligne.quantite}
                  onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                  required
                />
                <Select
                  label="Unité"
                  value={ligne.unite}
                  onChange={(e) => handleLigneChange(index, 'unite', e.target.value)}
                  options={UNITES.map((u) => ({ value: u.value, label: u.label }))}
                />
                <Input
                  label="Prix unitaire HT *"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ligne.prixUnitaireHT}
                  onChange={(e) => handleLigneChange(index, 'prixUnitaireHT', e.target.value)}
                  required
                  rightIcon={<span className="text-solaire-text-muted">€</span>}
                />
                <Select
                  label="Type TVA"
                  value={ligne.typeTVA}
                  onChange={(e) => handleLigneChange(index, 'typeTVA', e.target.value)}
                  options={TVA_OPTIONS}
                  hint={`Taux: ${ligne.tauxTVA}%`}
                />
              </div>

              {/* Montants calculés */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-solaire-border">
                <div className="text-sm">
                  <span className="text-solaire-text-muted">HT:</span>{' '}
                  <span className="font-semibold text-solaire-text">
                    {formatPrice(ligne.quantite * ligne.prixUnitaireHT)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-solaire-text-muted">TVA:</span>{' '}
                  <span className="font-semibold text-solaire-text">
                    {formatPrice(calculerLigne(ligne.quantite, ligne.prixUnitaireHT, ligne.tauxTVA).montantTVA)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-solaire-text-muted">TTC:</span>{' '}
                  <span className="font-bold text-solaire-accent">
                    {formatPrice(calculerLigne(ligne.quantite, ligne.prixUnitaireHT, ligne.tauxTVA).montantTTC)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={addLigne}
            leftIcon={<PlusIcon />}
            className="w-full"
          >
            Ajouter une ligne
          </Button>
        </div>

        {/* Section Remise */}
        <div className="mt-6 p-4 rounded-xl bg-solaire-bg-elevated/50 border border-solaire-border">
          <h4 className="text-sm font-medium text-solaire-text mb-3 flex items-center gap-2">
            <span className="text-solaire-accent">💰</span>
            Remise / Réduction
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-solaire-text-muted mb-1">Remise en %</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.remisePercent || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || undefined;
                    setFormData(prev => ({ ...prev, remisePercent: value, remiseAmount: undefined }));
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 bg-solaire-bg-card border border-solaire-border rounded-lg text-solaire-text text-right focus:outline-none focus:ring-2 focus:ring-solaire-accent focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-solaire-text-muted">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-solaire-text-muted mb-1">Ou remise fixe</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.remiseAmount || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || undefined;
                    setFormData(prev => ({ ...prev, remiseAmount: value, remisePercent: undefined }));
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 pr-8 bg-solaire-bg-card border border-solaire-border rounded-lg text-solaire-text text-right focus:outline-none focus:ring-2 focus:ring-solaire-accent focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-solaire-text-muted">€</span>
              </div>
            </div>
          </div>
          {(formData.remisePercent || formData.remiseAmount) && (
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, remisePercent: undefined, remiseAmount: undefined }))}
              className="mt-2 text-xs text-solaire-error hover:text-solaire-error/80 transition-colors"
            >
              ✕ Supprimer la remise
            </button>
          )}
        </div>

        {/* Totaux */}
        <div className="mt-6 pt-6 border-t-2 border-solaire-border">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4 text-touch">
              <span className="text-solaire-text-secondary">Total HT:</span>
              <span className="font-semibold text-solaire-text w-32 text-right">
                {formatPrice(totaux.totalHT)}
              </span>
            </div>
            {totaux.detailTVA.map((tva) => (
              <div key={tva.taux} className="flex items-center gap-4 text-sm">
                <span className="text-solaire-text-muted">TVA {tva.taux}%:</span>
                <span className="text-solaire-text w-32 text-right">
                  {formatPrice(tva.montantTVA)}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-4 text-touch">
              <span className="text-solaire-text-secondary">Total TTC:</span>
              <span className="font-semibold text-solaire-text w-32 text-right">
                {formatPrice(totaux.totalTTC)}
              </span>
            </div>
            {totaux.remise > 0 && (
              <div className="flex items-center gap-4 text-touch text-solaire-success">
                <span>
                  Remise {formData.remisePercent ? `(${formData.remisePercent}%)` : ''}:
                </span>
                <span className="font-semibold w-32 text-right">
                  - {formatPrice(totaux.remise)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 text-touch-lg font-bold pt-2 border-t border-solaire-border mt-2">
              <span className="text-solaire-accent-glow">Net à payer:</span>
              <span className="text-solaire-accent text-glow w-32 text-right">
                {formatPrice(totaux.totalNetTTC)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Conditions */}
      <section className="card">
        <h2 className="section-title flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-solaire-accent flex items-center justify-center text-sm font-bold text-solaire-text-inverse">4</span>
          Conditions & Notes
        </h2>

        <div className="space-y-4">
          <Input
            label="Conditions de paiement"
            value={formData.conditionsPaiement}
            onChange={(e) => handleChange('conditionsPaiement', e.target.value)}
            placeholder="Ex: Paiement à réception de facture"
          />
          <Input
            label="Délai d'exécution"
            value={formData.delaiExecution}
            onChange={(e) => handleChange('delaiExecution', e.target.value)}
            placeholder="Ex: 2 semaines à compter de l'acceptation"
            rightElement={
              <VoiceButton
                size="sm"
                showStatus={false}
                onTranscript={(text) => handleVoiceTranscript('delaiExecution', text)}
              />
            }
          />
          <Textarea
            label="Notes / Observations"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Informations complémentaires..."
            rows={3}
            rightElement={
              <VoiceButton
                size="sm"
                showStatus={false}
                onTranscript={(text) => handleVoiceTranscript('notes', text)}
              />
            }
          />
        </div>
      </section>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading}
        >
          Enregistrer le devis
        </Button>
      </div>
    </form>
  );
}

export default DevisForm;
