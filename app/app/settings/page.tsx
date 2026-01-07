'use client';

import React, { useState, useEffect } from 'react';
import { EntrepriseSettings } from '@/components/copilote/SettingsModal';

const SETTINGS_STORAGE_KEY = 'eolia_entreprise_settings';

type TabId = 'entreprise' | 'bancaire' | 'assurance' | 'conditions' | 'ia';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'entreprise', label: 'Entreprise', icon: '🏢' },
  { id: 'bancaire', label: 'Bancaire', icon: '🏦' },
  { id: 'assurance', label: 'Assurance', icon: '🛡️' },
  { id: 'conditions', label: 'Conditions', icon: '📋' },
  { id: 'ia', label: 'IA & API', icon: '🤖' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('entreprise');
  const [settings, setSettings] = useState<Partial<EntrepriseSettings>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Charger les paramètres
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        // Ignorer
      }
    }
  }, []);

  // Sauvegarder les paramètres
  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Paramètres sauvegardés !');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 500);
  };

  // Mettre à jour un champ
  const updateField = (field: keyof EntrepriseSettings, value: string | boolean | number | string[] | undefined) => {
    setSettings((prev: Partial<EntrepriseSettings>) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Paramètres</h1>
          <p className="text-slate-500">Configurez votre entreprise et vos préférences</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sauvegarde...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sauvegarder</span>
            </>
          )}
        </button>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {/* Entreprise */}
        {activeTab === 'entreprise' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informations de l&apos;entreprise</h2>
            
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-800 border border-dashed border-slate-600 rounded-xl flex items-center justify-center">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                  Changer le logo
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nom de l&apos;entreprise</label>
                <input
                  type="text"
                  value={settings.nom || ''}
                  onChange={(e) => updateField('nom', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Mon Entreprise"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Forme juridique</label>
                <select
                  value={settings.formeJuridique || ''}
                  onChange={(e) => updateField('formeJuridique', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sélectionner...</option>
                  <option value="EI">Entreprise Individuelle</option>
                  <option value="EIRL">EIRL</option>
                  <option value="EURL">EURL</option>
                  <option value="SARL">SARL</option>
                  <option value="SAS">SAS</option>
                  <option value="SASU">SASU</option>
                  <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">SIRET</label>
              <input
                type="text"
                value={settings.siret || ''}
                onChange={(e) => updateField('siret', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="123 456 789 00012"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Adresse</label>
              <input
                type="text"
                value={settings.adresse || ''}
                onChange={(e) => updateField('adresse', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="123 Rue Example"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Code postal</label>
                <input
                  type="text"
                  value={settings.codePostal || ''}
                  onChange={(e) => updateField('codePostal', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="97200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ville</label>
                <input
                  type="text"
                  value={settings.ville || ''}
                  onChange={(e) => updateField('ville', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Fort-de-France"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={settings.telephone || ''}
                  onChange={(e) => updateField('telephone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0696 12 34 56"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="contact@entreprise.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bancaire */}
        {activeTab === 'bancaire' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Coordonnées bancaires</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la banque</label>
              <input
                type="text"
                value={settings.banque || ''}
                onChange={(e) => updateField('banque', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="BRED Banque Populaire"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">IBAN</label>
              <input
                type="text"
                value={settings.iban || ''}
                onChange={(e) => updateField('iban', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="FR76 1234 5678 9012 3456 7890 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">BIC</label>
              <input
                type="text"
                value={settings.bic || ''}
                onChange={(e) => updateField('bic', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="BREDFRPP"
              />
            </div>
          </div>
        )}

        {/* Assurance */}
        {activeTab === 'assurance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Assurance décennale</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom de l&apos;assureur</label>
              <input
                type="text"
                value={settings.assureurNom || ''}
                onChange={(e) => updateField('assureurNom', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="AXA Assurances"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Numéro de police</label>
              <input
                type="text"
                value={settings.assureurNumero || ''}
                onChange={(e) => updateField('assureurNumero', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="POL-2024-123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Zone de couverture</label>
              <input
                type="text"
                value={settings.assureurZone || ''}
                onChange={(e) => updateField('assureurZone', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Martinique - Guadeloupe"
              />
            </div>
          </div>
        )}

        {/* Conditions */}
        {activeTab === 'conditions' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Conditions générales</h2>
            
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <input
                type="checkbox"
                id="tvaExonere"
                checked={settings.tvaExonere || false}
                onChange={(e) => updateField('tvaExonere', e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="tvaExonere" className="text-slate-300">
                Exonéré de TVA (Article 293 B du CGI)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Taux de TVA par défaut</label>
              <select
                value={settings.tauxTVADefaut || '8.5'}
                onChange={(e) => updateField('tauxTVADefaut', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="0">0% (Guyane, Mayotte)</option>
                <option value="2.1">2.1% (Taux réduit DOM)</option>
                <option value="8.5">8.5% (Taux normal DOM)</option>
                <option value="5.5">5.5% (Taux réduit Métropole)</option>
                <option value="10">10% (Taux intermédiaire)</option>
                <option value="20">20% (Taux normal Métropole)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Validité des devis</label>
              <select
                value={settings.validiteDevis || '30'}
                onChange={(e) => updateField('validiteDevis', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="15">15 jours</option>
                <option value="30">30 jours</option>
                <option value="60">60 jours</option>
                <option value="90">90 jours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Conditions de paiement</label>
              <select
                value={settings.conditionsPaiement || 'reception'}
                onChange={(e) => updateField('conditionsPaiement', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="reception">À réception de facture</option>
                <option value="30jours">30 jours fin de mois</option>
                <option value="comptant">Comptant</option>
                <option value="acompte">Acompte 30% + solde à livraison</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Modes de paiement acceptés</label>
              <div className="grid grid-cols-2 gap-3">
                {['Virement', 'Chèque', 'Espèces', 'Carte bancaire'].map((mode) => (
                  <label key={mode} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(settings.modesPaiement || []).includes(mode)}
                      onChange={(e) => {
                        const current = settings.modesPaiement || [];
                        if (e.target.checked) {
                          updateField('modesPaiement', [...current, mode]);
                        } else {
                          updateField('modesPaiement', current.filter(m => m !== mode));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300">{mode}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* IA & API */}
        {activeTab === 'ia' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Configuration IA</h2>
            
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">OpenAI API</h3>
                  <p className="text-sm text-slate-400">
                    Configurez votre clé API pour activer les fonctionnalités IA avancées 
                    (commandes vocales intelligentes, compréhension naturelle).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Clé API OpenAI</label>
              <input
                type="password"
                value={settings.openaiApiKey || ''}
                onChange={(e) => updateField('openaiApiKey', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder="sk-..."
              />
              <p className="text-xs text-slate-500 mt-2">
                Obtenez votre clé sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">platform.openai.com</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Modèle</label>
              <select
                value={settings.openaiModel || 'gpt-4o'}
                onChange={(e) => updateField('openaiModel', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="gpt-4o">GPT-4o (Recommandé)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Plus rapide)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Économique)</option>
              </select>
            </div>

            {settings.openaiApiKey && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">API configurée - Les fonctionnalités IA sont activées</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
