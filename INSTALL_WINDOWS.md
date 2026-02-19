# 💻 Guide d'installation Windows

Guide détaillé pour installer TheoProtect sous Windows 10/11.

## 📑 Prérequis

### 1. Installer Node.js

1. Téléchargez Node.js 18+ depuis [nodejs.org](https://nodejs.org/)
2. Lancez l'installateur `.msi`
3. Suivez l'assistant (cochez "Add to PATH")
4. Redémarrez votre terminal
5. Vérifiez l'installation :

```powershell
node --version
npm --version
```

Vous devriez voir :
```
v18.x.x (ou supérieur)
9.x.x (ou supérieur)
```

### 2. Installer Git (optionnel mais recommandé)

1. Téléchargez depuis [git-scm.com](https://git-scm.com/download/win)
2. Installez avec les options par défaut
3. Redémarrez votre terminal

---

## 🚀 Installation

### Méthode 1 : Avec Git (recommandé)

```powershell
# Ouvrir PowerShell ou CMD

# 1. Naviguer vers le dossier de votre choix
cd C:\Users\VotreNom\Documents

# 2. Cloner le repository
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect

# 3. Installer les dépendances
npm install

# Si vous avez des erreurs avec canvas/better-sqlite3 :
npm install --force
```

### Méthode 2 : Téléchargement manuel

1. Allez sur https://github.com/theo7791l/theoprotect
2. Cliquez sur **Code** → **Download ZIP**
3. Extrayez le ZIP dans `C:\Users\VotreNom\Documents\theoprotect`
4. Ouvrez PowerShell dans ce dossier :
   - Clic droit dans le dossier → "Ouvrir dans Terminal"
   - Ou : `cd C:\Users\VotreNom\Documents\theoprotect`
5. Installez les dépendances :

```powershell
npm install
```

---

## ⚙️ Configuration

### 1. Créer le fichier .env

```powershell
# Copier le fichier exemple
copy .env.example .env

# Éditer avec Notepad
notepad .env
```

Ou utilisez VSCode :
```powershell
code .env
```

### 2. Remplir le fichier .env

```env
# REQUIS - Ne pas oublier !
DISCORD_TOKEN=votre_token_ici
CLIENT_ID=votre_client_id
OWNER_ID=votre_user_id

# Pour tester vite (recommandé)
GUILD_ID=id_serveur_test

# Le reste est optionnel
```

### 3. Obtenir votre token Discord

1. Allez sur https://discord.com/developers/applications
2. Créez une nouvelle application
3. Allez dans **Bot**
4. Cliquez sur **Reset Token**
5. Copiez le token dans `.env`

### 4. Activer les Intents

Dans la page **Bot** :
- ✅ Cochez **Presence Intent**
- ✅ Cochez **Server Members Intent**
- ✅ Cochez **Message Content Intent**
- Cliquez sur **Save Changes**

### 5. Inviter le bot

Remplacez `YOUR_CLIENT_ID` par votre Application ID :

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

---

## 🏃 Lancer le bot

### Déployer les commandes (une seule fois)

```powershell
npm run deploy
```

Vous devriez voir :
```
✅ Loaded: config
✅ Loaded: antispam
...
✅ Successfully deployed X commands!
```

### Démarrer le bot

```powershell
npm start
```

Vous devriez voir :
```
✅ Database initialized
✅ Loaded X commands
✅ Loaded X events
🚀 TheoProtect is online!
```

### Mode développement (auto-reload)

```powershell
npm run dev
```

---

## ⚠️ Problèmes courants sous Windows

### Erreur "canvas" lors de l'installation

**Problème** : `npm install` échoue sur `canvas`

**Solution 1** : Installer les outils de build Windows
```powershell
npm install --global windows-build-tools
npm install
```

**Solution 2** : Forcer l'installation
```powershell
npm install --force
```

**Solution 3** : Utiliser une version pré-compilée
```powershell
npm install canvas --canvas_binary_host_mirror=https://github.com/Automattic/node-canvas/releases/download
```

### Erreur "better-sqlite3" lors de l'installation

**Problème** : `npm install` échoue sur `better-sqlite3`

**Solution** : Installer les outils de compilation
```powershell
npm install --global node-gyp
npm config set msvs_version 2019
npm install better-sqlite3 --build-from-source
```

### Erreur "Cannot find module"

**Problème** : `Error: Cannot find module './commands/xxx'`

**Solution** : Vérifiez que vous êtes à la racine du projet
```powershell
cd C:\Users\VotreNom\Documents\theoprotect
npm start
```

### Erreur "ENOENT: no such file or directory"

**Problème** : Le bot ne trouve pas le dossier `data/`

**Solution** : Il se crée automatiquement. Si ça persiste :
```powershell
mkdir data
npm start
```

### PowerShell bloque l'exécution de scripts

**Problème** : `cannot be loaded because running scripts is disabled`

**Solution** : Autoriser les scripts (en admin) :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Le bot ne répond pas aux commandes

**Vérifications** :

1. Les commandes sont déployées :
   ```powershell
   npm run deploy
   ```

2. Le bot est en ligne sur Discord

3. Le bot a les permissions nécessaires sur le serveur

4. Les intents sont activés dans le Dev Portal

---

## 🛠️ Maintenance

### Mettre à jour le bot

```powershell
# Arrêter le bot (Ctrl+C)

# Récupérer les mises à jour
git pull

# Mettre à jour les dépendances
npm install

# Redéployer les commandes
npm run deploy

# Redémarrer
npm start
```

### Nettoyer la base de données

```powershell
# Arrêter le bot
# Supprimer la BDD
del data\theoprotect.db
# Redémarrer (nouvelle BDD créée automatiquement)
npm start
```

### Voir les logs en temps réel

Les logs s'affichent directement dans le terminal. Pour les sauvegarder :

```powershell
npm start > logs.txt
```

---

## 📌 Notes importantes

1. **Ne commitez JAMAIS votre `.env`** (il contient votre token)
2. **Lancez toujours depuis la racine** du projet
3. **Redéployez les commandes** après chaque modification
4. **Utilisez `GUILD_ID`** pour tester rapidement (commandes instantanées)
5. **Les chemins Windows** (`\`) sont automatiquement gérés par le bot

---

## ❓ Besoin d'aide ?

- Ouvrez une [issue sur GitHub](https://github.com/theo7791l/theoprotect/issues)
- Vérifiez le [README principal](README.md)
- Consultez les [logs d'erreur]()

---

**Bon courage ! 🚀**