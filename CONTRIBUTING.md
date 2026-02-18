# Guide de contribution à TheoProtect

Merci de ton intérêt pour contribuer à TheoProtect ! 🎉

## 📜 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Développement local](#développement-local)
- [Guidelines de code](#guidelines-de-code)
- [Soumettre une Pull Request](#soumettre-une-pull-request)

## Code de conduite

En participant à ce projet, tu acceptes de respecter notre code de conduite :

- Être respectueux envers tous les contributeurs
- Accepter les critiques constructives
- Se concentrer sur ce qui est meilleur pour la communauté
- Montrer de l'empathie envers les autres membres

## Comment contribuer

### Rapporter des bugs 🐛

Avant de rapporter un bug, vérifie qu'il n'a pas déjà été signalé dans les [issues](https://github.com/theo7791l/theoprotect/issues).

Pour rapporter un bug, ouvre une issue avec :
- **Titre clair** : Résume le problème en une phrase
- **Description détaillée** : Explique le comportement attendu vs actuel
- **Étapes pour reproduire** : Liste les actions qui mènent au bug
- **Environnement** : Node.js version, OS, Discord.js version
- **Logs** : Copie les logs d'erreur pertinents

### Proposer des fonctionnalités 💡

Pour proposer une nouvelle fonctionnalité :
1. Ouvre une issue avec le tag `enhancement`
2. Décris la fonctionnalité et son utilité
3. Explique comment elle devrait fonctionner
4. Discute avec la communauté avant de coder

### Améliorer la documentation 📚

La documentation peut toujours être améliorée :
- Corriger des fautes de frappe
- Clarifier des explications
- Ajouter des exemples
- Traduire en d'autres langues

## Développement local

### Prérequis

- Node.js 18+
- Git
- Un éditeur de code (VSCode recommandé)

### Installation

1. **Fork le repo** sur GitHub

2. **Clone ton fork**
```bash
git clone https://github.com/TON_USERNAME/theoprotect.git
cd theoprotect
```

3. **Ajoute le repo original comme remote**
```bash
git remote add upstream https://github.com/theo7791l/theoprotect.git
```

4. **Installe les dépendances**
```bash
npm install
```

5. **Configure ton environnement**
```bash
cp .env.example .env
# Édite .env avec tes tokens de test
```

6. **Crée une branche**
```bash
git checkout -b feature/ma-fonctionnalite
```

### Tester localement

```bash
npm run dev
```

Le bot se lance avec auto-reload pour développer rapidement.

## Guidelines de code

### Style de code

- **Indentation** : 2 espaces
- **Quotes** : Simple quotes `'` pour les strings
- **Semicolons** : Toujours utiliser `;`
- **Naming** : camelCase pour variables/fonctions, PascalCase pour classes

### Bonnes pratiques

1. **Commentaires** : Commente le "pourquoi", pas le "quoi"
```javascript
// ❌ Mauvais
// Incrémente le compteur
count++;

// ✅ Bon
// On compte les warnings pour déclencher un ban automatique à 5
count++;
```

2. **Gestion d'erreurs** : Toujours wrap les appels Discord.js dans try/catch
```javascript
try {
  await message.delete();
} catch (error) {
  console.error('[AntiSpam] Failed to delete message:', error);
}
```

3. **Async/await** : Utilise async/await plutôt que .then()
```javascript
// ❌ Évite
message.channel.send('Hello').then(() => console.log('Sent'));

// ✅ Préfère
await message.channel.send('Hello');
console.log('Sent');
```

4. **Logging** : Utilise des prefixes clairs
```javascript
console.log('[AntiSpam] Message analyzed');
console.error('[Database] Connection failed');
```

### Structure d'une commande

```javascript
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('commande')
    .setDescription('Description')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Logique de la commande
    await interaction.reply({ content: 'Réponse', ephemeral: true });
  }
};
```

### Structure d'un event

```javascript
export default {
  name: 'eventName',
  once: false, // true si l'événement ne doit se déclencher qu'une fois
  async execute(...args) {
    // Logique de l'événement
  }
};
```

## Soumettre une Pull Request

### Avant de soumettre

1. **Teste ton code** : Vérifie que tout fonctionne
2. **Vérifie les conflicts** : Merge `upstream/main` dans ta branche
3. **Commits clairs** : Utilise des messages descriptifs

### Convention de commits

Utilise des prefixes pour les commits :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage, pas de changement de logique
- `refactor:` Refactoring de code
- `test:` Ajout/modification de tests
- `chore:` Maintenance (dépendances, config)

Exemples :
```bash
feat: add voice moderation commands
fix: captcha timeout not working
docs: update installation guide
```

### Créer la Pull Request

1. **Push ta branche**
```bash
git push origin feature/ma-fonctionnalite
```

2. **Ouvre une PR sur GitHub**

3. **Décris les changements** :
   - Que fait cette PR ?
   - Pourquoi ce changement est nécessaire ?
   - Comment l'as-tu testé ?
   - Screenshots si pertinent

4. **Lie l'issue** si elle existe : `Fixes #123`

### Après la soumission

- Réponds aux commentaires de review
- Fais les modifications demandées
- Push les updates sur la même branche

## Questions ?

Si tu as des questions, n'hésite pas à :
- Ouvrir une issue avec le tag `question`
- Rejoindre notre serveur Discord (lien dans le README)

Merci de contribuer à TheoProtect ! 🚀