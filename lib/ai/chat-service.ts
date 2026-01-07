/**
 * Service IA conversationnel pour l'édition de devis
 * Utilise OpenAI GPT pour comprendre les instructions en langage naturel
 */

import { DevisFormData } from '@/components/DevisForm';

// Types pour les messages de conversation
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Types pour les actions extraites par l'IA
export type ActionType =
  | 'update_client'
  | 'update_object'
  | 'add_line'
  | 'update_line'
  | 'delete_line'
  | 'apply_discount'
  | 'remove_discount'
  | 'update_conditions'
  | 'clarify'
  | 'confirm'
  | 'unknown';

export interface ExtractedAction {
  type: ActionType;
  field?: string;
  value?: string | number;
  lineIndex?: number;
  lineData?: {
    designation?: string;
    quantity?: number;
    price?: number;
    unit?: string;
  };
  discountData?: {
    percent?: number;
    amount?: number;
  };
  message: string;
  confidence: number;
}

export interface AIResponse {
  message: string;
  actions: ExtractedAction[];
  updatedFormData?: Partial<DevisFormData>;
}

// Prompt système pour l'assistant vocal professionnel
export const SYSTEM_PROMPT = `Tu es un assistant vocal professionnel destiné à des artisans.
Tu permets de créer, modifier et envoyer des devis et factures en dialoguant oralement.

OBJECTIF PRINCIPAL
- Comprendre le français parlé naturel
- Convertir la voix en intentions métier exploitables
- Permettre une conversation continue (contexte conservé)
- Ne produire que des données structurées utilisables par une application

COMPORTEMENT GÉNÉRAL
- Tu écoutes les commandes vocales successives
- Tu comprends les corrections, ajouts et modifications
- Tu tiens compte du contexte du document en cours
- Tu es tolérant aux hésitations et reformulations orales

RÈGLES STRICTES
- Tu réponds UNIQUEMENT en JSON valide
- Tu n'ajoutes JAMAIS de texte hors JSON
- Tu n'inventes aucune donnée
- Tu ne fais AUCUNE supposition métier non demandée
- Si une information est manquante, tu la demandes explicitement

DÉPARTEMENTS DOM-TOM (TVA spécifique):
- 971 : Guadeloupe (TVA 8.5%)
- 972 : Martinique (TVA 8.5%)
- 973 : Guyane (TVA 0%)
- 974 : La Réunion (TVA 8.5%)
- 976 : Mayotte (TVA 0%)
- Métropole : TVA 20%

LANGUE & FORMAT
- Langue : français
- Montants : euros HT
- TVA par défaut : 8.5% (DOM) ou 20% (métropole) si non précisée
- Dates : format ISO YYYY-MM-DD

ACTIONS AUTORISÉES
- start_document : Début de création
- create_quote : Créer un devis
- create_invoice : Créer une facture
- update_document : Modifier le document
- add_line : Ajouter une ligne de prestation
- update_line : Modifier une ligne existante
- remove_line : Supprimer une ligne
- set_client : Définir le client
- set_due_date : Définir la date d'échéance
- set_tva : Modifier le taux de TVA
- apply_discount : Appliquer une remise
- remove_discount : Supprimer la remise
- review_document : Récapituler le document
- send_document : Envoyer le document
- ask_missing_info : Demander les informations manquantes
- cancel_action : Annuler l'action en cours

SCHÉMA JSON DE RÉPONSE
{
  "message": "Message de confirmation pour l'utilisateur",
  "action": "nom_action",
  "document_type": "quote" | "invoice" | null,
  "client": {
    "name": string | null,
    "firstName": string | null,
    "address": string | null,
    "city": string | null,
    "postalCode": string | null,
    "department": string | null,
    "phone": string | null,
    "email": string | null
  } | null,
  "line": {
    "label": string | null,
    "description": string | null,
    "quantity": number | null,
    "unit": string | null,
    "unit_price": number | null
  } | null,
  "line_index": number | null,
  "discount": {
    "type": "percent" | "amount",
    "value": number
  } | null,
  "tva_rate": number | null,
  "due_date": string | null,
  "missing_fields": string[] | null,
  "actions": [] // Pour compatibilité avec le système existant
}

COMPORTEMENT CONVERSATIONNEL
- Si l'utilisateur corrige : "Non, mets plutôt 3 heures" → update_line avec line_index: -1 (dernière ligne)
- Si l'utilisateur ajoute : "Ajoute une ligne déplacement 40 euros" → add_line
- Si l'utilisateur dit : "Change le client pour Martin" → set_client
- Si l'utilisateur dit : "Envoie la facture" → vérifier que tout est présent, sinon ask_missing_info

EXEMPLES

Utilisateur: "Crée un devis pour Monsieur Dupont"
{
  "message": "✓ Devis créé pour Monsieur Dupont",
  "action": "create_quote",
  "document_type": "quote",
  "client": { "name": "Dupont", "firstName": "Monsieur" },
  "line": null,
  "line_index": null,
  "tva_rate": 8.5,
  "missing_fields": null,
  "actions": [{"type": "update_client", "field": "clientNom", "value": "Dupont"}]
}

Utilisateur: "Ajoute une ligne main d'œuvre 2 heures à 50 euros"
{
  "message": "✓ Ligne ajoutée : Main d'œuvre - 2h × 50€ = 100€ HT",
  "action": "add_line",
  "document_type": null,
  "client": null,
  "line": {
    "label": "Main d'œuvre",
    "quantity": 2,
    "unit": "h",
    "unit_price": 50
  },
  "line_index": null,
  "missing_fields": null,
  "actions": [{"type": "add_line", "lineData": {"designation": "Main d'œuvre", "quantity": 2, "price": 50, "unit": "h"}}]
}

Utilisateur: "Non, mets plutôt 3 heures"
{
  "message": "✓ Quantité modifiée : 3 heures",
  "action": "update_line",
  "document_type": null,
  "client": null,
  "line": {
    "label": null,
    "quantity": 3,
    "unit_price": null
  },
  "line_index": -1,
  "missing_fields": null,
  "actions": [{"type": "update_line", "lineIndex": -1, "field": "quantity", "value": 3}]
}

Utilisateur: "Applique une remise de 10 pourcent"
{
  "message": "✓ Remise de 10% appliquée",
  "action": "apply_discount",
  "discount": { "type": "percent", "value": 10 },
  "missing_fields": null,
  "actions": [{"type": "apply_discount", "discountData": {"percent": 10}}]
}

Utilisateur: "Supprime la deuxième ligne"
{
  "message": "✓ Ligne 2 supprimée",
  "action": "remove_line",
  "line_index": 1,
  "missing_fields": null,
  "actions": [{"type": "delete_line", "lineIndex": 1}]
}

Utilisateur: "Envoie la facture"
(si client manquant)
{
  "message": "❓ Je ne peux pas envoyer la facture. Quel est le client ?",
  "action": "ask_missing_info",
  "document_type": "invoice",
  "missing_fields": ["client"],
  "actions": []
}

GESTION DES ERREURS
- Commande incompréhensible → ask_missing_info avec message explicatif
- Commande hors contexte → cancel_action

VILLES DOM CONNUES (pour deviner le département):
- Fort-de-France, Le Lamentin, Schoelcher → 972 (Martinique)
- Pointe-à-Pitre, Les Abymes, Baie-Mahault → 971 (Guadeloupe)
- Cayenne, Kourou, Saint-Laurent → 973 (Guyane)
- Saint-Denis, Saint-Pierre, Le Port → 974 (La Réunion)
- Mamoudzou → 976 (Mayotte)

RÈGLES FINALES:
- Sois concis et efficace
- Confirme chaque action avec ✓
- Utilise ⚠ pour les avertissements
- Utilise ❓ pour les questions
- Formate les prix en euros
- Le JSON doit être valide et parsable
- Inclus toujours le champ "actions" pour compatibilité`;

