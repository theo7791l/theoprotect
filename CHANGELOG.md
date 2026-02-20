# Changelog

Toutes les modifications notables de TheoProtect seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [0.0.2-beta] - 2026-02-20

### 🐛 Corrigé

#### Documentation
- **Variables d'environnement** : Harmonisation entre README.md, .env.example et INSTALL.md
  - Remplacement de `APPLICATION_ID` par `CLIENT_ID` pour la cohérence
  - Ajout de `OWNER_ID` dans .env.example (variable obligatoire manquante)
  - Ajout de `GUILD_ID` en optionnel pour le développement
  - Ajout de `DATABASE_PATH` en optionnel
  - Ajout de `OPENAI_API_KEY` et `GOOGLE_SAFE_BROWSING_KEY` en optionnels

#### Scripts npm
- Ajout du script `npm run update` manquant dans package.json
- Ajout de `npm run update:windows` et `npm run update:linux` pour les scripts spécifiques
- Amélioration des mots-clés dans package.json

#### README.md
- Mise à jour de la roadmap pour refléter les fonctionnalités déjà implémentées
  - ✅ Anti-Raid (implémenté)
  - ✅ Captcha (implémenté)
  - ✅ Anti-Nuke (implémenté)
  - ✅ Backup automatique (implémenté)
  - ✅ Anti-Phishing (implémenté)
  - ✅ NSFW Detection (implémenté)
  - ✅ Smart Lockdown (implémenté)
- Ajout d'instructions pour obtenir les tokens Discord
- Amélioration de la section configuration

### ✨ Vérifications
- Tous les fichiers de code (index.js, deploy-commands.js) utilisent déjà `CLIENT_ID` correctement
- Structure des dossiers cohérente : 12 commandes, 8 événements, 12 systèmes de protection
- Dépendances correctement configurées dans package.json
- Scripts de démarrage et de mise à jour présents dans le dossier scripts/

---

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
- **Bad Words** avec liste personnalisable et sanctions progressives
- **NSFW Detection** avec modération automatique des images
- **AI Moderator** avec analyse contextuelle des messages (OpenAI)

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
- `channelCreate` - Surveillance
- `roleDelete` - Anti-nuke
- `guildBanAdd` - Logs

#### Utilitaires
- Système de logs détaillés
- Tracking des violations
- Auto-escalade des sanctions
- Gestion des backups

### 📝 Documentation
- README complet avec installation et configuration
- INSTALL.md détaillé (Windows, Linux, macOS)
- INSTALL_WINDOWS.md spécifique
- CONTRIBUTING.md avec guidelines
- LICENSE MIT
- CHANGELOG.md

### 🔧 Configuration
- Support `.env` pour tokens et APIs
- Configuration par serveur via base de données
- APIs externes optionnelles (Google Safe Browsing, PhishTank)

### 🐛 Problèmes connus
- Certaines commandes peuvent nécessiter un redéploiement après installation
- Dashboard web non implémenté (en cours de développement)

---

## Types de changements
- `✨ Ajouté` - Nouvelles fonctionnalités
- `🔄 Modifié` - Changements dans les fonctionnalités existantes
- `⚠️ Déprécié` - Fonctionnalités qui seront retirées
- `🗑️ Retiré` - Fonctionnalités retirées
- `🐛 Corrigé` - Corrections de bugs
- `🔒 Sécurité` - Correctifs de sécurité
