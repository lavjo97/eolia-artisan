/**
 * Parseur d'intentions vocales pour l'édition conversationnelle de devis
 * Analyse le texte dicté et extrait les intentions + données
 */

import { DevisFormData } from '@/components/DevisForm';
import { TypeTVA } from '@/lib/types';

// Types d'intentions possibles
export type IntentType =
  | 'set_client_name'
  | 'set_client_firstname'
  | 'set_client_company'
  | 'set_client_address'
  | 'set_client_city'
  | 'set_client_postal'
  | 'set_client_phone'
  | 'set_client_email'
  | 'set_object'
  | 'set_description'
  | 'add_line'
  | 'modify_line_designation'
  | 'modify_line_quantity'
  | 'modify_line_price'
  | 'modify_line_unit'
  | 'delete_line'
  | 'delete_line_by_name'
  | 'apply_discount_percent'
  | 'apply_discount_amount'
  | 'remove_discount'
  | 'modify_price_by_name'
  | 'set_payment_conditions'
  | 'set_delay'
  | 'set_notes'
  | 'unknown';

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  data: Record<string, string | number>;
  originalText: string;
  suggestion?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: ParsedIntent;
  applied?: boolean;
}

// Patterns de reconnaissance (français)
const PATTERNS: { type: IntentType; patterns: RegExp[]; extract: (match: RegExpMatchArray, text: string) => Record<string, string | number> }[] = [
  // Client - Nom
  {
    type: 'set_client_name',
    patterns: [
      /(?:le\s+)?client\s+(?:s['']appelle|est|se\s+nomme)\s+(.+)/i,
      /nom\s+(?:du\s+)?client\s*[:\s]+(.+)/i,
      /(?:c['']est\s+)?(?:pour\s+)?(?:monsieur|madame|m\.?|mme\.?)\s+(.+)/i,
      /nom\s*[:\s]+(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Client - Prénom
  {
    type: 'set_client_firstname',
    patterns: [
      /prénom\s+(?:du\s+)?client\s*[:\s]+(.+)/i,
      /prénom\s*[:\s]+(.+)/i,
      /(?:son\s+)?prénom\s+(?:c['']est|est)\s+(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Client - Entreprise
  {
    type: 'set_client_company',
    patterns: [
      /(?:l[''])?entreprise\s+(?:s['']appelle|est|c['']est)\s+(.+)/i,
      /(?:pour\s+)?(?:la\s+)?société\s+(.+)/i,
      /entreprise\s*[:\s]+(.+)/i,
      /société\s*[:\s]+(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Client - Adresse
  {
    type: 'set_client_address',
    patterns: [
      /(?:l[''])?adresse\s+(?:c['']est|est)\s+(?:le\s+)?(.+)/i,
      /(?:il\s+)?habite\s+(?:au\s+)?(.+)/i,
      /adresse\s*[:\s]+(.+)/i,
      /(?:au\s+)?(\d+.+(?:rue|avenue|boulevard|chemin|impasse|allée|place|route).+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Client - Ville
  {
    type: 'set_client_city',
    patterns: [
      /ville\s*[:\s]+(.+)/i,
      /(?:à|sur)\s+(.+?)(?:\s+en\s+|$)/i,
      /(?:la\s+)?ville\s+(?:c['']est|est)\s+(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Client - Code postal
  {
    type: 'set_client_postal',
    patterns: [
      /code\s+postal\s*[:\s]+(\d{5})/i,
      /cp\s*[:\s]+(\d{5})/i,
      /(\d{5})\s+(.+)/i, // "97200 Fort-de-France"
    ],
    extract: (match) => ({ value: match[1] }),
  },
  // Client - Téléphone
  {
    type: 'set_client_phone',
    patterns: [
      /(?:son\s+)?(?:numéro\s+(?:de\s+)?)?téléphone\s*[:\s]+(.+)/i,
      /(?:le\s+)?(?:numéro|tel|tél)\s*[:\s]+(.+)/i,
      /(?:appeler\s+au|joignable\s+au)\s+(.+)/i,
    ],
    extract: (match) => ({ value: cleanPhone(match[1]) }),
  },
  // Client - Email
  {
    type: 'set_client_email',
    patterns: [
      /(?:son\s+)?(?:adresse\s+)?(?:e-?mail|mail|courriel)\s*[:\s]+(.+)/i,
      /([a-z0-9._%+-]+\s*(?:arobase|@|at)\s*[a-z0-9.-]+\s*(?:point|\.)\s*[a-z]{2,})/i,
    ],
    extract: (match) => ({ value: cleanEmail(match[1]) }),
  },
  // Objet du devis
  {
    type: 'set_object',
    patterns: [
      /(?:l[''])?objet\s+(?:du\s+devis\s+)?(?:c['']est|est)\s+(.+)/i,
      /objet\s*[:\s]+(.+)/i,
      /devis\s+pour\s+(.+)/i,
      /(?:c['']est\s+)?(?:pour\s+)?(?:une?\s+)?(?:installation|réparation|fourniture|travaux)\s+(?:de\s+|d[''])?(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Description
  {
    type: 'set_description',
    patterns: [
      /description\s*[:\s]+(.+)/i,
      /(?:les\s+)?(?:travaux\s+)?(?:comprennent|incluent)\s+(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Ajouter une ligne
  {
    type: 'add_line',
    patterns: [
      /ajoute(?:r)?\s+(?:une\s+)?ligne\s+(?:pour\s+)?(.+?)\s+(?:à|a|au\s+prix\s+de)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?/i,
      /(?:nouvelle\s+)?ligne\s*[:\s]+(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?/i,
      /ajoute(?:r)?\s+(.+?)\s+(?:à|a|pour)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?/i,
      /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s+(?:pour|de)\s+(.+)/i,
    ],
    extract: (match, text) => {
      // Détecter l'ordre des captures
      const isReversed = /^\d/.test(match[1]);
      const designation = cleanText(isReversed ? match[2] : match[1]);
      const price = parsePrice(isReversed ? match[1] : match[2]);
      
      // Essayer de détecter la quantité
      const qtyMatch = text.match(/(\d+)\s*(?:unités?|pièces?|heures?|jours?|m(?:ètres?)?²?)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      
      return { designation, price, quantity };
    },
  },
  // Modifier le prix d'une ligne
  {
    type: 'modify_line_price',
    patterns: [
      /(?:change(?:r)?|modifie(?:r)?|met(?:s|tre)?)\s+(?:le\s+)?prix\s+(?:de\s+)?(?:la\s+)?(?:ligne\s+)?(\d+)?\s*(?:à|a)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?/i,
      /prix\s+(?:de\s+)?(?:la\s+)?(?:ligne\s+)?(\d+)?\s*[:\s]+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?/i,
      /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s+(?:pour\s+)?(?:la\s+)?ligne\s+(\d+)/i,
    ],
    extract: (match) => {
      const hasLineNumber = match[1] && /^\d+$/.test(match[1]) && parseFloat(match[1]) < 100;
      return {
        lineIndex: hasLineNumber ? parseInt(match[1]) - 1 : 0,
        price: parsePrice(hasLineNumber ? match[2] : match[1]),
      };
    },
  },
  // Modifier la quantité
  {
    type: 'modify_line_quantity',
    patterns: [
      /(?:change(?:r)?|modifie(?:r)?|met(?:s|tre)?)\s+(?:la\s+)?quantité\s+(?:de\s+)?(?:la\s+)?(?:ligne\s+)?(\d+)?\s*(?:à|a)\s+(\d+)/i,
      /quantité\s+(?:de\s+)?(?:la\s+)?(?:ligne\s+)?(\d+)?\s*[:\s]+(\d+)/i,
      /(\d+)\s*(?:unités?|pièces?)\s+(?:pour\s+)?(?:la\s+)?ligne\s+(\d+)?/i,
    ],
    extract: (match) => ({
      lineIndex: match[2] ? parseInt(match[1]) - 1 : 0,
      quantity: parseInt(match[2] || match[1]),
    }),
  },
  // Modifier la désignation d'une ligne
  {
    type: 'modify_line_designation',
    patterns: [
      /(?:change(?:r)?|modifie(?:r)?|renomme(?:r)?)\s+(?:la\s+)?(?:ligne\s+)?(\d+)\s+(?:en|pour|par)\s+(.+)/i,
      /(?:la\s+)?ligne\s+(\d+)\s+(?:devient|c['']est)\s+(.+)/i,
    ],
    extract: (match) => ({
      lineIndex: parseInt(match[1]) - 1,
      designation: cleanText(match[2]),
    }),
  },
  // Supprimer une ligne par numéro
  {
    type: 'delete_line',
    patterns: [
      /(?:supprime(?:r)?|efface(?:r)?|enlève(?:r)?|retire(?:r)?)\s+(?:la\s+)?ligne\s+(?:numéro\s+)?(\d+)/i,
      /ligne\s+(\d+)\s+(?:supprimée|effacée|à\s+supprimer)/i,
      /(?:enlève|supprime|retire)\s+la\s+(\d+)(?:ème|ere|ère)?\s+ligne/i,
    ],
    extract: (match) => ({ lineIndex: parseInt(match[1]) - 1 }),
  },
  // Supprimer une ligne par nom
  {
    type: 'delete_line_by_name',
    patterns: [
      /(?:supprime(?:r)?|efface(?:r)?|enlève(?:r)?|retire(?:r)?)\s+(?:le\s+|la\s+|l[''])?(.+?)(?:\s+du\s+devis)?$/i,
      /(?:enlève|supprime|retire)\s+(.+)/i,
    ],
    extract: (match) => ({ designation: cleanText(match[1]) }),
  },
  // Appliquer une remise en pourcentage
  {
    type: 'apply_discount_percent',
    patterns: [
      /(?:applique(?:r)?|fai(?:s|re)|met(?:s|tre)?)\s+(?:une\s+)?(?:remise|réduction|ristourne|rabais)\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(?:%|pour\s*cent|pourcent)/i,
      /(?:remise|réduction|ristourne|rabais)\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(?:%|pour\s*cent|pourcent)/i,
      /(\d+(?:[.,]\d+)?)\s*(?:%|pour\s*cent|pourcent)\s+(?:de\s+)?(?:remise|réduction|ristourne|rabais)/i,
      /(?:moins|-)?\s*(\d+(?:[.,]\d+)?)\s*(?:%|pour\s*cent|pourcent)/i,
    ],
    extract: (match) => ({ percent: parsePrice(match[1]) }),
  },
  // Appliquer une remise en euros
  {
    type: 'apply_discount_amount',
    patterns: [
      /(?:applique(?:r)?|fai(?:s|re)|met(?:s|tre)?)\s+(?:une\s+)?(?:remise|réduction|ristourne|rabais)\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i,
      /(?:remise|réduction|ristourne|rabais)\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i,
      /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)\s+(?:de\s+)?(?:remise|réduction|ristourne|rabais)/i,
      /(?:dédui(?:s|re)|enlève(?:r)?|retire(?:r)?)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i,
    ],
    extract: (match) => ({ amount: parsePrice(match[1]) }),
  },
  // Supprimer la remise
  {
    type: 'remove_discount',
    patterns: [
      /(?:supprime(?:r)?|enlève(?:r)?|retire(?:r)?|annule(?:r)?)\s+(?:la\s+)?(?:remise|réduction|ristourne|rabais)/i,
      /(?:pas\s+de|sans|aucune?)\s+(?:remise|réduction|ristourne|rabais)/i,
      /(?:remise|réduction)\s+(?:à\s+)?(?:zéro|0)/i,
    ],
    extract: () => ({}),
  },
  // Modifier le prix par nom de produit
  {
    type: 'modify_price_by_name',
    patterns: [
      /(?:change(?:r)?|modifie(?:r)?|met(?:s|tre)?)\s+(?:le\s+)?prix\s+(?:du|de\s+la|de\s+l['']|des?)\s+(.+?)\s+(?:à|a)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)?/i,
      /(?:le\s+)?(.+?)\s+(?:à|a|passe\s+à)\s+(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i,
    ],
    extract: (match) => ({
      designation: cleanText(match[1]),
      price: parsePrice(match[2]),
    }),
  },
  // Conditions de paiement
  {
    type: 'set_payment_conditions',
    patterns: [
      /conditions?\s+(?:de\s+)?paiement\s*[:\s]+(.+)/i,
      /paiement\s+(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
  // Délai d'exécution
  {
    type: 'set_delay',
    patterns: [
      /délai\s+(?:d['']exécution\s+)?(?:de\s+)?(.+)/i,
      /(?:travaux\s+)?(?:en|dans|sous)\s+(\d+)\s*(jours?|semaines?|mois)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1] + (match[2] || '')) }),
  },
  // Notes
  {
    type: 'set_notes',
    patterns: [
      /note(?:s)?\s*[:\s]+(.+)/i,
      /(?:à\s+)?noter\s*[:\s]+(.+)/i,
      /observation(?:s)?\s*[:\s]+(.+)/i,
    ],
    extract: (match) => ({ value: cleanText(match[1]) }),
  },
];

// Fonctions utilitaires
function cleanText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?]+$/, '');
}

function cleanPhone(phone: string): string {
  return phone
    .replace(/\s+/g, '')
    .replace(/[.-]/g, '')
    .replace(/^0/, '+590 ') // Préfixe DOM par défaut
    .trim();
}

function cleanEmail(email: string): string {
  return email
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/arobase|at/gi, '@')
    .replace(/point/gi, '.');
}

function parsePrice(price: string): number {
  return parseFloat(price.replace(',', '.')) || 0;
}

/**
 * Parse une phrase vocale et extrait l'intention
 */
export function parseVoiceIntent(text: string): ParsedIntent {
  // Note: normalizedText kept for future case-insensitive matching
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const normalizedText = text.trim().toLowerCase();
  
  for (const pattern of PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = text.match(regex);
      if (match) {
        return {
          type: pattern.type,
          confidence: 0.8,
          data: pattern.extract(match, text),
          originalText: text,
        };
      }
    }
  }
  
  // Intention non reconnue - essayer de deviner
  return guessIntent(text);
}

/**
 * Tente de deviner l'intention pour les textes non reconnus
 */
function guessIntent(text: string): ParsedIntent {
  const lower = text.toLowerCase();
  
  // Si ça ressemble à un email
  if (lower.includes('@') || lower.includes('arobase')) {
    return {
      type: 'set_client_email',
      confidence: 0.5,
      data: { value: cleanEmail(text) },
      originalText: text,
      suggestion: 'Est-ce l\'email du client ?',
    };
  }
  
  // Si ça ressemble à un numéro de téléphone
  if (/\d{10}|\d{2}\s\d{2}/.test(text)) {
    return {
      type: 'set_client_phone',
      confidence: 0.5,
      data: { value: cleanPhone(text) },
      originalText: text,
      suggestion: 'Est-ce le téléphone du client ?',
    };
  }
  
  // Si ça contient un prix
  if (/\d+(?:[.,]\d+)?\s*(?:€|euros?)/i.test(text)) {
    const priceMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    return {
      type: 'add_line',
      confidence: 0.4,
      data: { 
        designation: text.replace(/\d+(?:[.,]\d+)?\s*(?:€|euros?)/gi, '').trim(),
        price: priceMatch ? parsePrice(priceMatch[1]) : 0,
        quantity: 1,
      },
      originalText: text,
      suggestion: 'Voulez-vous ajouter cette ligne au devis ?',
    };
  }
  
  // Par défaut, considérer comme une désignation de ligne
  return {
    type: 'unknown',
    confidence: 0.2,
    data: { value: text },
    originalText: text,
    suggestion: 'Je n\'ai pas compris. Pouvez-vous reformuler ?',
  };
}

/**
 * Applique une intention au formulaire de devis
 */
export function applyIntentToForm(
  intent: ParsedIntent,
  formData: DevisFormData,
  getDepartmentTVA: (dept: string, type: TypeTVA) => number
): { updatedData: DevisFormData; message: string } {
  const data = { ...formData };
  let message = '';
  
  switch (intent.type) {
    case 'set_client_name':
      data.clientNom = intent.data.value as string;
      message = `✓ Nom du client : ${data.clientNom}`;
      break;
      
    case 'set_client_firstname':
      data.clientPrenom = intent.data.value as string;
      message = `✓ Prénom du client : ${data.clientPrenom}`;
      break;
      
    case 'set_client_company':
      data.clientEntreprise = intent.data.value as string;
      message = `✓ Entreprise : ${data.clientEntreprise}`;
      break;
      
    case 'set_client_address':
      data.clientAdresse = intent.data.value as string;
      message = `✓ Adresse : ${data.clientAdresse}`;
      break;
      
    case 'set_client_city':
      data.clientVille = intent.data.value as string;
      message = `✓ Ville : ${data.clientVille}`;
      break;
      
    case 'set_client_postal':
      data.clientCodePostal = intent.data.value as string;
      message = `✓ Code postal : ${data.clientCodePostal}`;
      break;
      
    case 'set_client_phone':
      data.clientTelephone = intent.data.value as string;
      message = `✓ Téléphone : ${data.clientTelephone}`;
      break;
      
    case 'set_client_email':
      data.clientEmail = intent.data.value as string;
      message = `✓ Email : ${data.clientEmail}`;
      break;
      
    case 'set_object':
      data.objet = intent.data.value as string;
      message = `✓ Objet du devis : ${data.objet}`;
      break;
      
    case 'set_description':
      data.description = intent.data.value as string;
      message = `✓ Description mise à jour`;
      break;
      
    case 'add_line':
      const newLine = {
        designation: intent.data.designation as string,
        description: '',
        quantite: (intent.data.quantity as number) || 1,
        unite: 'u',
        prixUnitaireHT: intent.data.price as number,
        tauxTVA: getDepartmentTVA(data.clientDepartement, 'normal'),
        typeTVA: 'normal' as TypeTVA,
      };
      data.lignes = [...data.lignes, newLine];
      message = `✓ Ligne ajoutée : ${newLine.designation} - ${newLine.prixUnitaireHT}€`;
      break;
      
    case 'modify_line_price':
      const priceIndex = intent.data.lineIndex as number;
      if (data.lignes[priceIndex]) {
        data.lignes = [...data.lignes];
        data.lignes[priceIndex] = {
          ...data.lignes[priceIndex],
          prixUnitaireHT: intent.data.price as number,
        };
        message = `✓ Prix ligne ${priceIndex + 1} : ${intent.data.price}€`;
      }
      break;
      
    case 'modify_line_quantity':
      const qtyIndex = intent.data.lineIndex as number;
      if (data.lignes[qtyIndex]) {
        data.lignes = [...data.lignes];
        data.lignes[qtyIndex] = {
          ...data.lignes[qtyIndex],
          quantite: intent.data.quantity as number,
        };
        message = `✓ Quantité ligne ${qtyIndex + 1} : ${intent.data.quantity}`;
      }
      break;
      
    case 'modify_line_designation':
      const desigIndex = intent.data.lineIndex as number;
      if (data.lignes[desigIndex]) {
        data.lignes = [...data.lignes];
        data.lignes[desigIndex] = {
          ...data.lignes[desigIndex],
          designation: intent.data.designation as string,
        };
        message = `✓ Ligne ${desigIndex + 1} renommée : ${intent.data.designation}`;
      }
      break;
      
    case 'delete_line':
      const deleteIndex = intent.data.lineIndex as number;
      if (data.lignes[deleteIndex] && data.lignes.length > 1) {
        const deletedName = data.lignes[deleteIndex].designation || `Ligne ${deleteIndex + 1}`;
        data.lignes = data.lignes.filter((_, i) => i !== deleteIndex);
        message = `✓ "${deletedName}" supprimé`;
      } else if (data.lignes.length <= 1) {
        message = `⚠ Impossible de supprimer la dernière ligne`;
      }
      break;
      
    case 'delete_line_by_name':
      const searchName = (intent.data.designation as string).toLowerCase();
      const foundIndex = data.lignes.findIndex(l => 
        l.designation.toLowerCase().includes(searchName) ||
        searchName.includes(l.designation.toLowerCase())
      );
      if (foundIndex >= 0 && data.lignes.length > 1) {
        const deletedDesig = data.lignes[foundIndex].designation;
        data.lignes = data.lignes.filter((_, i) => i !== foundIndex);
        message = `✓ "${deletedDesig}" supprimé`;
      } else if (foundIndex < 0) {
        message = `⚠ Produit "${intent.data.designation}" non trouvé`;
      } else {
        message = `⚠ Impossible de supprimer la dernière ligne`;
      }
      break;
      
    case 'apply_discount_percent':
      const discountPercent = intent.data.percent as number;
      data.remisePercent = discountPercent;
      data.remiseAmount = undefined;
      message = `✓ Remise de ${discountPercent}% appliquée`;
      break;
      
    case 'apply_discount_amount':
      const discountAmount = intent.data.amount as number;
      data.remiseAmount = discountAmount;
      data.remisePercent = undefined;
      message = `✓ Remise de ${discountAmount}€ appliquée`;
      break;
      
    case 'remove_discount':
      data.remisePercent = undefined;
      data.remiseAmount = undefined;
      message = `✓ Remise supprimée`;
      break;
      
    case 'modify_price_by_name':
      const productName = (intent.data.designation as string).toLowerCase();
      const productIndex = data.lignes.findIndex(l => 
        l.designation.toLowerCase().includes(productName) ||
        productName.includes(l.designation.toLowerCase())
      );
      if (productIndex >= 0) {
        data.lignes = [...data.lignes];
        data.lignes[productIndex] = {
          ...data.lignes[productIndex],
          prixUnitaireHT: intent.data.price as number,
        };
        message = `✓ Prix de "${data.lignes[productIndex].designation}" : ${intent.data.price}€`;
      } else {
        message = `⚠ Produit "${intent.data.designation}" non trouvé`;
      }
      break;
      
    case 'set_payment_conditions':
      data.conditionsPaiement = intent.data.value as string;
      message = `✓ Conditions de paiement : ${data.conditionsPaiement}`;
      break;
      
    case 'set_delay':
      data.delaiExecution = intent.data.value as string;
      message = `✓ Délai d'exécution : ${data.delaiExecution}`;
      break;
      
    case 'set_notes':
      data.notes = intent.data.value as string;
      message = `✓ Notes mises à jour`;
      break;
      
    default:
      message = intent.suggestion || '❓ Je n\'ai pas compris cette instruction.';
  }
  
  return { updatedData: data, message };
}

/**
 * Génère des exemples de commandes pour l'aide
 */
export function getVoiceExamples(): string[] {
  return [
    'Le client s\'appelle Jean Dupont',
    'Il habite au 15 rue des Palmiers à Fort-de-France',
    'Code postal 97200',
    'Objet : Installation chauffe-eau solaire',
    'Ajoute une ligne chauffe-eau 200L à 1500 euros',
    'Change le prix de la ligne 1 à 1800 euros',
    'Supprime la ligne 2',
    'Enlève le chauffe-eau',
    'Applique une remise de 10 pourcent',
    'Fais une réduction de 50 euros',
    'Change le prix du panneau à 900 euros',
    'Quantité : 2 unités',
    'Délai d\'exécution : 2 semaines',
  ];
}

/**
 * Commandes vocales rapides pour le tableau des lignes
 */
export function getQuickVoiceCommands(): { command: string; description: string }[] {
  return [
    { command: 'Ajoute [produit] à [prix] euros', description: 'Ajouter une ligne' },
    { command: 'Supprime la ligne [numéro]', description: 'Supprimer par numéro' },
    { command: 'Enlève [nom du produit]', description: 'Supprimer par nom' },
    { command: 'Remise de [X] pourcent', description: 'Appliquer % de remise' },
    { command: 'Réduction de [X] euros', description: 'Appliquer remise fixe' },
    { command: 'Prix du [produit] à [prix]', description: 'Modifier un prix' },
  ];
}