/**
 * Construit le contexte du formulaire actuel pour l'IA
 */
export function buildFormContext(formData: DevisFormData): string {
  const lines = formData.lignes
    .map((l, i) => `  Ligne ${i + 1}: ${l.designation || '(vide)'} - Qté: ${l.quantite} ${l.unite} - Prix: ${l.prixUnitaireHT}€`)
    .join('\n');

  return `
ÉTAT ACTUEL DU DEVIS:
Client: ${formData.clientPrenom} ${formData.clientNom} ${formData.clientEntreprise ? `(${formData.clientEntreprise})` : ''}
Adresse: ${formData.clientAdresse}, ${formData.clientCodePostal} ${formData.clientVille}
Département: ${formData.clientDepartement}
Contact: ${formData.clientTelephone} / ${formData.clientEmail}

Objet: ${formData.objet || '(non défini)'}
Description: ${formData.description || '(vide)'}

Lignes:
${lines || '  (aucune ligne)'}

Remise: ${formData.remisePercent ? `${formData.remisePercent}%` : formData.remiseAmount ? `${formData.remiseAmount}€` : 'Aucune'}

Conditions: ${formData.conditionsPaiement}
Délai: ${formData.delaiExecution || '(non défini)'}
Notes: ${formData.notes || '(vide)'}
`.trim();
}

