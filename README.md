# 🛡️ TheoProtect

**TheoProtect** est un bot Discord de sécurité avancée 100% open source en Node.js, conçu pour offrir une protection complète contre les raids, le spam, le phishing et les attaques nuke.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)](https://discord.js.org/)

## ✨ Fonctionnalités

### 🔒 Sécurité avancée

#### 🛡️ Anti-Spam intelligent
- Détection multi-niveaux (flood, duplicatas, mentions, emojis, liens)
- Système de scoring dynamique avec sanctions graduelles
- Détection de selfbots et patterns Discord
- 4 niveaux de sécurité : Faible, Moyen, Élevé, Extrême

#### 🚨 Anti-Raid avec détection de patterns
- Analyse intelligente des nouveaux membres (algorithme Levenshtein)
- Détection : comptes jeunes, avatars par défaut, noms suspects
- Mode raid automatique lors de joins massifs (>10 en 10s)
- Système de quarantaine automatique
- Tracking des noms coordonnés (attaques organisées)

#### 🔨 Anti-Nuke révolutionnaire
- Surveillance des actions critiques en temps réel
- Thresholds configurables par type d'action
- Retrait instantané des permissions dangereuses
- Système de backup automatique (salons, rôles, permissions)
- Bannissement automatique des attaquants

#### 🎯 Anti-Phishing en temps réel
- Base de données de patterns mise à jour (Discord Nitro scams, Steam, etc.)
- Intégration Google Safe Browsing API (optionnel)
- Intégration PhishTank pour vérification externe
- Détection de TLDs suspects et homograph attacks
- Système de cache pour optimisation

#### 🔐 Captcha visuel personnalisable
- Génération d'images avec Canvas (distorsion, rotation)
- Codes aléatoires de 6 caractères
- Timeout configurable (5 min par défaut)
- Tentatives limitées (3 max)
- Kick automatique en cas d'échec

### 🤖 Modération puissante

#### Commandes disponibles
- `/warn [user] [reason]` — Avertir un membre
- `/warnings [user]` — Voir les avertissements
- `/clearwarns [user]` — Effacer les warnings
- `/timeout [user] [duration] [reason]` — Timeout
- `/ban [user] [reason]` — Bannir
- `/reputation [user]` — Voir la réputation

#### Modération vocale
- `/voicemod muteall [channel]` — Mute tous les membres
- `/voicemod unmuteall [channel]` — Unmute tous
- `/voicemod disconnectall [channel]` — Déconnecter tous
- `/voicemod moveall [source] [dest]` — Déplacer en masse

### 📊 Fonctionnalités uniques

#### 🏆 Système de réputation
- Score de confiance pour chaque membre (0-200)
- Tracking des violations et actions positives
- Niveaux : Très faible, Faible, Moyen, Bon, Excellent
- Incrémentation automatique pour activité saine

#### 🔒 Smart Lockdown progressif
- **Soft** : Bloque les messages uniquement
- **Medium** : + fichiers et threads
- **Hard** : + vocal complet
- **Raid** : Mode urgence (kick nouveaux membres)
- Auto-escalade selon le niveau de menace

#### 🗄️ Backup & Restauration
- Sauvegarde complète (salons, rôles, permissions)
- Historique des backups avec ID
- Restauration rapide après attaque

#### 📝 Logs détaillés
- Base de données SQLite persistante
- Historique complet des actions de modération
- Tracking des raids avec statistiques
- Preuves conservées (URLs, patterns détectés)

## 🚀 Installation

### Prérequis
- **Node.js 18+** ([télécharger](https://nodejs.org/))
- **NPM** ou Yarn
- Un bot Discord ([Discord Developer Portal](https://discord.com/developers/applications))

### Étapes

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
```

Éditez `.env` :
```env
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id
OWNER_ID=votre_user_id

# Optionnel pour anti-phishing avancé
GOOGLE_SAFE_BROWSING_KEY=votre_api_key
```

4. **Déployer les commandes**
```bash
npm run deploy
```

5. **Lancer le bot**
```bash
npm start
```

Pour le développement avec auto-reload :
```bash
npm run dev
```

## ⚙️ Configuration

### Commandes de configuration

#### Configuration générale
```
/config - Panel interactif de configuration
```

#### Anti-Spam
```
/antispam [niveau] [actif]
Niveaux : low, medium, high, extreme
```

#### Anti-Raid
```
/antiraid [mode]
Modes : off, detection, protection, lockdown
```

#### Smart Lockdown
```
/lockdown activate [niveau] [raison]
/lockdown deactivate
/lockdown status
```

#### Backups
```
/backup create - Créer une sauvegarde
/backup list - Liste des backups
/backup info [id] - Détails d'un backup
```

### Salons recommandés

Créez ces salons pour un fonctionnement optimal :
- **#theoprotect-logs** : Logs de sécurité
- **#vérification** : Captcha pour nouveaux membres

### Rôles recommandés
- **Non vérifié** : Assigné en attendant le captcha
- **Quarantaine** : Pour les comptes suspects

## 🏗️ Architecture

```
theoprotect/
├── src/
│   ├── index.js              # Point d'entrée
│   ├── deploy-commands.js    # Script de déploiement
│   ├── commands/             # Commandes slash
│   │   ├── config.js
│   │   ├── antispam.js
│   │   ├── antiraid.js
│   │   ├── warn.js
│   │   ├── warnings.js
│   │   ├── clearwarns.js
│   │   ├── reputation.js
│   │   ├── backup.js
│   │   ├── lockdown.js
│   │   ├── voicemod.js
│   │   └── stats.js
│   ├── events/               # Event handlers
│   │   ├── ready.js
│   │   ├── messageCreate.js
│   │   ├── guildMemberAdd.js
│   │   ├── interactionCreate.js
│   │   ├── channelDelete.js
│   │   └── roleDelete.js
│   ├── systems/              # Systèmes de protection
│   │   ├── antiSpam.js
│   │   ├── antiRaid.js
│   │   ├── antiNuke.js
│   │   ├── antiPhishing.js
│   │   ├── captcha.js
│   │   └── smartLockdown.js
│   ├── database/             # Gestion BDD
│   │   └── database.js
│   └── config/               # Configuration
│       └── config.js
├── data/                     # Base de données SQLite
├── package.json
├── .env.example
└── README.md
```

## 🎨 Comparaison avec RaidProtect

| Fonctionnalité | RaidProtect | TheoProtect |
|---|:---:|:---:|
| Anti-spam basique | ✅ | ✅ |
| Anti-raid | ✅ | ✅ |
| Captcha | ✅ | ✅ |
| Anti-Nuke | ❌ | ✅ |
| Anti-Phishing en temps réel | ❌ | ✅ |
| Système de réputation | ❌ | ✅ |
| Backup automatique | ❌ | ✅ |
| Smart Lockdown progressif | ❌ | ✅ |
| Modération vocale avancée | ❌ | ✅ |
| Base de données persistante | ❌ | ✅ |
| Logs détaillés avec preuves | ❌ | ✅ |
| Open source | ❌ | ✅ |
| Auto-quarantine intelligente | ❌ | ✅ |
| Détection de patterns ML | ❌ | ✅ |

## 📊 Commandes complètes

### Configuration
| Commande | Description | Permissions |
|---|---|---|
| `/config` | Panel de configuration | Administrateur |
| `/antispam [niveau] [actif]` | Configure l'anti-spam | Gérer le serveur |
| `/antiraid [mode]` | Configure l'anti-raid | Gérer le serveur |

### Modération
| Commande | Description | Permissions |
|---|---|---|
| `/warn [user] [reason]` | Avertir un membre | Modérer les membres |
| `/warnings [user]` | Voir les warnings | Modérer les membres |
| `/clearwarns [user]` | Effacer les warnings | Administrateur |
| `/reputation [user]` | Voir la réputation | Tous |

### Utilitaires
| Commande | Description | Permissions |
|---|---|---|
| `/backup create` | Créer une sauvegarde | Administrateur |
| `/backup list` | Lister les backups | Administrateur |
| `/backup info [id]` | Détails d'un backup | Administrateur |
| `/lockdown activate` | Activer le lockdown | Administrateur |
| `/lockdown deactivate` | Désactiver le lockdown | Administrateur |
| `/lockdown status` | Statut du lockdown | Administrateur |
| `/stats` | Statistiques du serveur | Tous |

### Modération vocale
| Commande | Description | Permissions |
|---|---|---|
| `/voicemod muteall` | Mute tous les membres | Déplacer les membres |
| `/voicemod unmuteall` | Unmute tous | Déplacer les membres |
| `/voicemod disconnectall` | Déconnecter tous | Déplacer les membres |
| `/voicemod moveall` | Déplacer en masse | Déplacer les membres |

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

### Développement local
```bash
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect
npm install
cp .env.example .env
# Éditez .env
npm run dev
```

## 🐛 Rapporter un bug

Ouvrez une [issue](https://github.com/theo7791l/theoprotect/issues) avec :
- Description du problème
- Étapes pour reproduire
- Logs pertinents
- Version de Node.js et Discord.js

## 📜 Licence

MIT © [theo7791l](https://github.com/theo7791l)

Voir [LICENSE](LICENSE) pour plus de détails.

## 🔗 Liens

- [GitHub Repository](https://github.com/theo7791l/theoprotect)
- [Documentation](https://github.com/theo7791l/theoprotect/wiki)
- [Issues](https://github.com/theo7791l/theoprotect/issues)

---

**⚡ Développé avec passion par [theo7791l](https://github.com/theo7791l)**

*TheoProtect est un projet open source indépendant. Il n'est pas affilié à Discord Inc. ou à RaidProtect.*