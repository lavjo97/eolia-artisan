'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Devis,
  Client,
  Artisan,
  LigneDevis,
  generateId,
  genererNumeroDevis,
  calculerLigne,
  calculerTotauxDevis,
  genererMentionsLegales,
  NouveauDevisData,
  DepartementDOM,
} from '@/lib/types';

// Schéma de la base de données IndexedDB
interface EoliaDB extends DBSchema {
  devis: {
    key: string;
    value: Devis;
    indexes: {
      'by-date': Date;
      'by-client': string;
      'by-statut': string;
    };
  };
  clients: {
    key: string;
    value: Client;
    indexes: {
      'by-nom': string;
    };
  };
  artisans: {
    key: string;
    value: Artisan;
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
}

const DB_NAME = 'eolia-artisan-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<EoliaDB> | null = null;

/**
 * Initialise et retourne la connexion à la base de données
 */
export async function getDB(): Promise<IDBPDatabase<EoliaDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<EoliaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store pour les devis
      if (!db.objectStoreNames.contains('devis')) {
        const devisStore = db.createObjectStore('devis', { keyPath: 'id' });
        devisStore.createIndex('by-date', 'date');
        devisStore.createIndex('by-client', 'clientId');
        devisStore.createIndex('by-statut', 'statut');
      }

      // Store pour les clients
      if (!db.objectStoreNames.contains('clients')) {
        const clientsStore = db.createObjectStore('clients', { keyPath: 'id' });
        clientsStore.createIndex('by-nom', 'nom');
      }

      // Store pour les artisans
      if (!db.objectStoreNames.contains('artisans')) {
        db.createObjectStore('artisans', { keyPath: 'id' });
      }