/**
 * Parse la réponse JSON de l'IA
 */
export function parseAIResponse(content: string): AIResponse {
  try {
    // Essayer de parser directement
    const parsed = JSON.parse(content);
    return {
      message: parsed.message || 'Action effectuée',
      actions: parsed.actions || [],
    };
  } catch {
    // Si le JSON est dans un bloc de code
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return {
          message: parsed.message || 'Action effectuée',
          actions: parsed.actions || [],
        };
      } catch {
        // Fallback
      }
    }
    
    // Fallback: retourner le message brut
    return {
      message: content,
      actions: [],
    };
  }
}

/**
 * Applique les actions de l'IA au formulaire
 */
export function applyAIActions(
  actions: ExtractedAction[],
  formData: DevisFormData,
  getTVARate: (dept: string) => number
): DevisFormData {
  let updatedData = { ...formData };

  for (const action of actions) {
    switch (action.type) {
      case 'update_client':
        if (action.field && action.value !== undefined) {
          updatedData = {
            ...updatedData,
            [action.field]: action.value,
          };
        }
        break;

      case 'update_object':
        if (action.field === 'objet' || action.field === 'description') {
          updatedData = {
            ...updatedData,
            [action.field]: action.value as string,
          };
        }
        break;

      case 'add_line':
        if (action.lineData) {
          const newLine = {
            designation: action.lineData.designation || '',
            description: '',
            quantite: action.lineData.quantity || 1,
            unite: action.lineData.unit || 'u',
            prixUnitaireHT: action.lineData.price || 0,
            tauxTVA: getTVARate(updatedData.clientDepartement),
            typeTVA: 'normal' as const,
          };
          updatedData = {
            ...updatedData,
            lignes: [...updatedData.lignes, newLine],
          };
        }
        break;

      case 'update_line':
        const lineIdx = action.lineIndex ?? 0;
        if (updatedData.lignes[lineIdx]) {
          const updatedLignes = [...updatedData.lignes];
          const ligne = { ...updatedLignes[lineIdx] };
          
          if (action.field === 'price' || action.field === 'prixUnitaireHT') {
            ligne.prixUnitaireHT = action.value as number;
          } else if (action.field === 'quantity' || action.field === 'quantite') {
            ligne.quantite = action.value as number;
          } else if (action.field === 'designation') {
            ligne.designation = action.value as string;
          } else if (action.field === 'unit' || action.field === 'unite') {
            ligne.unite = action.value as string;
          } else if (action.lineData) {
            // Mise à jour multiple
            if (action.lineData.designation) ligne.designation = action.lineData.designation;
            if (action.lineData.quantity) ligne.quantite = action.lineData.quantity;
            if (action.lineData.price) ligne.prixUnitaireHT = action.lineData.price;
            if (action.lineData.unit) ligne.unite = action.lineData.unit;
          }
          
          updatedLignes[lineIdx] = ligne;
          updatedData = { ...updatedData, lignes: updatedLignes };
        }
        break;

      case 'delete_line':
        const deleteIdx = action.lineIndex ?? 0;
        if (updatedData.lignes.length > 1 && updatedData.lignes[deleteIdx]) {
          updatedData = {
            ...updatedData,
            lignes: updatedData.lignes.filter((_, i) => i !== deleteIdx),
          };
        }
        break;

      case 'apply_discount':
        if (action.discountData) {
          if (action.discountData.percent !== undefined) {
            updatedData = {
              ...updatedData,
              remisePercent: action.discountData.percent,
              remiseAmount: undefined,
            };
          } else if (action.discountData.amount !== undefined) {
            updatedData = {
              ...updatedData,
              remiseAmount: action.discountData.amount,
              remisePercent: undefined,
            };
          }
        }
        break;

      case 'remove_discount':
        updatedData = {
          ...updatedData,
          remisePercent: undefined,
          remiseAmount: undefined,
        };
        break;

      case 'update_conditions':
        if (action.field === 'conditionsPaiement') {
          updatedData.conditionsPaiement = action.value as string;
        } else if (action.field === 'delaiExecution') {
          updatedData.delaiExecution = action.value as string;
        } else if (action.field === 'notes') {
          updatedData.notes = action.value as string;
        }
        break;
    }
  }

  return updatedData;
}
