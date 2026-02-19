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

## 🚀 Installation rapide

### Windows

```powershell
# 1. Clone le projet
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect

# 2. Installe les dépendances
npm install

# 3. Configure
copy .env.example .env
notepad .env

# 4. Déploie et lance
npm run deploy
scripts\start.bat
```

### Linux/macOS

```bash
# 1. Clone le projet
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect

# 2. Installe les dépendances
npm install

# 3. Configure
cp .env.example .env
nano .env

# 4. Déploie et lance
npm run deploy
chmod +x scripts/start.sh
./scripts/start.sh
```

## 🔄 Mise à jour

### Option 1 : Depuis Discord (automatique)

```
/update check    # Vérifier les mises à jour
/update install  # Installer automatiquement
```

### Option 2 : Avec le script (recommandé)

**Windows :**
```powershell
cd theoprotect\scripts
update.bat
```

**Linux/macOS :**
```bash
cd theoprotect/scripts
chmod +x update.sh
./update.sh
```

### Option 3 : Manuel

```bash
git pull origin main
npm install
npm run deploy
npm start
```

## ⚙️ Configuration

### Fichier `.env`

```env
# Obligatoire
DISCORD_TOKEN=votre_bot_token
CLIENT_ID=votre_client_id
OWNER_ID=votre_user_id

# Optionnel
GUILD_ID=id_serveur_test  # Pour déploiement rapide en dev
DATABASE_PATH=./data/theoprotect.db

# APIs optionnelles
GOOGLE_SAFE_BROWSING_KEY=votre_api_key  # Anti-phishing avancé
```

### Commandes de configuration

```
/config              # Panel interactif
/antispam [niveau]   # low, medium, high, extreme
/antiraid [mode]     # off, detection, protection, lockdown
/lockdown activate   # Verrouiller le serveur
/backup create       # Créer une sauvegarde
```

## 📚 Documentation complète

- [📖 Guide d'installation détaillé](INSTALL.md)
- [📝 Changelog](CHANGELOG.md)
- [🤝 Guide de contribution](CONTRIBUTING.md)
- [🐛 Rapporter un bug](https://github.com/theo7791l/theoprotect/issues)

## 🎨 Comparaison avec RaidProtect

| Fonctionnalité | RaidProtect | TheoProtect |
|---|:---:|:---:|
| Anti-spam basique | ✅ | ✅ |
| Anti-raid | ✅ | ✅ |
| Captcha | ✅ | ✅ |
| Anti-Nuke | ❌ | ✅ |
| Anti-Phishing temps réel | ❌ | ✅ |
| Système de réputation | ❌ | ✅ |
| Backup automatique | ❌ | ✅ |
| Smart Lockdown progressif | ❌ | ✅ |
| Modération vocale avancée | ❌ | ✅ |
| Base de données persistante | ❌ | ✅ |
| Logs détaillés avec preuves | ❌ | ✅ |
| **Auto-update intégré** | ❌ | ✅ |
| Open source | ❌ | ✅ |
| Auto-quarantine intelligente | ❌ | ✅ |
| Détection de patterns ML | ❌ | ✅ |

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

## 📄 Licence

MIT © [theo7791l](https://github.com/theo7791l)

Voir [LICENSE](LICENSE) pour plus de détails.

## 🔗 Liens

- [GitHub Repository](https://github.com/theo7791l/theoprotect)
- [Documentation](https://github.com/theo7791l/theoprotect/wiki)
- [Issues](https://github.com/theo7791l/theoprotect/issues)

---

**⚡ Développé avec passion par [theo7791l](https://github.com/theo7791l)**

*TheoProtect est un projet open source indépendant. Il n'est pas affilié à Discord Inc. ou à RaidProtect.*