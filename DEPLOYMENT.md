# 🚀 Guide de Déploiement - Eolia Artisan

Ce guide vous accompagne dans le déploiement complet de l'application Eolia Artisan sur:
- **Web (Next.js)** → Vercel
- **Backend WebSocket** → Railway
- **Mobile (Expo)** → EAS Build + Stores

---

## 📋 Prérequis

### Comptes requis
- [Vercel](https://vercel.com) (gratuit)
- [Railway](https://railway.app) (gratuit avec 500h/mois)
- [Expo](https://expo.dev) (gratuit)
- [Apple Developer](https://developer.apple.com) (99$/an pour iOS)
- [Google Play Console](https://play.google.com/console) (25$ une fois pour Android)

### Outils à installer
```bash
# Vercel CLI
npm install -g vercel

# EAS CLI (Expo Application Services)
npm install -g eas-cli

# Railway CLI (optionnel)
npm install -g @railway/cli
```

---

## 🌐 ÉTAPE 1: Déploiement Web (Vercel)

### 1.1 Connexion GitHub
Assurez-vous que votre projet est sur GitHub:
```bash
cd C:\Users\lavil\eolia-artisan
git init
git add .
git commit -m "Initial commit - Eolia Artisan v1.0"
git remote add origin https://github.com/VOTRE_USERNAME/eolia-artisan.git
git push -u origin main
```

### 1.2 Déploiement via Vercel Dashboard
1. Allez sur [vercel.com/new](https://vercel.com/new)
2. Connectez votre compte GitHub
3. Importez le repository `eolia-artisan`
4. Configurez les variables d'environnement:

### 1.3 Variables d'environnement Vercel
Dans les paramètres du projet Vercel, ajoutez:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Votre clé API OpenAI |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service Supabase |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (prod) |
| `STRIPE_PRICE_STANDARD` | ID du prix Standard |
| `STRIPE_PRICE_PREMIUM` | ID du prix Premium |
| `INSEE_API_KEY` | Clé API INSEE/Sirene |
| `NEXT_PUBLIC_WS_URL` | URL du backend WebSocket |

### 1.4 Déploiement CLI (alternative)
```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

---

## 🔌 ÉTAPE 2: Déploiement Backend WebSocket (Railway)

### 2.1 Configuration du backend
Le backend est dans le dossier `/backend`. Il gère les connexions WebSocket pour l'API Realtime.

### 2.2 Déploiement Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur "New Project" → "Deploy from GitHub repo"
3. Sélectionnez votre repo et le dossier `/backend`
4. Configurez les variables:

| Variable | Valeur |
|----------|--------|
| `OPENAI_API_KEY` | Votre clé API OpenAI |
| `PORT` | `8080` |

### 2.3 Configuration du Procfile
Le fichier `Procfile` est déjà créé:
```
web: node server.js
```

### 2.4 URL du WebSocket
Après déploiement, Railway vous donnera une URL comme:
`https://eolia-backend-production.up.railway.app`

Ajoutez cette URL dans Vercel:
```
NEXT_PUBLIC_WS_URL=wss://eolia-backend-production.up.railway.app
```

---

## 📱 ÉTAPE 3: Déploiement Mobile (Expo EAS)

### 3.1 Configuration initiale
```bash
cd C:\Users\lavil\eolia-artisan\mobile

# Installer les dépendances
npm install

# Se connecter à Expo
npx eas-cli login

# Configurer EAS
npx eas-cli build:configure
```

### 3.2 Configuration app.json
Mettre à jour `app.json` avec les infos de production:

```json
{
  "expo": {
    "name": "Eolia Voice",
    "slug": "eolia-voice",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.eolia.voice",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Eolia utilise le microphone pour les commandes vocales."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      },
      "package": "com.eolia.voice",
      "versionCode": 1,
      "permissions": ["RECORD_AUDIO"]
    },
    "extra": {
      "eas": {
        "projectId": "VOTRE_PROJECT_ID"
      }
    }
  }
}
```

### 3.3 Configuration eas.json
Créer `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "votre@email.com",
        "ascAppId": "VOTRE_APP_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services.json"
      }
    }
  }
}
```

### 3.4 Build iOS
```bash
# Build pour iOS App Store
npx eas-cli build --platform ios --profile production

# Soumettre à l'App Store
npx eas-cli submit --platform ios
```

### 3.5 Build Android
```bash
# Build pour Google Play
npx eas-cli build --platform android --profile production

# Soumettre au Play Store
npx eas-cli submit --platform android
```

---

## 🎨 ÉTAPE 4: Création des Assets

### 4.1 Icône de l'app (1024x1024)
Créez une icône carrée de 1024x1024 pixels au format PNG.
Placez-la dans `/mobile/assets/icon.png`

### 4.2 Splash Screen (1284x2778)
Créez un splash screen de 1284x2778 pixels.
Placez-le dans `/mobile/assets/splash.png`

### 4.3 Adaptive Icon Android (1024x1024)
Créez un foreground icon de 1024x1024 pixels.
Placez-le dans `/mobile/assets/adaptive-icon.png`

### 4.4 Outils recommandés
- [Figma](https://figma.com) pour le design
- [Expo Icon Generator](https://icon.expo.fyi) pour générer toutes les tailles

---

## 🔐 ÉTAPE 5: Configuration des APIs en Production

### 5.1 Supabase
1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez les migrations SQL
3. Activez l'authentification par email
4. Configurez les Row Level Security (RLS) policies

### 5.2 Stripe
1. Créez un compte sur [stripe.com](https://stripe.com)
2. Créez les produits:
   - **Standard**: 25€/mois
   - **Premium**: 45€/mois
3. Configurez les webhooks pour:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 5.3 OpenAI
1. Créez une clé API sur [platform.openai.com](https://platform.openai.com)
2. Configurez les limites de dépenses
3. Utilisez `gpt-4o-mini` pour un bon rapport qualité/prix

### 5.4 INSEE (Sirene)
1. Créez un compte sur [api.insee.fr](https://api.insee.fr)
2. Demandez l'accès à l'API Sirene
3. Utilisez la clé Bearer dans vos requêtes

---

## 📊 ÉTAPE 6: Monitoring & Analytics

### 6.1 Vercel Analytics
Activez les Analytics dans le dashboard Vercel pour suivre:
- Performance des pages
- Visiteurs uniques
- Erreurs runtime

### 6.2 Supabase Dashboard
Utilisez le dashboard Supabase pour:
- Monitoring des requêtes
- Logs d'authentification
- Usage de la base de données

### 6.3 Sentry (optionnel)
Pour un tracking d'erreurs avancé:
```bash
npm install @sentry/nextjs
```

---

## 🔄 ÉTAPE 7: CI/CD Automatisé

Vercel gère automatiquement le CI/CD:
- **Push sur `main`** → Déploiement production
- **Push sur autres branches** → Preview deployment

Pour le mobile, configurez EAS Build:
```bash
# Build automatique sur commit
npx eas-cli build:configure
```

---

## ✅ Checklist de Déploiement

### Web (Vercel)
- [ ] Repository GitHub connecté
- [ ] Variables d'environnement configurées
- [ ] Domaine personnalisé (optionnel)
- [ ] SSL actif (automatique)
- [ ] Analytics activé

### Backend (Railway)
- [ ] Projet créé
- [ ] Variables d'environnement
- [ ] Déploiement réussi
- [ ] URL WebSocket fonctionnelle

### Mobile (EAS)
- [ ] Compte Expo créé
- [ ] eas.json configuré
- [ ] Assets créés (icon, splash)
- [ ] Build iOS réussi
- [ ] Build Android réussi
- [ ] Soumission App Store
- [ ] Soumission Play Store

### APIs
- [ ] Supabase configuré
- [ ] Stripe webhooks actifs
- [ ] OpenAI quotas vérifiés
- [ ] INSEE API accessible

---

## 🆘 Dépannage

### Erreur de build Vercel
```bash
# Vérifier localement
npm run build
```

### WebSocket ne se connecte pas
- Vérifiez que `NEXT_PUBLIC_WS_URL` utilise `wss://` (et non `ws://`)
- Vérifiez les CORS sur Railway

### Build mobile échoue
```bash
# Nettoyer le cache
npx expo start --clear
npx eas-cli build --clear-cache
```

---

## 📞 Support

Pour toute question:
- Documentation Vercel: https://vercel.com/docs
- Documentation Expo: https://docs.expo.dev
- Documentation Supabase: https://supabase.com/docs

---

Bonne chance pour votre déploiement ! 🎉
