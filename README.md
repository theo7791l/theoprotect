# 🛡️ TheoProtect

**TheoProtect** est un bot Discord de sécurité avancée en Node.js, conçu pour surpasser RaidProtect avec des fonctionnalités innovantes et une protection complète de votre serveur.

## ✨ Fonctionnalités principales

### 🔒 Sécurité avancée
- **Anti-Raid intelligent** avec détection de patterns et ML
- **Anti-Spam multi-niveaux** (léger, moyen, lourd)
- **Anti-Nuke** avec protection des permissions et rollback automatique
- **Anti-Phishing** avec base de données actualisée en temps réel
- **Captcha visuel** personnalisable avec difficulté variable
- **Vérification 2FA** optionnelle pour les rôles sensibles

### 🤖 AutoMod intelligent
- Détection de toxicité et insultes (multilingue)
- Filtrage d'images NSFW avec IA
- Blocage de liens malveillants et scam
- Détection de selfbots et comportements automatisés
- Anti-flood de mentions, emojis et stickers

### 📊 Modération puissante
- Système de sanctions graduelles (warns → timeout → kick → ban)
- Logs détaillés avec contexte et preuves
- Backup et restauration de serveur
- Modération vocale (mute, deafen, disconnect en masse)
- Gestion des alts et multi-comptes

### 🎯 Fonctionnalités uniques
- **Dashboard web** pour configuration sans commandes
- **AI Moderator** : assistant IA qui analyse les situations complexes
- **Reputation System** : score de confiance pour chaque membre
- **Auto-Quarantine** : isolation automatique des comptes suspects
- **Smart Lockdown** : verrouillage progressif selon la menace
- **Raid History** : analyse des raids avec statistiques

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- NPM ou Yarn
- Un bot Discord (créé sur [Discord Developer Portal](https://discord.com/developers/applications))

### Configuration

1. **Cloner le repo**
```bash
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos tokens
```

4. **Déployer les commandes**
```bash
npm run deploy
```

5. **Lancer le bot**
```bash
npm start
```

## 📖 Utilisation

### Commandes principales

#### Configuration
- `/config` — Panel de configuration interactif
- `/antispam [niveau]` — Configure l'anti-spam (low/medium/high/extreme)
- `/antiraid [mode]` — Active l'anti-raid (off/detection/protection/lockdown)
- `/captcha setup` — Configure le système de captcha

#### Modération
- `/warn [user] [reason]` — Avertir un membre
- `/timeout [user] [duration] [reason]` — Timeout un membre
- `/ban [user] [reason]` — Bannir un membre
- `/massban [users...]` — Ban multiple avec détection de raids
- `/quarantine [user]` — Isoler un membre suspect

#### Utilitaires
- `/backup create` — Sauvegarder le serveur
- `/backup restore [id]` — Restaurer une sauvegarde
- `/lockdown [mode]` — Verrouiller le serveur
- `/nuke-recovery` — Récupération après attaque nuke

## 🏗️ Architecture

```
theoprotect/
├── src/
│   ├── index.js              # Point d'entrée
│   ├── commands/             # Commandes slash
│   ├── events/               # Event handlers
│   ├── systems/              # Systèmes de protection
│   │   ├── antiSpam.js
│   │   ├── antiRaid.js
│   │   ├── antiNuke.js
│   │   ├── antiPhishing.js
│   │   ├── captcha.js
│   │   └── automod.js
│   ├── utils/                # Utilitaires
│   ├── database/             # Gestion BDD
│   └── config/               # Configuration
├── data/                     # Base de données
├── logs/                     # Logs
└── package.json
```

## 🎨 Avantages vs RaidProtect

| Fonctionnalité | RaidProtect | TheoProtect |
|---|:---:|:---:|
| Anti-spam basique | ✅ | ✅ |
| Anti-raid | ✅ | ✅ |
| Captcha | ✅ | ✅ |
| Anti-Nuke | ❌ | ✅ |
| Anti-Phishing en temps réel | ❌ | ✅ |
| Dashboard web | ❌ | ✅ |
| AI Moderator | ❌ | ✅ |
| Détection d'images NSFW | ❌ | ✅ |
| Système de réputation | ❌ | ✅ |
| Backup automatique | ❌ | ✅ |
| Smart Lockdown | ❌ | ✅ |
| Open source | ❌ | ✅ |
| Auto-quarantine | ❌ | ✅ |
| Modération vocale avancée | ❌ | ✅ |

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésite pas à ouvrir une issue ou une pull request.

## 📜 Licence

MIT © [theo7791l](https://github.com/theo7791l)

## 🔗 Liens

- [Documentation complète](https://github.com/theo7791l/theoprotect/wiki)
- [Serveur Discord de support](https://discord.gg/votre-serveur)
- [Inviter le bot](https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands)

---

**⚡ Développé avec passion par [theo7791l](https://github.com/theo7791l)**