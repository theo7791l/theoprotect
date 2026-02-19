# Changelog

Toutes les modifications notables de TheoProtect seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [0.0.1-beta] - 2026-02-19

### 🎉 Première release

Version initiale de TheoProtect avec les fonctionnalités de base.

### ✨ Ajouté

#### Systèmes de protection
- **Anti-Spam intelligent** avec détection multi-niveaux (flood, duplicatas, mentions, emojis)
- **Anti-Raid** avec analyse de patterns et algorithme Levenshtein
- **Anti-Nuke** avec surveillance d'actions critiques et backup automatique
- **Anti-Phishing** avec patterns Discord Nitro/Steam + intégration APIs externes
- **Captcha visuel** avec génération d'images Canvas personnalisables
- **Smart Lockdown** avec 4 niveaux progressifs (Soft/Medium/Hard/Raid)

#### Base de données
- Système SQLite avec `better-sqlite3`
- Tables: settings, reputation, warnings, logs, raid_history, backups
- Système de réputation (score 0-200)

#### Commandes
- `/config` - Configuration interactive
- `/antispam` - Configurer l'anti-spam
- `/antiraid` - Configurer l'anti-raid
- `/warn` - Avertir un membre
- `/warnings` - Voir les avertissements
- `/clearwarns` - Effacer les warnings
- `/reputation` - Voir la réputation d'un membre
- `/backup create/list/info` - Gestion des sauvegardes
- `/lockdown` - Verrouiller le serveur
- `/voicemod` - Modération vocale (muteall, unmuteall, disconnectall, moveall)
- `/stats` - Statistiques du serveur
- `/update` - Système de mise à jour automatique

#### Events
- `ready` - Initialisation avec check de version
- `messageCreate` - Anti-spam + Anti-phishing
- `guildMemberAdd` - Anti-raid + Captcha
- `interactionCreate` - Handler de commandes
- `channelDelete` - Anti-nuke
- `roleDelete` - Anti-nuke

#### Utilitaires
- Système de logs détaillés
- Tracking des violations
- Auto-escalade des sanctions
- Gestion des backups

### 📝 Documentation
- README complet avec installation et configuration
- CONTRIBUTING.md avec guidelines
- LICENSE MIT
- CHANGELOG.md

### 🔧 Configuration
- Support `.env` pour tokens et APIs
- Configuration par serveur via base de données
- APIs externes optionnelles (Google Safe Browsing, PhishTank)

### 🐛 Problèmes connus
- Certaines commandes peuvent nécessiter un redéploiement après installation
- Compatibilité Windows à tester (chemins)
- Dashboard web non implémenté
- AI Moderator non implémenté
- Détection NSFW non implémentée

---

## Types de changements
- `✨ Ajouté` - Nouvelles fonctionnalités
- `🔄 Modifié` - Changements dans les fonctionnalités existantes
- `⚠️ Déprécié` - Fonctionnalités qui seront retirées
- `🗑️ Retiré` - Fonctionnalités retirées
- `🐛 Corrigé` - Corrections de bugs
- `🔒 Sécurité` - Correctifs de sécurité