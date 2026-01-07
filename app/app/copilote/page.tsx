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
  const [showPreview, setShowPreview] = useState(true);
  
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
      {/* Header spécifique copilote */}
      <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 hidden lg:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Copilote IA</h1>
              <p className="text-sm text-slate-500">Créez vos devis par la voix</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle preview */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showPreview 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {showPreview ? '👁️ Aperçu' : '👁️‍🗨️ Masquer'}
            </button>

            {/* Status IA */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              aiEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {aiEnabled ? 'IA Connectée' : 'Mode basique'}
            </div>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden pb-16 lg:pb-0">
        {/* Panneau gauche - Chat */}
        <div className={`flex-1 ${showPreview ? 'lg:max-w-[480px]' : ''} flex-shrink-0 border-r border-slate-800`}>
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
        {showPreview && (
          <div className="hidden lg:flex flex-1 bg-slate-900">
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
        )}
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