      // Store pour les paramètres
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ==================== DEVIS ====================

/**
 * Récupère tous les devis
 */
export async function getAllDevis(): Promise<Devis[]> {
  const db = await getDB();
  const devis = await db.getAll('devis');
  return devis.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Récupère un devis par son ID
 */
export async function getDevisById(id: string): Promise<Devis | undefined> {
  const db = await getDB();
  return db.get('devis', id);
}

/**
 * Crée un nouveau devis
 */
export async function createDevis(data: NouveauDevisData): Promise<Devis> {
  const db = await getDB();
  const now = new Date();

  // Récupérer l'artisan
  const artisan = await getArtisanById(data.artisanId);
  if (!artisan) {
    throw new Error('Artisan non trouvé');
  }

  // Gérer le client (nouveau ou existant)
  let clientId = data.clientId;
  let client: Client | undefined;

  if (data.clientData && !clientId) {
    client = {
      id: generateId(),
      ...data.clientData,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('clients', client);
    clientId = client.id;
  } else if (clientId) {
    client = await getClientById(clientId);
  }

  // Calculer les lignes avec les montants
  const lignes: LigneDevis[] = data.lignes.map((ligne) => {
    const montants = calculerLigne(ligne.quantite, ligne.prixUnitaireHT, ligne.tauxTVA);
    return {
      id: generateId(),
      ...ligne,
      ...montants,
    };
  });

  // Calculer les totaux
  const totaux = calculerTotauxDevis(lignes);

  // Générer les mentions légales
  const departement = client?.departement || artisan.departement;
  const mentionsLegales = genererMentionsLegales(artisan, departement);

  // Créer le devis
  const devis: Devis = {
    id: generateId(),
    numero: genererNumeroDevis(),
    date: now,
    dateValidite: data.dateValidite || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    statut: 'brouillon',
    artisanId: data.artisanId,
    artisan,
    clientId: clientId || '',
    client,
    objet: data.objet,
    description: data.description,
    lignes,
    ...totaux,
    conditionsPaiement: data.conditionsPaiement,
    delaiExecution: data.delaiExecution,
    notes: data.notes,
    mentionsLegales,
    createdAt: now,
    updatedAt: now,
  };

  await db.put('devis', devis);
  return devis;
}

/**
 * Met à jour un devis existant
 */
export async function updateDevis(id: string, updates: Partial<Devis>): Promise<Devis> {
  const db = await getDB();
  const existing = await getDevisById(id);

  if (!existing) {
    throw new Error('Devis non trouvé');
  }

  // Si les lignes sont mises à jour, recalculer les totaux
  let totaux = {};
  if (updates.lignes) {
    const lignesCalculees = updates.lignes.map((ligne) => {
      if (ligne.montantHT === undefined) {
        const montants = calculerLigne(ligne.quantite, ligne.prixUnitaireHT, ligne.tauxTVA);
        return { ...ligne, ...montants };
      }
      return ligne;
    });
    updates.lignes = lignesCalculees;
    totaux = calculerTotauxDevis(lignesCalculees);
  }

  const devis: Devis = {
    ...existing,
    ...updates,
    ...totaux,
    updatedAt: new Date(),
  };

  await db.put('devis', devis);
  return devis;
}

/**
 * Supprime un devis
 */
export async function deleteDevis(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('devis', id);
}

// ==================== CLIENTS ====================

/**
 * Récupère tous les clients
 */
export async function getAllClients(): Promise<Client[]> {
  const db = await getDB();
  return db.getAll('clients');
}

/**
 * Récupère un client par son ID
 */
export async function getClientById(id: string): Promise<Client | undefined> {
  const db = await getDB();
  return db.get('clients', id);
}

/**
 * Crée ou met à jour un client
 */
export async function saveClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Client> {
  const db = await getDB();
  const now = new Date();

  const savedClient: Client = {
    id: client.id || generateId(),
    ...client,
    createdAt: client.id ? (await getClientById(client.id))?.createdAt || now : now,
    updatedAt: now,
  };

  await db.put('clients', savedClient);
  return savedClient;
}

/**
 * Supprime un client
 */
export async function deleteClient(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('clients', id);
}

// ==================== ARTISANS ====================

/**
 * Récupère tous les artisans
 */
export async function getAllArtisans(): Promise<Artisan[]> {
  const db = await getDB();
  return db.getAll('artisans');
}

/**
 * Récupère un artisan par son ID
 */
export async function getArtisanById(id: string): Promise<Artisan | undefined> {
  const db = await getDB();
  return db.get('artisans', id);
}

/**
 * Récupère l'artisan actif (premier configuré)
 */
export async function getActiveArtisan(): Promise<Artisan | undefined> {
  const artisans = await getAllArtisans();
  return artisans[0];
}

/**
 * Crée ou met à jour un artisan
 */
export async function saveArtisan(
  artisan: Omit<Artisan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Artisan> {
  const db = await getDB();
  const now = new Date();

  const savedArtisan: Artisan = {
    id: artisan.id || generateId(),
    ...artisan,
    createdAt: artisan.id ? (await getArtisanById(artisan.id))?.createdAt || now : now,
    updatedAt: now,
  };

  await db.put('artisans', savedArtisan);
  return savedArtisan;
}

// ==================== SETTINGS ====================

/**
 * Récupère un paramètre
 */
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const setting = await db.get('settings', key);
  return setting?.value as T | undefined;
}

/**
 * Enregistre un paramètre
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

// ==================== DONNÉES DE DÉMONSTRATION ====================

/**
 * Initialise des données de démonstration
 */
export async function initDemoData(): Promise<void> {
  const db = await getDB();

  // Vérifier si des données existent déjà
  const artisans = await getAllArtisans();
  if (artisans.length > 0) {
    return;
  }

  const now = new Date();

  // Créer un artisan de démonstration
  const artisan: Artisan = {
    id: 'artisan-demo',
    nom: 'Martin',
    prenom: 'Jean-Pierre',
    entreprise: 'JP Martin - Plomberie Chauffage',
    siret: '12345678901234',
    adresse: '15 rue des Hibiscus',
    codePostal: '97200',
    ville: 'Fort-de-France',
    departement: '972' as DepartementDOM,
    telephone: '0696 12 34 56',
    email: 'contact@jpmartin-plomberie.fr',
    assuranceDecennale: {
      numero: 'DEC-2024-123456',
      compagnie: 'AXA Assurances',
      dateValidite: new Date('2025-12-31'),
    },
    exonerationTVA: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.put('artisans', artisan);

  // Créer quelques clients de démonstration
  const clients: Client[] = [
    {
      id: 'client-demo-1',
      nom: 'Durand',
      prenom: 'Marie',
      adresse: '23 avenue des Palmiers',
      codePostal: '97200',
      ville: 'Fort-de-France',
      departement: '972',
      telephone: '0696 78 90 12',
      email: 'marie.durand@email.fr',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'client-demo-2',
      nom: 'SCI Les Alizés',
      entreprise: 'SCI Les Alizés',
      adresse: '45 boulevard Général de Gaulle',
      codePostal: '97190',
      ville: 'Le Gosier',
      departement: '971',
      telephone: '0590 84 56 78',
      email: 'contact@sci-alizes.fr',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const client of clients) {
    await db.put('clients', client);
  }

  console.log('Données de démonstration initialisées');
}

// ==================== HOOKS REACT ====================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer les devis
 */
export function useDevis() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDevis = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllDevis();
      setDevis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevis();
  }, [loadDevis]);

  return {
    devis,
    loading,
    error,
    refresh: loadDevis,
    create: createDevis,
    update: updateDevis,
    remove: deleteDevis,
  };
}

/**
 * Hook pour gérer les clients
 */
export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllClients();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return {
    clients,
    loading,
    error,
    refresh: loadClients,
    save: saveClient,
    remove: deleteClient,
  };
}

/**
 * Hook pour gérer l'artisan actif
 */
export function useArtisan() {
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadArtisan = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveArtisan();
      setArtisan(data || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArtisan();
  }, [loadArtisan]);

  const save = useCallback(async (data: Omit<Artisan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const saved = await saveArtisan(data);
    setArtisan(saved);
    return saved;
  }, []);

  return {
    artisan,
    loading,
    error,
    refresh: loadArtisan,
    save,
  };
}

/**
 * Hook pour initialiser les données
 */
export function useInitData() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initDemoData();
        setInitialized(true);
      } catch (err) {
        console.error('Erreur d\'initialisation:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return { initialized, loading };
}
