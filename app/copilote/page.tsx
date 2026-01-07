'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from '@/components/copilote/ChatPanel';
import { DevisPreview } from '@/components/copilote/DevisPreview';
import { SettingsModal, EntrepriseSettings } from '@/components/copilote/SettingsModal';
import { DevisFormData } from '@/components/DevisForm';
import { parseVoiceIntent, applyIntentToForm } from '@/lib/voice/intent-parser';
import { applyAIActions } from '@/lib/ai/chat-service';
import { getTauxTVA, DepartementDOM, TypeTVA } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Clé localStorage pour les paramètres
const SETTINGS_STORAGE_KEY = 'eolia_entreprise_settings';

// Données initiales du devis
const createInitialFormData = (): DevisFormData => ({
  clientNom: '',
  clientPrenom: '',
  clientEntreprise: '',
  clientAdresse: '',
  clientCodePostal: '',
  clientVille: '',
  clientDepartement: '972',
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
    tauxTVA: getTauxTVA('972', 'normal'),
    typeTVA: 'normal' as TypeTVA,
  }],
  remisePercent: undefined,
  remiseAmount: undefined,
  conditionsPaiement: 'Paiement à réception de facture',
  delaiExecution: '',
  notes: '',
});

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function CopilotePage() {
  const [formData, setFormData] = useState<DevisFormData>(createInitialFormData);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  
  // État pour la modal de paramètres
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [entrepriseSettings, setEntrepriseSettings] = useState<EntrepriseSettings | undefined>(undefined);

  // Charger les paramètres au démarrage
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        setEntrepriseSettings(JSON.parse(saved));
      } catch {
        // Ignorer les erreurs de parsing
      }
    }
  }, []);

  // Sauvegarder les paramètres
  const handleSaveSettings = useCallback((settings: EntrepriseSettings) => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setEntrepriseSettings(settings);
  }, []);

  // Vérifier si l'API IA est configurée (via env ou paramètres)
  useEffect(() => {
    // Vérifier d'abord si une clé est dans les paramètres
    if (entrepriseSettings?.openaiApiKey) {
      setAiEnabled(true);
      return;
    }
    
    // Sinon vérifier la variable d'environnement côté serveur
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => setAiEnabled(data.aiEnabled))
      .catch(() => setAiEnabled(false));
  }, [entrepriseSettings?.openaiApiKey]);

  // Fonction pour obtenir le taux TVA
  const getDepartmentTVA = useCallback((dept: string, type: TypeTVA): number => {
    return getTauxTVA(dept as DepartementDOM, type);
  }, []);

  const getTVARate = useCallback((dept: string): number => {
    return getTauxTVA(dept as DepartementDOM, 'normal');
  }, []);

  // Traiter avec l'API IA
  const processWithAI = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          formData,
          conversationHistory: conversationHistory.slice(-10),
          // Passer la clé API et le modèle depuis les paramètres
          apiKey: entrepriseSettings?.openaiApiKey,
          model: entrepriseSettings?.openaiModel,
        }),
      });

      const data = await response.json();
      
      if (data.fallback || data.error) {
        return { message: data.message, actions: [], fallback: true };
      }

      return {
        message: data.message,
        actions: data.actions || [],
      };
    } catch {
      return { message: '⚠️ Erreur de connexion. Mode basique activé.', actions: [], fallback: true };
    }
  }, [formData, conversationHistory, entrepriseSettings?.openaiApiKey, entrepriseSettings?.openaiModel]);

  // Traiter avec le parseur local
  const processWithLocalParser = useCallback((text: string) => {
    const intent = parseVoiceIntent(text);
    const { updatedData, message } = applyIntentToForm(intent, formData, getDepartmentTVA);
    
    return {
      message,
      updatedData: intent.type !== 'unknown' && intent.confidence >= 0.4 ? updatedData : null,
    };
  }, [formData, getDepartmentTVA]);

  // Handler principal pour les messages
  const handleMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, { role: 'user', content: text }]);

    let responseMessage: string;

    if (aiEnabled) {
      const aiResponse = await processWithAI(text);
      
      if (aiResponse.fallback) {
        const localResult = processWithLocalParser(text);
        responseMessage = localResult.message;
        if (localResult.updatedData) {
          setFormData(localResult.updatedData);
        }
      } else {
        responseMessage = aiResponse.message;
        
        if (aiResponse.actions && aiResponse.actions.length > 0) {
          const updatedData = applyAIActions(aiResponse.actions, formData, getTVARate);
          setFormData(updatedData);
        }
      }
    } else {
      const localResult = processWithLocalParser(text);
      responseMessage = localResult.message;
      if (localResult.updatedData) {
        setFormData(localResult.updatedData);
      }
    }

    // Ajouter la réponse de l'assistant
    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: responseMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setConversationHistory(prev => [...prev, { role: 'assistant', content: responseMessage }]);
    setIsProcessing(false);
  }, [aiEnabled, processWithAI, processWithLocalParser, formData, getTVARate]);

  // Nouveau chat
  const handleNewChat = useCallback(() => {
    setFormData(createInitialFormData());
    setMessages([]);
    setConversationHistory([]);
  }, []);

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {/* Panneau gauche - Chat */}
        <div className="w-full md:w-[420px] lg:w-[480px] flex-shrink-0 border-r border-white/10">
          <ChatPanel
            onMessage={handleMessage}
            messages={messages}
            isProcessing={isProcessing}
            isConnected={aiEnabled ?? false}
            onNewChat={handleNewChat}
            onSettingsClick={() => setIsSettingsOpen(true)}
            apiKey={entrepriseSettings?.openaiApiKey}
          />
        </div>

        {/* Panneau droit - Aperçu du devis */}
        <div className="hidden md:flex flex-1">
          <DevisPreview 
            formData={formData} 
            entreprise={entrepriseSettings ? {
              nom: entrepriseSettings.nom,
              adresse: entrepriseSettings.adresse 
                ? `${entrepriseSettings.adresse}${entrepriseSettings.codePostal || entrepriseSettings.ville ? ', ' : ''}${entrepriseSettings.codePostal || ''} ${entrepriseSettings.ville || ''}`.trim()
                : undefined,
              siret: entrepriseSettings.siret,
              telephone: entrepriseSettings.telephone,
              email: entrepriseSettings.email,
              tvaExonere: entrepriseSettings.tvaExonere,
              validiteDevis: entrepriseSettings.validiteDevis,
              conditionsPaiement: entrepriseSettings.conditionsPaiement,
              modesPaiement: entrepriseSettings.modesPaiement,
              assurance: entrepriseSettings.assureurNom ? {
                nom: entrepriseSettings.assureurNom,
                numero: entrepriseSettings.assureurNumero,
                zone: entrepriseSettings.assureurZone,
              } : undefined,
              banque: entrepriseSettings.banque ? {
                nom: entrepriseSettings.banque,
                iban: entrepriseSettings.iban,
                bic: entrepriseSettings.bic,
              } : undefined,
            } : undefined}
          />
        </div>
      </div>

      {/* Modal Paramètres */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        initialSettings={entrepriseSettings}
      />
    </>
  );
}
