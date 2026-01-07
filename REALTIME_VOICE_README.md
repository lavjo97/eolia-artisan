# 🎤 Eolia Realtime Voice API

Assistant vocal intelligent pour la gestion de devis et factures avec l'API Realtime d'OpenAI.

## 📁 Architecture

```
eolia-artisan/
├── backend/
│   ├── server.js          # Serveur WebSocket + OpenAI Realtime
│   └── package.json
├── web-realtime/
│   ├── src/
│   │   ├── App.jsx        # Application React
│   │   ├── audioUtils.js  # Conversion PCM16
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── mobile/
    ├── App.js             # Application Expo
    ├── audioUtils.js      # Conversion audio mobile
    ├── app.json
    └── package.json
```

## 🚀 Lancement

### 1. Backend (obligatoire)

```bash
cd backend
npm install
OPENAI_API_KEY=sk-votre-cle npm start
```

Windows PowerShell:
```powershell
cd backend
npm install
$env:OPENAI_API_KEY="sk-votre-cle"
node server.js
```

Le serveur démarre sur `ws://localhost:8080`

### 2. Frontend Web

```bash
cd web-realtime
npm install
npm run dev
```

Accéder à `http://localhost:5173`

### 3. Frontend Mobile (Expo)

```bash
cd mobile
npm install
npx expo start
```

Scanner le QR code avec l'app Expo Go.

## 🎯 Commandes Vocales Supportées

| Commande | Exemple | Action |
|----------|---------|--------|
| Ajouter | "Ajoute une climatisation à 2500 euros" | `add_line` |
| Modifier | "Change le prix de la ligne 1 à 3000 euros" | `update_line` |
| Supprimer | "Supprime la dernière ligne" | `delete_line` |
| Client | "Le client c'est Jean Dupont" | `set_client` |
| Remise | "Applique une remise de 10 pourcent" | `set_discount` |
| Nouveau devis | "Crée un nouveau devis" | `create_quote` |
| Facture | "Transforme en facture" | `create_invoice` |
| Envoyer | "Envoie le devis par email" | `send_document` |

## 📋 Format JSON des Intentions

### Ajouter une ligne

```json
{
  "action": "add_line",
  "params": {
    "designation": "Installation climatisation",
    "quantity": 1,
    "unit_price": 2500,
    "unit": "u"
  },
  "message": "J'ajoute une installation climatisation à 2500 euros.",
  "requires_confirmation": false
}
```

### Supprimer une ligne

```json
{
  "action": "delete_line",
  "params": {
    "line_index": -1
  },
  "message": "Je supprime la dernière ligne. Confirmez-vous?",
  "requires_confirmation": true
}
```

### Définir le client

```json
{
  "action": "set_client",
  "params": {
    "name": "Jean Dupont",
    "address": null,
    "phone": null,
    "email": null
  },
  "message": "Client défini: Jean Dupont. Avez-vous son adresse?"
}
```

### Appliquer une remise

```json
{
  "action": "set_discount",
  "params": {
    "type": "percent",
    "value": 10
  },
  "message": "Remise de 10% appliquée."
}
```

### Demander information manquante

```json
{
  "action": "ask_missing_info",
  "params": {
    "field": "client.address",
    "question": "Quelle est l'adresse du client?"
  },
  "message": "Quelle est l'adresse du client?"
}
```

### Envoyer document

```json
{
  "action": "send_document",
  "params": {
    "method": "email",
    "recipient": "client@example.com"
  },
  "message": "Je prépare l'envoi par email."
}
```

## 🔧 Configuration

### Variables d'environnement Backend

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `OPENAI_API_KEY` | Clé API OpenAI | ✅ Oui |
| `PORT` | Port du serveur (défaut: 8080) | Non |
| `DEBUG` | Activer les logs détaillés | Non |

### Configuration Mobile

Modifier `WS_URL` dans `mobile/App.js` pour pointer vers votre serveur:

```javascript
// Pour un appareil physique, utiliser l'IP de votre machine
const WS_URL = 'ws://192.168.1.100:8080';
```

## 📊 Flux de Données

```
┌─────────────┐     Audio PCM16     ┌─────────────┐     WebSocket     ┌─────────────┐
│   Client    │ ─────────────────── │   Backend   │ ──────────────── │   OpenAI    │
│  (Web/App)  │                     │  (Node.js)  │                   │  Realtime   │
└─────────────┘                     └─────────────┘                   └─────────────┘
      │                                    │                                │
      │  1. Capture micro                  │                                │
      │  2. Conversion PCM16               │                                │
      │  3. Envoi WebSocket ──────────────►│                                │
      │                                    │  4. Forward audio ────────────►│
      │                                    │                                │
      │                                    │◄──────── 5. Transcription       │
      │                                    │◄──────── 6. Réponse JSON        │
      │                                    │◄──────── 7. Audio réponse       │
      │◄─────── 8. Intent JSON ────────────│                                │
      │◄─────── 9. Audio TTS ──────────────│                                │
      │                                    │                                │
      │ 10. Mise à jour UI                 │                                │
      │ 11. Lecture audio                  │                                │
      ▼                                    ▼                                ▼
```

## 🔒 Sécurité

- La clé API reste **côté serveur uniquement**
- Le client ne connaît pas la clé OpenAI
- Utilisez HTTPS/WSS en production
- Ajoutez une authentification utilisateur

## 🐛 Dépannage

### "OPENAI_API_KEY non configurée"
Vérifiez que la variable d'environnement est définie avant de lancer le serveur.

### Micro non détecté (Web)
- Utilisez HTTPS ou localhost
- Autorisez l'accès au micro dans le navigateur
- Vérifiez que le micro n'est pas utilisé par une autre app

### Pas de réponse audio
- Vérifiez les logs du backend
- Assurez-vous que le contexte audio est activé (clic utilisateur requis)

### Connexion WebSocket échouée
- Vérifiez que le backend est lancé
- Vérifiez l'URL et le port
- Vérifiez les règles de pare-feu

## 📝 Logs Backend

Les logs affichent:
- `👤` Connexion/déconnexion client
- `🎤` Détection de parole
- `📝` Transcription du texte
- `🎯` Intention JSON parsée
- `❌` Erreurs

Activer le mode debug pour plus de détails:
```bash
DEBUG=1 OPENAI_API_KEY=sk-... npm start
```
