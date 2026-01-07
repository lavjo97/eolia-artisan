// Types TypeScript pour Eolia Artisan

// Départements DOM avec leurs codes
export type DepartementDOM = '971' | '972' | '973' | '974' | '976';

// Configuration TVA par département DOM
export interface TVAConfig {
  departement: DepartementDOM;
  nom: string;
  tauxNormal: number;
  tauxReduit: number;
  tauxSuperReduit: number;
  exonerationArticle293B: boolean;
}

// Configuration TVA pour chaque DOM
export const TVA_DOM: Record<DepartementDOM, TVAConfig> = {
  '971': {
    departement: '971',
    nom: 'Guadeloupe',
    tauxNormal: 8.5,
    tauxReduit: 2.1,
    tauxSuperReduit: 1.75,
    exonerationArticle293B: true,
  },
  '972': {
    departement: '972',
    nom: 'Martinique',
    tauxNormal: 8.5,
    tauxReduit: 2.1,
    tauxSuperReduit: 1.75,
    exonerationArticle293B: true,
  },
  '973': {
    departement: '973',
    nom: 'Guyane',
    tauxNormal: 0,
    tauxReduit: 0,
    tauxSuperReduit: 0,
    exonerationArticle293B: true,
  },
  '974': {
    departement: '974',
    nom: 'La Réunion',
    tauxNormal: 8.5,
    tauxReduit: 2.1,
    tauxSuperReduit: 1.05,
    exonerationArticle293B: true,
  },
  '976': {
    departement: '976',
    nom: 'Mayotte',
    tauxNormal: 0,
    tauxReduit: 0,
    tauxSuperReduit: 0,
    exonerationArticle293B: true,
  },
};

// Type de TVA applicable
export type TypeTVA = 'normal' | 'reduit' | 'super_reduit' | 'exonere';

// Information client
export interface Client {
  id: string;
  nom: string;
  prenom?: string;
  entreprise?: string;
  adresse: string;
  codePostal: string;
  ville: string;
  departement: DepartementDOM | string;
  telephone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Information artisan
export interface Artisan {
  id: string;
  nom: string;
  prenom: string;
  entreprise: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  departement: DepartementDOM | string;
  telephone: string;
  email: string;
  logo?: string;
  assuranceDecennale?: {
    numero: string;
    compagnie: string;
    dateValidite: Date;
  };
  exonerationTVA: boolean;
  mentionExonerationTVA?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ligne de devis
export interface LigneDevis {
  id: string;
  designation: string;
  description?: string;
  quantite: number;
  unite: string;
  prixUnitaireHT: number;
  tauxTVA: number;
  typeTVA: TypeTVA;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

// Statut du devis
export type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';

// Devis complet
export interface Devis {
  id: string;
  numero: string;
  date: Date;
  dateValidite: Date;
  statut: StatutDevis;
  
  // Références
  artisanId: string;
  artisan?: Artisan;
  clientId: string;
  client?: Client;
  
  // Objet et description
  objet: string;
  description?: string;
  
  // Lignes de devis
  lignes: LigneDevis[];
  
  // Totaux
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  
  // TVA détaillée par taux
  detailTVA: {
    taux: number;
    baseHT: number;
    montantTVA: number;
  }[];
  
  // Conditions
  conditionsPaiement?: string;
  delaiExecution?: string;
  notes?: string;
  
  // Mentions légales
  mentionsLegales: string[];
  
