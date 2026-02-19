# 🛡️ TheoProtect

**TheoProtect** est un bot Discord de sécurité avancée 100% open source en Node.js, conçu pour offrir une protection complète contre les raids, le spam, le phishing, le contenu NSFW et les attaques nuke.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14.16.3-blue)](https://discord.js.org/)
[![Windows](https://img.shields.io/badge/Windows-compatible-blue)]()
[![Linux](https://img.shields.io/badge/Linux-compatible-green)]()

> ⚡ **Version 1.0 - Complètement fonctionnel et testé**

---

## ✨ Fonctionnalités

### 🔒 Sécurité avancée

#### 🛡️ Anti-Spam intelligent
- ✅ Détection multi-niveaux (flood, duplicatas, mentions, emojis, liens)
- ✅ Système de scoring dynamique avec sanctions graduelles (warn → timeout → kick → ban)
- ✅ Détection de selfbots et patterns Discord (invites, commandes externes)
- ✅ 4 niveaux de sécurité configurables : Faible, Moyen, Élevé, Extrême
- ✅ Auto-escalade selon le score de violation cumulé

#### 🚨 Anti-Raid avec détection de patterns
- ✅ Analyse intelligente des nouveaux membres (algorithme Levenshtein)
- ✅ Détection : comptes jeunes, avatars par défaut, noms suspects, homograph attacks
- ✅ Mode raid automatique lors de joins massifs (>10 en 10s)
- ✅ Système de quarantaine automatique pour comptes suspects
- ✅ Tracking des noms coordonnés (détection d'attaques organisées)
- ✅ Scores de risque personnalisés par membre

#### 🔨 Anti-Nuke révolutionnaire
- ✅ Surveillance des actions critiques en temps réel
- ✅ Thresholds configurables par type d'action (channel delete, role delete, bans massifs)
- ✅ Retrait instantané des permissions dangereuses avant bannissement
- ✅ Système de backup automatique (salons, rôles, permissions)
- ✅ Logs détaillés dans salon dédié avec preuves

#### 🎯 Anti-Phishing en temps réel
- ✅ Base de données de patterns constamment mise à jour (Discord Nitro scams, Steam, etc.)
- ✅ Intégration Google Safe Browsing API (optionnel avec clé API)
- ✅ Intégration PhishTank pour vérification externe
- ✅ Détection de TLDs suspects (.tk, .ml, .ru, etc.)
- ✅ Détection d'homograph attacks (caractères cyrilliques)
- ✅ Système de cache pour optimisation des performances

#### 🖼️ Détection NSFW (API Sightengine)
- ✅ Analyse automatique des images postées (attachments, embeds, URLs)
- ✅ Détection : nudité, contenu sexuel, gore, contenu offensant
- ✅ Score de confiance par image (0-100%)
- ✅ Actions automatiques selon la sévérité (delete, warn, timeout, ban)
- ✅ Configuration optionnelle (nécessite clés API Sightengine)

#### 🤖 AI Moderator (OpenAI)
- ✅ Analyse intelligente des messages complexes
- ✅ Détection avancée : toxicité, harcèlement, discours haineux, manipulation
- ✅ Contexte utilisateur (historique, réputation, warnings)
- ✅ Catégorisation et scoring de sévérité (0-10)
- ✅ Niveau de confiance pour chaque détection (70% min pour action)
- ✅ Configuration optionnelle (nécessite clé API OpenAI)

#### 🔐 Captcha visuel personnalisable
- ✅ Génération d'images avec Canvas (distorsion, rotation, bruit)
- ✅ Codes aléatoires de 6 caractères
- ✅ Timeout configurable (5 min par défaut)
- ✅ Tentatives limitées (3 max)
- ✅ Kick automatique en cas d'échec ou timeout

### 🤖 Modération puissante

#### Commandes de modération
- ✅ `/warn [user] [reason]` — Avertir un membre avec auto-escalade (3 warns = timeout 1h, 5 warns = ban)
- ✅ `/warnings [user]` — Voir l'historique des avertissements
- ✅ `/clearwarns [user]` — Effacer tous les avertissements
- ✅ `/reputation [user]` — Voir la réputation et le niveau de confiance

#### Modération vocale avancée
- ✅ `/voicemod muteall [channel]` — Mute tous les membres d'un salon vocal
- ✅ `/voicemod unmuteall [channel]` — Unmute tous les membres
- ✅ `/voicemod disconnectall [channel]` — Déconnecter tous les membres
- ✅ `/voicemod moveall [source] [dest]` — Déplacer en masse vers un autre salon

### 📊 Fonctionnalités uniques

#### 🏆 Système de réputation
- ✅ Score de confiance pour chaque membre (0-200)
- ✅ Tracking automatique : messages, violations, actions positives
- ✅ 5 niveaux : Très faible (🔴), Faible (🔴), Moyen (🟠), Bon (🟡), Excellent (🟢)
- ✅ Incrémentation automatique pour activité saine (+0.1 par message)
- ✅ Décrémentation selon les sanctions (-2 à -50)

#### 🔒 Smart Lockdown progressif
- ✅ **Soft** : Bloque uniquement les messages + réactions
- ✅ **Medium** : + fichiers et threads
- ✅ **Hard** : + vocal complet (connect, speak)
- ✅ **Raid** : Mode urgence total (kick nouveaux membres, view channels)
- ✅ Auto-escalade selon le niveau de menace détecté
- ✅ Restauration automatique des permissions originales

#### 🗄️ Backup & Restauration
- ✅ Sauvegarde complète (salons, rôles, permissions, position)
- ✅ Historique des backups avec ID unique
- ✅ Metadata détaillée (date, nombre d'éléments)
- ✅ Stockage en base de données SQLite

#### 📝 Base de données persistante
- ✅ SQLite avec mode WAL (Write-Ahead Logging)
- ✅ Tables : settings, reputation, warnings, logs, raid_history, backups
- ✅ Historique complet des actions de modération avec preuves
- ✅ Statistiques par serveur et par utilisateur

---

## 🚀 Installation

### Prérequis
- **Node.js 18+** ([télécharger](https://nodejs.org/))
- **NPM** (inclus avec Node.js)
- Un bot Discord créé sur le [Discord Developer Portal](https://discord.com/developers/applications)

### 🐧 Installation Linux / macOS

```bash
# 1. Cloner le repository
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
nano .env  # ou vim, code, etc.

# 4. Déployer les commandes
npm run deploy

# 5. Lancer le bot
npm start
```

### 💻 Installation Windows

```powershell
# 1. Cloner le repository
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
copy .env.example .env
notepad .env  # ou VSCode

# 4. Déployer les commandes
npm run deploy

# 5. Lancer le bot
npm start
```

### ⚙️ Configuration du fichier .env

```env
# Configuration de base (REQUIS)
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id
OWNER_ID=votre_user_id

# Pour tester rapidement (optionnel mais recommandé)
GUILD_ID=id_de_votre_serveur_test

# APIs externes (OPTIONNEL - laissez vide pour désactiver)

# Google Safe Browsing (anti-phishing avancé)
# https://developers.google.com/safe-browsing/v4/get-started
GOOGLE_SAFE_BROWSING_KEY=

# Sightengine (détection NSFW)
# https://sightengine.com/
SIGHTENGINE_API_USER=
SIGHTENGINE_API_SECRET=

# OpenAI (AI Moderator)
# https://platform.openai.com/api-keys
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### 🔑 Configuration du bot Discord

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une nouvelle application
3. Allez dans **Bot** → Cliquez sur **Reset Token** pour obtenir votre token
4. **IMPORTANT** : Activez ces intents :
   - ✅ **Presence Intent**
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**
5. Copiez l'**Application ID** (CLIENT_ID)
6. Invitez le bot avec ce lien (remplacez `YOUR_CLIENT_ID`) :

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

---

## ⚙️ Configuration

### Configuration initiale

1. **Créez ces salons** (recommandé) :
   - `#theoprotect-logs` → Logs de sécurité
   - `#vérification` → Salon de captcha

2. **Créez ces rôles** (recommandé) :
   - `Non vérifié` → Assigné en attendant le captcha
   - `Quarantaine` → Pour isoler les comptes suspects

3. **Configurez le bot** avec `/config`

### Commandes de configuration

```bash
/config                              # Panel interactif complet
/antispam [niveau] [actif]           # low/medium/high/extreme
/antiraid [mode]                     # off/detection/protection/lockdown
/lockdown activate [niveau] [raison] # SOFT/MEDIUM/HARD/RAID
/backup create                       # Créer une sauvegarde
/stats                               # Statistiques du serveur
```

---

## 🎨 Comparaison avec RaidProtect

| Fonctionnalité | RaidProtect | TheoProtect |
|---|:---:|:---:|
| Anti-spam basique | ✅ | ✅ |
| Anti-raid | ✅ | ✅ |
| Captcha | ✅ | ✅ |
| Anti-Nuke | ❌ | ✅ |
| Anti-Phishing temps réel | ❌ | ✅ |
| Détection NSFW | ❌ | ✅ |
| AI Moderator | ❌ | ✅ |
| Système réputation | ❌ | ✅ |
| Backup automatique | ❌ | ✅ |
| Smart Lockdown | ❌ | ✅ |
| Modération vocale | ❌ | ✅ |
| Base de données | ❌ | ✅ |
| Logs avec preuves | ❌ | ✅ |
| Open source | ❌ | ✅ |
| Compatible Windows | ❓ | ✅ |
| Détection ML/patterns | ❌ | ✅ |

---

## 📊 Commandes complètes

### Configuration
| Commande | Description | Permissions |
|---|---|---|
| `/config` | Panel de configuration interactif | Administrateur |
| `/antispam [niveau] [actif]` | Configure l'anti-spam | Gérer le serveur |
| `/antiraid [mode]` | Configure l'anti-raid | Gérer le serveur |

### Modération
| Commande | Description | Permissions |
|---|---|---|
| `/warn [user] [reason]` | Avertir (auto-escalade) | Modérer |
| `/warnings [user]` | Historique warnings | Modérer |
| `/clearwarns [user]` | Effacer warnings | Admin |
| `/reputation [user]` | Réputation d'un membre | Tous |

### Utilitaires
| Commande | Description | Permissions |
|---|---|---|
| `/backup create` | Créer sauvegarde | Admin |
| `/backup list` | Liste des backups | Admin |
| `/backup info [id]` | Détails backup | Admin |
| `/lockdown activate` | Verrouiller serveur | Admin |
| `/lockdown deactivate` | Déverrouiller | Admin |
| `/stats` | Statistiques | Tous |

### Modération vocale
| Commande | Description | Permissions |
|---|---|---|
| `/voicemod muteall` | Mute tous | Déplacer |
| `/voicemod unmuteall` | Unmute tous | Déplacer |
| `/voicemod disconnectall` | Déconnecter tous | Déplacer |
| `/voicemod moveall` | Déplacer en masse | Déplacer |

---

## 🐛 Dépannage

### Le bot ne démarre pas

1. Vérifiez que Node.js 18+ est installé : `node --version`
2. Vérifiez que le token est correct dans `.env`
3. Vérifiez que les intents sont activés dans le Dev Portal
4. Vérifiez les logs : le bot affiche des erreurs explicites

### Les commandes n'apparaissent pas

1. Relancez : `npm run deploy`
2. Si vous utilisez `GUILD_ID`, vérifiez qu'il est correct
3. Si vous déployez globalement, attendez jusqu'à 1 heure
4. Vérifiez que le bot a la permission `applications.commands`

### Erreur "Cannot find module"

1. Réinstallez les dépendances : `npm install`
2. Supprimez `node_modules` et refaites `npm install`
3. Vérifiez que vous lancez depuis la racine du projet

### Base de données corr ompue

1. Arrêtez le bot
2. Supprimez `data/theoprotect.db`
3. Redémarrez : une nouvelle BDD sera créée

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📜 Licence

MIT © [theo7791l](https://github.com/theo7791l)

Voir [LICENSE](LICENSE) pour plus de détails.

---

## 🔗 Liens

- [GitHub Repository](https://github.com/theo7791l/theoprotect)
- [Issues](https://github.com/theo7791l/theoprotect/issues)
- [Releases](https://github.com/theo7791l/theoprotect/releases)

---

**⚡ Développé avec passion par [theo7791l](https://github.com/theo7791l)**

*TheoProtect est un projet open source indépendant. Il n'est pas affilié à Discord Inc. ou à RaidProtect.*