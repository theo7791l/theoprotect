# 🛡️ TheoProtect

**Bot Discord de sécurité avancée** - Anti-spam, Anti-Raid, Anti-Nuke, et plus encore.

## ✨ Fonctionnalités

### 🚨 Protection Automatique
- **Anti-Spam** : Détection intelligente avec sanctions progressives
- **Anti-Flood** : Suppression automatique des messages massifs
- **Bad Words** : Filtrage de langage inapproprié avec avertissements
- **Bot Spam Detection** : Suppression silencieuse des messages de bots spammeurs
- **Auto-Cleanup** : Nettoyage automatique du salon après détection de flood

### 📊 Dashboard Web
- **Stats en temps réel** : Graphiques et compteurs en direct
- **Logs complets** : Historique de toutes les actions
- **Gestion serveurs** : Vue d'ensemble de tous les serveurs protégés
- **WebSocket** : Mises à jour instantanées sans rechargement

### 🔧 Commandes
- `/update check` - Vérifier les mises à jour
- `/update install` - Installer et redémarrer automatiquement
- `/update version` - Voir la version actuelle

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- Git
- Windows/Linux/macOS

### Installation rapide

```bash
# 1. Cloner le repository
git clone https://github.com/theo7791l/theoprotect.git
cd theoprotect

# 2. Installer les dépendances
npm install

# 3. Configurer le bot
cp .env.example .env
# Éditez .env avec votre token Discord

# 4. Déployer les commandes
npm run deploy

# 5. Démarrer le bot
npm start
```

### Accéder au Dashboard

Une fois le bot démarré, le dashboard est accessible sur :
```
http://localhost:3000
```

## ⚙️ Configuration

### Variables d'environnement (.env)

```env
DISCORD_TOKEN=votre_token_discord
APPLICATION_ID=votre_application_id
DASHBOARD_PORT=3000
```

### Permissions requises pour le bot

Le bot a besoin des permissions suivantes :
- ✅ **Manage Messages** (Gérer les messages)
- ✅ **Timeout Members** (Exclure temporairement des membres)
- ✅ **Kick Members** (Expulser des membres) - optionnel
- ✅ **Ban Members** (Bannir des membres) - optionnel
- ✅ **Read Message History** (Lire l'historique des messages)
- ✅ **View Channels** (Voir les salons)

## 📊 Dashboard Features

### Stats en temps réel
- Messages modérés
- Bad Words détectés
- Flood détecté
- Utilisateurs mute
- Kicks et Bans

### Logs détaillés
- Horodatage précis
- Type d'action
- ID utilisateur et serveur
- Détails supplémentaires

### Gestion serveurs
- Statut anti-spam
- Niveau de protection
- Statistiques par serveur

## 🔄 Mise à jour

### Automatique (recommandé)
```bash
npm run update
# ou via Discord:
/update install
```

### Manuelle
```bash
git pull origin main
npm install
npm run deploy
npm start
```

## 🛡️ Sécurité

### Détection de Spam
- **Single Message Flood** : Messages longs, répétitifs ou avec caractères spéciaux
- **Global Flood** : 10+ messages en 5 secondes
- **Bot Spam** : Détection et suppression silencieuse
- **Auto-Cleanup** : Nettoyage automatique du salon après détection

### Sanctions progressives
1. **1er flood** : Mute 5 minutes + avertissement
2. **2e flood** : Mute 30 minutes
3. **3e flood** : Kick du serveur

### Bad Words
1. **1er avertissement** : Message supprimé + avertissement
2. **2e avertissement** : Mute 10 minutes

## 📝 Logs

Le bot log automatiquement toutes les actions dans :
- **Console** : Logs en temps réel
- **Database** : Historique complet en SQLite
- **Dashboard** : Visualisation web
- **Salon #logs** : Embeds Discord détaillés

## 👥 Support

Problème ou question ?
- 🐛 [Issues GitHub](https://github.com/theo7791l/theoprotect/issues)
- 📚 [Documentation](https://github.com/theo7791l/theoprotect/wiki)

## 📜 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails

## 🚀 Roadmap

- [x] Anti-Spam avancé
- [x] Anti-Flood avec cleanup automatique
- [x] Bad Words detection
- [x] Dashboard web
- [x] Système de réputation
- [ ] Anti-Raid
- [ ] Captcha
- [ ] Anti-Nuke
- [ ] Backup automatique

---

**Fait avec ❤️ par [theo7791l](https://github.com/theo7791l)**
