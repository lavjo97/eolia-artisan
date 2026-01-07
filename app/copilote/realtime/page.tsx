'use client';

/**
 * Page Copilote Realtime - Édition vocale en temps réel
 * Utilise l'API Realtime d'OpenAI pour une conversation naturelle
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRealtimeVoice, RealtimeAction } from '@/lib/ai/useRealtimeVoice';
import { DevisPreview } from '@/components/copilote/DevisPreview';
import { DevisFormData } from '@/components/DevisForm';
import { getTauxTVA, DepartementDOM, TypeTVA } from '@/lib/types';
import Link from 'next/link';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function RealtimeCopilotePage() {
  const [formData, setFormData] = useState<DevisFormData>(createInitialFormData);
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiKey, setApiKey] = useState<string>('');

  // Charger la clé API des paramètres locaux ou depuis le serveur
  useEffect(() => {
    const loadApiKey = async () => {
      // D'abord essayer les paramètres locaux
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.openaiApiKey) {
            setApiKey(settings.openaiApiKey);
            return;
          }
        } catch {
          // Ignorer
        }
      }
      
      // Sinon, essayer de récupérer depuis le serveur (Vercel env vars)
      try {
        const response = await fetch('/api/realtime');
        const data = await response.json();
        if (data.success && data.apiKey) {
          setApiKey(data.apiKey);
          console.log('✅ Clé API récupérée depuis le serveur Vercel');
        }
      } catch (err) {
        console.log('⚠️ Impossible de récupérer la clé API depuis le serveur:', err);
      }
    };
    
    loadApiKey();
  }, []);

  // Appliquer une action au formulaire
  const applyAction = useCallback((action: RealtimeAction) => {
    console.log('🎯 Action reçue:', action);

    setFormData(prev => {
      const updated = { ...prev };
      const params = action.params || {};

      switch (action.type) {
        case 'update_client':
          if (params.nom) updated.clientNom = String(params.nom);
          if (params.prenom) updated.clientPrenom = String(params.prenom);
          if (params.adresse) updated.clientAdresse = String(params.adresse);
          if (params.ville) updated.clientVille = String(params.ville);
          if (params.codePostal) updated.clientCodePostal = String(params.codePostal);
          if (params.telephone) updated.clientTelephone = String(params.telephone);
          if (params.email) updated.clientEmail = String(params.email);
          break;

        case 'add_line':
          const newLine = {
            designation: String(params.designation || 'Nouvelle prestation'),
            description: String(params.description || ''),
            quantite: Number(params.quantite) || 1,
            unite: String(params.unite || 'u'),
            prixUnitaireHT: Number(params.prixUnitaireHT) || 0,
            tauxTVA: getTauxTVA(prev.clientDepartement as DepartementDOM, 'normal'),
            typeTVA: 'normal' as TypeTVA,
          };
          updated.lignes = [...prev.lignes.filter(l => l.designation), newLine];
          break;

        case 'update_line':
          const updateIdx = Number(params.index);
          if (updateIdx >= 0 && updateIdx < prev.lignes.length) {
            const field = String(params.field);
            const value = params.value;
            updated.lignes = prev.lignes.map((l, i) => {
              if (i === updateIdx) {
                return { ...l, [field]: value };
              }
              return l;
            });
          }
          break;

        case 'delete_line':
          let delIdx = Number(params.index);
          if (delIdx === -1) delIdx = prev.lignes.length - 1;
          if (delIdx >= 0 && delIdx < prev.lignes.length) {
            updated.lignes = prev.lignes.filter((_, i) => i !== delIdx);
            if (updated.lignes.length === 0) {
              updated.lignes = [{
                designation: '',
                description: '',
                quantite: 1,
                unite: 'u',
                prixUnitaireHT: 0,
                tauxTVA: getTauxTVA(prev.clientDepartement as DepartementDOM, 'normal'),
                typeTVA: 'normal' as TypeTVA,
              }];
            }
          }
          break;

        case 'apply_discount':
          if (params.type === 'percent') {
            updated.remisePercent = Number(params.value) || 0;
            updated.remiseAmount = undefined;
          } else {
            updated.remiseAmount = Number(params.value) || 0;
            updated.remisePercent = undefined;
          }
          break;

        case 'set_object':
          if (params.objet) updated.objet = String(params.objet);
          break;
      }

      return updated;
    });
  }, []);

  // Handler pour les transcripts
  const handleTranscript = useCallback((text: string) => {
    const msg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  // Handler pour les réponses
  const handleResponse = useCallback((text: string) => {
    const msg: Message = {
      id: generateId(),
      role: 'assistant',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  // Handler pour les erreurs
  const handleError = useCallback((error: string) => {
    console.error('Erreur Realtime:', error);
  }, []);

  // Hook Realtime
  const realtime = useRealtimeVoice({
    apiKey,
    onAction: applyAction,
    onTranscript: handleTranscript,
    onResponse: handleResponse,
    onError: handleError,
  });

  // Toggle écoute
  const toggleListening = useCallback(() => {
    if (realtime.isListening) {
      realtime.stopListening();
    } else {
      realtime.startListening();
    }
  }, [realtime]);

  // Nouveau devis
  const handleNewDevis = useCallback(() => {
    setFormData(createInitialFormData());
    setMessages([]);
    realtime.reset();
  }, [realtime]);

  return (
    <div className="flex h-screen bg-[#0f1419]">
      {/* Panneau gauche - Contrôles vocaux */}
      <div className="w-full md:w-[480px] flex flex-col border-r border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Mode Realtime</h1>
              <p className="text-gray-400 text-xs flex items-center gap-1">
                {realtime.isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Connecté à OpenAI
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    Déconnecté
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/copilote"
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Mode texte
            </Link>
            <button
              onClick={handleNewDevis}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Nouveau devis"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Zone centrale - Bouton micro */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Erreur */}
          {realtime.error && (
            <div className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm max-w-sm text-center">
              ⚠️ {realtime.error}
            </div>
          )}

          {/* Clé API manquante */}
          {!apiKey && (
            <div className="mb-6 px-4 py-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm max-w-sm text-center">
              <p className="font-medium">Clé API requise</p>
              <p className="text-xs mt-1 text-amber-300/70">
                Configurez votre clé OpenAI dans{' '}
                <Link href="/copilote" className="underline">les paramètres</Link>
              </p>
            </div>
          )}

          {/* Gros bouton micro */}
          <button
            onClick={toggleListening}
            disabled={!apiKey}
            className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${
              realtime.isListening
                ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110'
                : realtime.isProcessing
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                  : apiKey
                    ? 'bg-gradient-to-br from-purple-500 to-blue-600 hover:scale-105'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            {/* Animations */}
            {realtime.isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                <span className="absolute inset-[-12px] rounded-full border-4 border-red-400/50 animate-pulse" />
                <span className="absolute inset-[-24px] rounded-full border-2 border-red-400/30 animate-pulse" style={{ animationDelay: '150ms' }} />
              </>
            )}

            {realtime.isSpeaking && (
              <span className="absolute inset-[-6px] rounded-full border-4 border-green-400 animate-pulse" />
            )}

            {/* Icône */}
            {realtime.isProcessing ? (
              <svg className="w-16 h-16 text-white animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            )}
          </button>

          {/* Status */}
          <p className="mt-6 text-lg font-medium text-white">
            {!apiKey 
              ? 'Configuration requise'
              : realtime.isListening 
                ? realtime.isSpeaking
                  ? '🎤 Parole détectée...'
                  : '🔴 Écoute en cours...'
                : realtime.isProcessing
                  ? '⏳ Traitement...'
                  : '🎙️ Appuyez pour parler'
            }
          </p>

          {/* Transcript en cours */}
          {realtime.transcript && (
            <div className="mt-4 px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl max-w-md">
              <p className="text-blue-300 text-sm">📝 Vous : {realtime.transcript}</p>
            </div>
          )}

          {/* Dernière réponse */}
          {realtime.response && (
            <div className="mt-4 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl max-w-md">
              <p className="text-green-300 text-sm">🤖 Assistant : {realtime.response}</p>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto border-t border-white/10 p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">Commencez à parler...</p>
              <p className="text-xs mt-2">Exemples :</p>
              <div className="mt-3 space-y-2">
                {[
                  'Le client c\'est Jean Dupont',
                  'Ajoute climatisation 2500 euros',
                  'Remise de 10 pourcent',
                ].map((ex, i) => (
                  <p key={i} className="text-xs text-gray-400">&quot;{ex}&quot;</p>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panneau droit - Aperçu */}
      <div className="hidden md:flex flex-1">
        <DevisPreview formData={formData} />
      </div>
    </div>
  );
}
