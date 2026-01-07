'use client';

import React, { useState, useCallback, useEffect } from 'react';

// Icônes
const CloseIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const SettingsIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ImageIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

// Icône IA
const SparklesIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

const EyeIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);

const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

// Types
export interface EntrepriseSettings {
  // Entreprise
  nom: string;
  formeJuridique: string;
  siret: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  logo?: string;
  
  // Bancaire
  banque: string;
  iban: string;
  bic: string;
  
  // Assurance
  assureurNom: string;
  assureurNumero: string;
  assureurZone: string;
  
  // Conditions
  tvaExonere: boolean;
  tauxTVA: string;
  validiteDevis: number;
  conditionsPaiement: string;
  modesPaiement: string[];
  
  // IA
  openaiApiKey?: string;
  openaiModel?: string;
}

const defaultSettings: EntrepriseSettings = {
  nom: '',
  formeJuridique: '',
  siret: '',
  adresse: '',
  codePostal: '',
  ville: '',
  telephone: '',
  email: '',
  logo: undefined,
  banque: '',
  iban: '',
  bic: '',
  assureurNom: '',
  assureurNumero: '',
  assureurZone: 'France entière',
  tvaExonere: false,
  tauxTVA: '20',
  validiteDevis: 30,
  conditionsPaiement: 'À réception de facture',
  modesPaiement: ['Virement', 'Chèque'],
  openaiApiKey: undefined,
  openaiModel: 'gpt-4o-mini',
};

type TabId = 'entreprise' | 'bancaire' | 'assurance' | 'conditions' | 'ia';

interface Tab {
  id: TabId;
  label: string;
  icon?: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'entreprise', label: 'Entreprise' },
  { id: 'bancaire', label: 'Bancaire' },
  { id: 'assurance', label: 'Assurance' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'ia', label: 'IA' },
];

const aiModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rapide & Économique)' },
  { value: 'gpt-4o', label: 'GPT-4o (Plus intelligent)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Premium)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Basique)' },
];

const formesJuridiques = [
  { value: '', label: 'Sélectionner...' },
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'EIRL', label: 'EIRL' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SASU', label: 'SASU' },
  { value: 'SA', label: 'SA' },
  { value: 'SCI', label: 'SCI' },
  { value: 'AUTO', label: 'Auto-entrepreneur' },
];

const tauxTVAOptions = [
  { value: '0', label: '0% (Exonéré)' },
  { value: '5.5', label: '5,5% (Travaux rénovation énergétique)' },
  { value: '10', label: '10% (Travaux rénovation)' },
  { value: '20', label: '20% (Taux normal)' },
  { value: '8.5', label: '8,5% (DOM - Martinique, Guadeloupe, Réunion)' },
  { value: '2.1', label: '2,1% (Taux réduit DOM)' },
];

const modesPaiementOptions = [
  'Virement',
  'Chèque',
  'Espèces',
  'Carte bancaire',
  'PayPal',
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: EntrepriseSettings) => void;
  initialSettings?: EntrepriseSettings;
}

