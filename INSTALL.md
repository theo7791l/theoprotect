# 🛠️ Guide d'installation TheoProtect

## Table des matières
- [Prérequis](#prérequis)
- [Installation Windows](#installation-windows)
- [Installation Linux/macOS](#installation-linuxmacos)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Prérequis

### Obligatoires
- **Node.js 18+** : [Télécharger ici](https://nodejs.org/)
- **Git** : [Télécharger ici](https://git-scm.com/)
- **Un bot Discord** : [Créer sur Discord Developer Portal](https://discord.com/developers/applications)

### Optionnels (pour le captcha)
- **Visual Studio Build Tools** (Windows uniquement)
- **Python 3.x** (Windows uniquement)

---

## Installation Windows

### Étape 1 : Installer Node.js et Git

1. Téléchargez et installez [Node.js LTS](https://nodejs.org/) (version 18 ou supérieure)
2. Téléchargez et installez [Git pour Windows](https://git-scm.com/)
3. Redémarrez votre terminal après installation

### Étape 2 : Cloner le projet

Ouvrez PowerShell ou CMD :

```powershell
cd C:\
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect
```

### Étape 3 : Installer les dépendances

```powershell
npm install
```

**Note** : L'installation de `canvas` peut échouer sur Windows. Ce n'est pas grave, le bot fonctionnera sans (seul le captcha sera désactivé).

#### Si vous voulez activer le captcha (optionnel)

Installez les outils de compilation Windows :

1. **Option 1 (Recommandée)** : Via npm
   ```powershell
   npm install --global windows-build-tools
   ```

2. **Option 2** : Manuellement
   - Installez [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
   - Sélectionnez "Desktop development with C++"
   - Installez [Python 3.x](https://www.python.org/downloads/)

Puis réessayez :
```powershell
npm install canvas
```

### Étape 4 : Configuration

1. Copiez le fichier d'exemple :
```powershell
copy .env.example .env
```

2. Éditez `.env` avec Notepad ou VSCode :
```powershell
notepad .env
```

3. Remplissez vos tokens :
```env
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id
OWNER_ID=votre_discord_user_id
```

### Étape 5 : Déployer les commandes

```powershell
npm run deploy
```

### Étape 6 : Lancer le bot

```powershell
npm start
```

---

## Installation Linux/macOS

### Étape 1 : Installer Node.js et Git

**Ubuntu/Debian :**
```bash
sudo apt update
sudo apt install nodejs npm git python3 build-essential -y
```

**macOS (avec Homebrew) :**
```bash
brew install node git
```

### Étape 2 : Cloner le projet

```bash
cd ~
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect
```

### Étape 3 : Installer les dépendances

```bash
npm install
```

Sur Linux, `canvas` devrait s'installer automatiquement. Si ce n'est pas le cas :

**Ubuntu/Debian :**
```bash
sudo apt install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev librsvg2-dev -y
npm install canvas
```

### Étape 4 : Configuration

```bash
cp .env.example .env
nano .env  # ou vim, ou votre éditeur préféré
```

Remplissez :
```env
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id
OWNER_ID=votre_discord_user_id
```

### Étape 5 : Déployer et lancer

```bash
npm run deploy
npm start
```

---

## Configuration

### Configuration minimale (.env)

```env
# Obligatoire
DISCORD_TOKEN=votre_bot_token
CLIENT_ID=votre_application_id
OWNER_ID=votre_user_id

# Optionnel
GUILD_ID=id_serveur_test  # Pour déploiement rapide en dev
DATABASE_PATH=./data/theoprotect.db

# APIs optionnelles
GOOGLE_SAFE_BROWSING_KEY=votre_api_key  # Anti-phishing avancé
```

### Obtenir vos tokens Discord

1. **Bot Token et Client ID** :
   - Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créez une application ou sélectionnez-en une
   - Onglet "Bot" : Copiez le **Token**
   - Onglet "OAuth2" : Copiez **Client ID**

2. **Owner ID (votre ID utilisateur)** :
   - Sur Discord, activez le Mode Développeur (Paramètres > Avancé)
   - Clic droit sur votre profil > Copier l'identifiant

3. **Activer les Intents** :
   - Dans l'onglet "Bot"
   - Activez **MESSAGE CONTENT INTENT**
   - Activez **SERVER MEMBERS INTENT**
   - Activez **PRESENCE INTENT**

### Inviter le bot

Générez un lien d'invitation :

```
https://discord.com/api/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Remplacez `VOTRE_CLIENT_ID` par votre Client ID.

**Permissions recommandées** (valeur 8 = Administrateur) :
- Administrateur (simplifie la configuration)
- Ou permissions détaillées : Manage Server, Kick/Ban Members, Manage Roles, Manage Channels, etc.

---

## Troubleshooting

### ❌ "An invalid token was provided"

**Causes** :
- Token incorrect dans `.env`
- Token expiré (régénérez-le sur le Developer Portal)
- Fichier `.env` mal placé (doit être à la racine du projet)

**Solution** :
1. Vérifiez que `.env` existe dans le dossier `theoprotect/`
2. Copiez le token **en entier** (commence par `M` ou `N`)
3. Pas d'espaces avant/après le token

---

### ❌ "Cannot find package 'canvas'"

**Ce n'est pas une erreur bloquante !** Le bot fonctionne sans Canvas.

**Conséquence** :
- Le système de **captcha visuel** sera désactivé
- Toutes les autres fonctionnalités marchent normalement

**Pour activer le captcha** :

**Windows** :
```powershell
npm install --global windows-build-tools
npm install canvas
```

**Linux** :
```bash
sudo apt install libcairo2-dev libjpeg-dev libpango1.0-dev -y
npm install canvas
```

---

### ❌ Commandes qui ne s'affichent pas

**Solution** :
1. Redéployez les commandes :
   ```bash
   npm run deploy
   ```

2. Attendez jusqu'à 1 heure (commandes globales)
   - Pour un test rapide, utilisez `GUILD_ID` dans `.env`

3. Vérifiez les permissions du bot sur le serveur

---

### ❌ "ENOENT: no such file or directory"

**Windows** : Problème de chemins

**Solution** :
1. Lancez toujours depuis la **racine du projet** :
   ```powershell
   cd C:\TheoProtect
   npm start
   ```

2. Vérifiez que `src/` existe bien

---

### ❌ Le bot se connecte mais ne répond pas

**Causes** :
- Intents non activés sur le Developer Portal
- Permissions insuffisantes sur le serveur
- Commandes non déployées

**Solution** :
1. Developer Portal > Bot > Activez tous les Privileged Gateway Intents
2. Donnez le rôle Administrateur au bot (temporairement pour tester)
3. Redéployez : `npm run deploy`

---

### 🐛 Erreur de database

**Solution** :
1. Supprimez le fichier de base de données :
   ```bash
   rm -rf data/
   ```

2. Redémarrez le bot (il recréera la DB automatiquement)

---

## 🚀 Lancer en production

### Avec PM2 (recommandé)

```bash
npm install -g pm2
pm2 start src/index.js --name theoprotect
pm2 save
pm2 startup  # Auto-start au boot
```

Commandes utiles :
```bash
pm2 logs theoprotect     # Voir les logs
pm2 restart theoprotect  # Redémarrer
pm2 stop theoprotect     # Arrêter
```

### Avec systemd (Linux)

Créez `/etc/systemd/system/theoprotect.service` :

```ini
[Unit]
Description=TheoProtect Discord Bot
After=network.target

[Service]
Type=simple
User=votre_user
WorkingDirectory=/chemin/vers/theoprotect
ExecStart=/usr/bin/node src/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Puis :
```bash
sudo systemctl daemon-reload
sudo systemctl enable theoprotect
sudo systemctl start theoprotect
```

---

## 📚 Ressources

- [Discord Developer Portal](https://discord.com/developers/docs)
- [Discord.js Guide](https://discordjs.guide/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Issues GitHub](https://github.com/theo7791l/theoprotect/issues)

---

**Besoin d'aide ?** Ouvrez une [issue](https://github.com/theo7791l/theoprotect/issues) sur GitHub !