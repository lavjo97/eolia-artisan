'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { DevisForm, DevisFormData } from '@/components/DevisForm';
import { ConversationalEditor } from '@/components/ConversationalEditor';
import { useArtisan, useClients, createDevis } from '@/lib/storage/indexed-db';
import { DepartementDOM, NouveauDevisData, getTauxTVA, TypeTVA } from '@/lib/types';

// Icônes SVG
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

// Fonction utilitaire pour créer les données initiales du formulaire
const createInitialFormData = (departement: DepartementDOM): DevisFormData => ({
  clientNom: '',
  clientPrenom: '',
  clientEntreprise: '',
  clientAdresse: '',
  clientCodePostal: '',
  clientVille: '',
  clientDepartement: departement,
  clientTelephone: '',
  clientEmail: '',
  objet: '',
  description: '',
  lignes: [{
    designation: '',
    description: '',
    quantite: 1,
    unite: 'u',
    prixUnitaireHT: 0,
    tauxTVA: getTauxTVA(departement, 'normal'),
    typeTVA: 'normal' as TypeTVA,
  }],
  remisePercent: undefined,
  remiseAmount: undefined,
  conditionsPaiement: 'Paiement à réception de facture',
  delaiExecution: '',
  notes: '',
});

export default function NouveauDevisPage() {
  const router = useRouter();
  const { artisan, loading: artisanLoading } = useArtisan();
  const { clients, loading: clientsLoading } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État contrôlé pour l'édition conversationnelle
  const [formData, setFormData] = useState<DevisFormData | null>(null);
  
  // Initialiser les données du formulaire quand l'artisan est chargé
  const getFormData = useCallback((): DevisFormData => {
    if (formData) return formData;
    return createInitialFormData((artisan?.departement as DepartementDOM) || '972');
  }, [formData, artisan?.departement]);

  // Callback pour mettre à jour les données depuis l'éditeur conversationnel
  const handleFormDataChange = useCallback((data: DevisFormData) => {
    setFormData(data);
  }, []);

  const handleSubmit = useCallback(async (formData: DevisFormData) => {
    if (!artisan) {
      setError('Veuillez d\'abord configurer votre profil artisan');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Préparer les données du devis
      const devisData: NouveauDevisData = {
        artisanId: artisan.id,
        clientData: {
          nom: formData.clientNom,
          prenom: formData.clientPrenom || undefined,
          entreprise: formData.clientEntreprise || undefined,
          adresse: formData.clientAdresse,
          codePostal: formData.clientCodePostal,
          ville: formData.clientVille,
          departement: formData.clientDepartement,
          telephone: formData.clientTelephone || undefined,
          email: formData.clientEmail || undefined,
        },
        objet: formData.objet,
        description: formData.description || undefined,
        lignes: formData.lignes.map((ligne) => ({
          designation: ligne.designation,
          description: ligne.description,
          quantite: ligne.quantite,
          unite: ligne.unite,
          prixUnitaireHT: ligne.prixUnitaireHT,
          tauxTVA: ligne.tauxTVA,
          typeTVA: ligne.typeTVA,
        })),
        conditionsPaiement: formData.conditionsPaiement || undefined,
        delaiExecution: formData.delaiExecution || undefined,
        notes: formData.notes || undefined,
      };

      // Créer le devis
      const nouveauDevis = await createDevis(devisData);

      // Rediriger vers la page du devis créé
      router.push(`/devis/${nouveauDevis.id}`);
    } catch (err) {
      console.error('Erreur lors de la création du devis:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la création du devis'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [artisan, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (artisanLoading || clientsLoading) {
    return (
      <div className="container-app">
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="loading-spinner w-10 h-10" />
        </div>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div className="container-app safe-top safe-bottom">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/" className="btn-icon">
            <ChevronLeftIcon />
          </Link>
          <h1 className="page-title flex-1 mb-0">Nouveau Devis</h1>
        </header>

        <div className="card bg-solaire-warning/10 border-l-4 border-l-solaire-warning text-center py-8">
          <h2 className="text-lg font-semibold text-solaire-warning mb-2">
            Configuration requise
          </h2>
          <p className="text-solaire-text-secondary mb-4">
            Vous devez d&apos;abord configurer votre profil artisan avant de créer des devis.
          </p>
          <Link href="/profil" className="btn-primary inline-flex">
            Configurer mon profil
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
        <div>
          <h1 className="page-title mb-0">Nouveau Devis</h1>
          <p className="text-sm text-solaire-text-secondary">
            Remplissez les informations du devis
          </p>
        </div>
      </header>

      {/* Message d'erreur */}
      {error && (
        <div className="card bg-solaire-error/10 border-l-4 border-l-solaire-error mb-6 animate-slide-down">
          <p className="text-solaire-error">{error}</p>
        </div>
      )}

      {/* Astuce vocale améliorée */}
      <div className="card bg-gradient-to-r from-solaire-accent/10 to-solaire-accent/5 border-l-4 border-l-solaire-accent mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-solaire-accent/20 text-solaire-accent shrink-0 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-solaire-accent">🎤 Nouveau : Édition conversationnelle !</p>
            <p className="text-sm text-solaire-text-secondary">
              Cliquez sur le bouton micro en bas à droite et dictez directement : 
              <span className="italic">&quot;Le client s&apos;appelle Jean Dupont&quot;</span> ou 
              <span className="italic">&quot;Ajoute une ligne chauffe-eau à 1500 euros&quot;</span>
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire avec données contrôlées */}
      <DevisForm
        controlledData={formData || undefined}
        onDataChange={handleFormDataChange}
        clients={clients}
        artisanDepartement={artisan.departement as DepartementDOM}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />

      {/* Éditeur conversationnel flottant */}
      <ConversationalEditor
        formData={getFormData()}
        onFormDataChange={handleFormDataChange}
      />
    </div>
  );
}