export function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('entreprise');
  const [settings, setSettings] = useState<EntrepriseSettings>(initialSettings || defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');

  // Reset settings when modal opens
  useEffect(() => {
    if (isOpen && initialSettings) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  // Tester la clé API
  const testApiKey = useCallback(async () => {
    if (!settings.openaiApiKey) return;
    
    setApiKeyStatus('testing');
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${settings.openaiApiKey}`,
        },
      });
      setApiKeyStatus(response.ok ? 'valid' : 'invalid');
    } catch {
      setApiKeyStatus('invalid');
    }
  }, [settings.openaiApiKey]);

  const handleChange = useCallback((field: keyof EntrepriseSettings, value: string | boolean | number | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleModesPaiement = useCallback((mode: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      modesPaiement: checked 
        ? [...prev.modesPaiement, mode]
        : prev.modesPaiement.filter(m => m !== mode),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [settings, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#1e2738] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Paramètres Entreprise</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Tab: Entreprise */}
          {activeTab === 'entreprise' && (
            <div className="space-y-5">
              <div className="flex gap-6">
                {/* Logo */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-400 cursor-pointer transition-colors">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">Logo</span>
                  </div>
                </div>

                {/* Nom & Forme */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nom de l&apos;entreprise *
                    </label>
                    <input
                      type="text"
                      value={settings.nom}
                      onChange={(e) => handleChange('nom', e.target.value)}
                      placeholder="SARL Dupont Rénovation"
                      className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Forme juridique
                    </label>
                    <select
                      value={settings.formeJuridique}
                      onChange={(e) => handleChange('formeJuridique', e.target.value)}
                      className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                    >
                      {formesJuridiques.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">SIRET</label>
                <input
                  type="text"
                  value={settings.siret}
                  onChange={(e) => handleChange('siret', e.target.value)}
                  placeholder="123 456 789 00012"
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                <input
                  type="text"
                  value={settings.adresse}
                  onChange={(e) => handleChange('adresse', e.target.value)}
                  placeholder="123 Rue du Commerce"
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
                  <input
                    type="text"
                    value={settings.codePostal}
                    onChange={(e) => handleChange('codePostal', e.target.value)}
                    placeholder="74000"
                    className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
                  <input
                    type="text"
                    value={settings.ville}
                    onChange={(e) => handleChange('ville', e.target.value)}
                    placeholder="Annecy"
                    className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={settings.telephone}
                    onChange={(e) => handleChange('telephone', e.target.value)}
                    placeholder="04 50 00 00 00"
                    className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@entreprise.fr"
                    className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Bancaire */}
          {activeTab === 'bancaire' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-sm">
                  <span className="font-semibold">Important :</span> Ces informations apparaîtront sur vos devis pour permettre à vos clients de vous régler par virement.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom de la banque</label>
                <input
                  type="text"
                  value={settings.banque}
                  onChange={(e) => handleChange('banque', e.target.value)}
                  placeholder="Crédit Agricole, BNP Paribas..."
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">IBAN</label>
                <input
                  type="text"
                  value={settings.iban}
                  onChange={(e) => handleChange('iban', e.target.value)}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">BIC / SWIFT</label>
                <input
                  type="text"
                  value={settings.bic}
                  onChange={(e) => handleChange('bic', e.target.value)}
                  placeholder="AGRIFRPP"
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab: Assurance */}
          {activeTab === 'assurance' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-400 text-sm">
                  <span className="font-semibold">Assurance décennale :</span> Obligatoire pour les artisans du bâtiment. Ces informations seront affichées sur tous vos devis.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nom de l&apos;assureur</label>
                <input
                  type="text"
                  value={settings.assureurNom}
                  onChange={(e) => handleChange('assureurNom', e.target.value)}
                  placeholder="AXA France, MAAF, Allianz..."
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">N° de police / contrat</label>
                <input
                  type="text"
                  value={settings.assureurNumero}
                  onChange={(e) => handleChange('assureurNumero', e.target.value)}
                  placeholder="123456789"
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zone de couverture géographique</label>
                <input
                  type="text"
                  value={settings.assureurZone}
                  onChange={(e) => handleChange('assureurZone', e.target.value)}
                  placeholder="France entière"
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Tab: Conditions */}
          {activeTab === 'conditions' && (
            <div className="space-y-5">
              {/* TVA Exonéré */}
              <label className="flex items-start gap-3 p-4 bg-[#2a3441] rounded-xl cursor-pointer hover:bg-[#323d4d] transition-colors">
                <input
                  type="checkbox"
                  checked={settings.tvaExonere}
                  onChange={(e) => handleChange('tvaExonere', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <div>
                  <p className="font-medium text-white">TVA non applicable (Micro-entreprise)</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Article 293 B du CGI - Si vous êtes auto-entrepreneur ou micro-entrepreneur, cochez cette case pour ne pas appliquer de TVA sur vos devis.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Taux de TVA par défaut</label>
                <select
                  value={settings.tauxTVA}
                  onChange={(e) => handleChange('tauxTVA', e.target.value)}
                  disabled={settings.tvaExonere}
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer disabled:opacity-50"
                >
                  {tauxTVAOptions.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Validité du devis (jours)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.validiteDevis}
                  onChange={(e) => handleChange('validiteDevis', parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Conditions de paiement</label>
                <input
                  type="text"
                  value={settings.conditionsPaiement}
                  onChange={(e) => handleChange('conditionsPaiement', e.target.value)}
                  placeholder="À réception de facture"
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Modes de paiement acceptés</label>
                <div className="flex flex-wrap gap-2">
                  {modesPaiementOptions.map(mode => (
                    <label
                      key={mode}
                      className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                        settings.modesPaiement.includes(mode)
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#2a3441] text-gray-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={settings.modesPaiement.includes(mode)}
                        onChange={(e) => handleModesPaiement(mode, e.target.checked)}
                        className="sr-only"
                      />
                      {mode}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: IA */}
          {activeTab === 'ia' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <SparklesIcon className="w-5 h-5 text-purple-400" />
                  <p className="font-semibold text-white">Assistant IA Conversationnel</p>
                </div>
                <p className="text-sm text-gray-300">
                  Activez l&apos;IA pour créer vos devis en langage naturel. Dictez simplement 
                  &quot;Ajoute une ligne pour un chauffe-eau à 1500 euros&quot; et l&apos;assistant comprend !
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Clé API OpenAI
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => {
                      handleChange('openaiApiKey', e.target.value);
                      setApiKeyStatus('idle');
                    }}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 pr-24 bg-[#2a3441] border border-transparent rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors font-mono text-sm"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showApiKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                    {settings.openaiApiKey && (
                      <button
                        type="button"
                        onClick={testApiKey}
                        disabled={apiKeyStatus === 'testing'}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          apiKeyStatus === 'valid' 
                            ? 'bg-green-500/20 text-green-400'
                            : apiKeyStatus === 'invalid'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        }`}
                      >
                        {apiKeyStatus === 'testing' ? '...' : apiKeyStatus === 'valid' ? '✓' : apiKeyStatus === 'invalid' ? '✗' : 'Tester'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Obtenez votre clé sur{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    platform.openai.com/api-keys
                  </a>
                </p>
              </div>

              {/* Modèle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Modèle IA</label>
                <select
                  value={settings.openaiModel || 'gpt-4o-mini'}
                  onChange={(e) => handleChange('openaiModel', e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a3441] border border-transparent rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
                >
                  {aiModels.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  GPT-4o Mini est recommandé pour un bon équilibre coût/performance.
                </p>
              </div>

              {/* Fonctionnalités */}
              <div className="p-4 bg-[#2a3441] rounded-xl">
                <p className="text-sm font-medium text-gray-300 mb-3">Ce que vous pouvez dire :</p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>&quot;Le client s&apos;appelle Jean Dupont à Fort-de-France&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>&quot;Ajoute une installation de climatisation à 2500 euros&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>&quot;Mets 3 unités pour la première ligne&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>&quot;Applique une remise de 10 pourcent&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>&quot;Supprime la dernière ligne&quot;</span>
                  </li>
                </ul>
              </div>

              {/* Mode hors-ligne */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-400 text-sm">
                  <span className="font-semibold">Sans clé API :</span> Un mode basique avec reconnaissance 
                  de commandes simples reste disponible (moins précis).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#1a2230]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-gray-400 font-medium hover:text-white hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
