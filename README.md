# Eolia Artisan

Application de devis professionnels pour artisans des DOM-TOM avec reconnaissance vocale et mode hors-ligne.

## Fonctionnalités

- 🎙️ **Dictée vocale** - Remplissez vos devis en parlant (Web Speech API + Whisper)
- 📱 **PWA hors-ligne** - Fonctionne sans connexion internet
- 🌴 **TVA DOM** - Taux automatiques pour Guadeloupe, Martinique, Guyane, La Réunion, Mayotte
- ☀️ **Design solaire** - Interface haute contraste pour utilisation en extérieur
- 📄 **PDF professionnel** - Génération et téléchargement de devis en PDF
- 💾 **Stockage local** - Données sauvegardées dans IndexedDB

## Installation

```bash
# Cloner le projet
cd eolia-artisan

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Construire pour la production
npm run build
npm run start
```

## Structure du projet

```
eolia-artisan/
├── app/
│   ├── layout.tsx          # Layout principal + PWA meta
│   ├── page.tsx            # Page d'accueil
│   ├── globals.css         # Styles Tailwind + thème solaire
│   └── devis/
│       ├── page.tsx        # Liste des devis
│       ├── nouveau/
│       │   └── page.tsx    # Création de devis
│       └── [id]/
│           └── page.tsx    # Détail et PDF d'un devis
├── components/
│   ├── ui/
│   │   ├── Button.tsx      # Boutons tactiles
│   │   └── Input.tsx       # Champs de formulaire
│   ├── VoiceButton.tsx     # Bouton micro avec Web Speech
│   ├── DevisForm.tsx       # Formulaire de devis
│   └── PDFPreview.tsx      # Aperçu et téléchargement PDF
├── lib/
│   ├── voice/
│   │   ├── web-speech.ts   # Hook Web Speech API
│   │   └── whisper.ts      # Client Whisper API
│   ├── pdf/
│   │   └── devis-template.tsx  # Template PDF react-pdf
│   ├── storage/
│   │   └── indexed-db.ts   # Gestion IndexedDB hors-ligne
│   └── types.ts            # Types TypeScript (Devis, Client, etc.)
├── public/
│   ├── manifest.json       # PWA manifest
│   └── icons/              # Icônes PWA
└── next.config.mjs         # Config PWA + offline
```

## Design "Solaire"

Le thème est optimisé pour une utilisation en extérieur avec :
- Fond sombre avec accents orange/jaune vif
- Texte blanc haute visibilité
- Gros boutons tactiles (utilisables avec des gants)
- Mode PWA fullscreen

## TVA DOM

L'application gère automatiquement les taux de TVA des DOM :

| Département | Taux normal | Taux réduit |
|-------------|-------------|-------------|
| Guadeloupe (971) | 8.5% | 2.1% |
| Martinique (972) | 8.5% | 2.1% |
| Guyane (973) | 0% | 0% |
| La Réunion (974) | 8.5% | 2.1% |
| Mayotte (976) | 0% | 0% |

## Technologies

- **Next.js 14** - Framework React avec App Router
- **Tailwind CSS** - Styles utilitaires avec thème personnalisé
- **@react-pdf/renderer** - Génération de PDF
- **idb** - Wrapper IndexedDB pour le stockage hors-ligne
- **next-pwa** - Configuration PWA et service worker
- **Web Speech API** - Reconnaissance vocale native
- **OpenAI Whisper** - Transcription vocale premium (optionnel)

## Licence

MIT