  // Schéma/plan du site (URL de l'image)
  sketchUrl?: string;
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

// Données pour créer un nouveau devis
export interface NouveauDevisData {
  artisanId: string;
  clientId?: string;
  clientData?: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
  objet: string;
  description?: string;
  lignes: Omit<LigneDevis, 'id' | 'montantHT' | 'montantTVA' | 'montantTTC'>[];
  dateValidite?: Date;
  conditionsPaiement?: string;
  delaiExecution?: string;
  notes?: string;
}

// Unités de mesure communes
export const UNITES = [
  { value: 'u', label: 'Unité' },
  { value: 'm', label: 'Mètre' },
  { value: 'm²', label: 'Mètre carré' },
  { value: 'm³', label: 'Mètre cube' },
  { value: 'ml', label: 'Mètre linéaire' },
  { value: 'h', label: 'Heure' },
  { value: 'j', label: 'Jour' },
  { value: 'forfait', label: 'Forfait' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'l', label: 'Litre' },
] as const;

// Fonctions utilitaires

/**
 * Calcule les montants d'une ligne de devis
 */
export function calculerLigne(
  quantite: number,
  prixUnitaireHT: number,
  tauxTVA: number
): { montantHT: number; montantTVA: number; montantTTC: number } {
  const montantHT = quantite * prixUnitaireHT;
  const montantTVA = montantHT * (tauxTVA / 100);
  const montantTTC = montantHT + montantTVA;
  
  return {
    montantHT: Math.round(montantHT * 100) / 100,
    montantTVA: Math.round(montantTVA * 100) / 100,
    montantTTC: Math.round(montantTTC * 100) / 100,
  };
}

/**
 * Calcule les totaux d'un devis
 */
export function calculerTotauxDevis(lignes: LigneDevis[]): {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  detailTVA: { taux: number; baseHT: number; montantTVA: number }[];
} {
  const totalHT = lignes.reduce((sum, l) => sum + l.montantHT, 0);
  const totalTVA = lignes.reduce((sum, l) => sum + l.montantTVA, 0);
  const totalTTC = lignes.reduce((sum, l) => sum + l.montantTTC, 0);
  
  // Regrouper par taux de TVA
  const tvaMap = new Map<number, { baseHT: number; montantTVA: number }>();
  lignes.forEach((l) => {
    const existing = tvaMap.get(l.tauxTVA) || { baseHT: 0, montantTVA: 0 };
    tvaMap.set(l.tauxTVA, {
      baseHT: existing.baseHT + l.montantHT,
      montantTVA: existing.montantTVA + l.montantTVA,
    });
  });
  
  const detailTVA = Array.from(tvaMap.entries())
    .map(([taux, data]) => ({
      taux,
      baseHT: Math.round(data.baseHT * 100) / 100,
      montantTVA: Math.round(data.montantTVA * 100) / 100,
    }))
    .sort((a, b) => b.taux - a.taux);
  
  return {
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
    detailTVA,
  };
}

/**
 * Obtient le taux de TVA selon le département et le type
 */
export function getTauxTVA(
  departement: DepartementDOM | string,
  type: TypeTVA
): number {
  const config = TVA_DOM[departement as DepartementDOM];
  
  if (!config || type === 'exonere') {
    return 0;
  }
  
  switch (type) {
    case 'normal':
      return config.tauxNormal;
    case 'reduit':
      return config.tauxReduit;
    case 'super_reduit':
      return config.tauxSuperReduit;
    default:
      return 0;
  }
}

/**
 * Génère un numéro de devis unique
 */
export function genererNumeroDevis(prefix: string = 'DEV'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Génère les mentions légales pour un devis DOM
 */
export function genererMentionsLegales(
  artisan: Artisan,
  departement: DepartementDOM | string
): string[] {
  const mentions: string[] = [];
  
  // Mention SIRET obligatoire
  mentions.push(`SIRET: ${artisan.siret}`);
  
  // Mention assurance décennale si applicable
  if (artisan.assuranceDecennale) {
    mentions.push(
      `Assurance décennale: ${artisan.assuranceDecennale.compagnie} - N° ${artisan.assuranceDecennale.numero}`
    );
  }
  
  // Mention exonération TVA Article 293B
  if (artisan.exonerationTVA) {
    mentions.push(
      artisan.mentionExonerationTVA ||
        'TVA non applicable, article 293 B du CGI'
    );
  }
  
  // Mention spécifique DOM
  const config = TVA_DOM[departement as DepartementDOM];
  if (config) {
    if (config.tauxNormal === 0) {
      mentions.push(`Territoire exonéré de TVA (${config.nom})`);
    } else {
      mentions.push(
        `Taux de TVA applicables en ${config.nom}: ${config.tauxNormal}% (normal), ${config.tauxReduit}% (réduit)`
      );
    }
  }
  
  // Mentions légales standard devis
  mentions.push('Devis valable 30 jours à compter de sa date d\'émission');
  mentions.push('Prix exprimés en euros');
  
  return mentions;
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
