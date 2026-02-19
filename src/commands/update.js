import pkg from 'discord.js';
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = pkg;
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { platform } from 'os';
import { resolve } from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

export default {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Mettre à jour TheoProtect')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Vérifier les mises à jour disponibles')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('install')
        .setDescription('Installer la dernière version et redémarrer automatiquement')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('script')
        .setDescription('Télécharger le script de mise à jour manuel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('version')
        .setDescription('Voir la version actuelle')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'version') {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
      const currentVersion = packageJson.version;

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📦 Version de TheoProtect')
        .addFields(
          { name: 'Version actuelle', value: `v${currentVersion}`, inline: true },
          { name: 'Discord.js', value: packageJson.dependencies['discord.js'], inline: true },
          { name: 'Node.js', value: process.version, inline: true },
          { name: 'Plateforme', value: platform(), inline: true }
        )
        .setFooter({ text: 'TheoProtect - Protection avancée' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    else if (subcommand === 'check') {
      await interaction.deferReply({ ephemeral: true });

      try {
        const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
        const currentVersion = packageJson.version;

        // Récupérer la dernière release (si disponible)
        try {
          const response = await axios.get(
            'https://api.github.com/repos/theo7791l/theoprotect/releases/latest',
            { timeout: 10000 }
          );

          const latestVersion = response.data.tag_name.replace('v', '');
          const releaseNotes = response.data.body || 'Aucune note de version';
          const publishedAt = new Date(response.data.published_at);
          const downloadUrl = response.data.html_url;

          const isUpToDate = currentVersion === latestVersion;

          const embed = new EmbedBuilder()
            .setColor(isUpToDate ? 0x00ff00 : 0xffa500)
            .setTitle(isUpToDate ? '✅ Vous êtes à jour !' : '🔄 Mise à jour disponible')
            .addFields(
              { name: '📌 Version actuelle', value: `v${currentVersion}`, inline: true },
              { name: '🆕 Dernière version', value: `v${latestVersion}`, inline: true },
              { name: '📅 Publiée le', value: `<t:${Math.floor(publishedAt.getTime() / 1000)}:R>`, inline: true }
            );

          if (!isUpToDate) {
            embed.addFields({
              name: '📝 Notes de version',
              value: releaseNotes.length > 1024 ? releaseNotes.substring(0, 1021) + '...' : releaseNotes
            });
            embed.addFields({
              name: '🔄 Comment mettre à jour',
              value: 
                `**Option 1 (Automatique + Restart) :**\n` +
                `\`/update install\` → Mise à jour + redémarrage auto\n\n` +
                `**Option 2 (Terminal) :**\n` +
                `\`\`\`bash\ngit pull origin main\nnpm install\nnpm run deploy\nnpm start\n\`\`\`\n\n` +
                `**Option 3 (Manuel) :**\n` +
                `[Télécharger la release](${downloadUrl})`,
              inline: false
            });
          }

          embed.setFooter({ text: 'TheoProtect Auto-Update' })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } catch (releaseError) {
          // Pas de release, afficher le dernier commit
          const commitResponse = await axios.get(
            'https://api.github.com/repos/theo7791l/theoprotect/commits/main',
            { timeout: 10000 }
          );

          const latestCommit = commitResponse.data.sha.substring(0, 7);
          const commitDate = new Date(commitResponse.data.commit.author.date);
          const commitMessage = commitResponse.data.commit.message;

          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('🔄 Dernière version disponible')
            .addFields(
              { name: '📌 Version actuelle', value: `v${currentVersion}`, inline: true },
              { name: '🔖 Dernier commit', value: latestCommit, inline: true },
              { name: '📅 Date', value: `<t:${Math.floor(commitDate.getTime() / 1000)}:R>`, inline: true },
              { name: '📝 Dernier changement', value: commitMessage.substring(0, 1024) }
            )
            .setDescription(
              '**Pour mettre à jour :**\n' +
              '• `/update install` (automatique + redémarrage)\n' +
              '• Terminal : `git pull && npm install && npm run deploy`\n' +
              '• Manuel : Télécharger depuis [GitHub](https://github.com/theo7791l/theoprotect)'
            )
            .setFooter({ text: 'Aucune release trouvée, affichage du dernier commit' })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        }
      } catch (error) {
        console.error('[Update] Check failed:', error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Erreur de vérification')
          .setDescription(
            'Impossible de contacter GitHub.\n\n' +
            '**Vérifiez :**\n' +
            '• Votre connexion internet\n' +
            '• L\'accès à GitHub\n\n' +
            'Réessayez dans quelques instants.'
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
    else if (subcommand === 'script') {
      const isWindows = platform() === 'win32';
      const scriptName = isWindows ? 'update.bat' : 'update.sh';
      const scriptPath = resolve(`./scripts/${scriptName}`);

      if (!existsSync(scriptPath)) {
        return interaction.reply({
          content: `❌ Script \`${scriptName}\` introuvable dans le dossier \`scripts/\`.\n\n💡 Téléchargez-le depuis GitHub : https://github.com/theo7791l/theoprotect/tree/main/scripts`,
          ephemeral: true
        });
      }

      const instructions = isWindows
        ? `**Windows :**\n1. Ouvrez le dossier du bot\n2. Double-cliquez sur \`scripts/update.bat\`\n3. Suivez les instructions\n\nOu en ligne de commande :\n\`\`\`\ncd C:\\TheoProtect\\theoprotect\\scripts\nupdate.bat\n\`\`\``
        : `**Linux/macOS :**\n1. Ouvrez un terminal dans le dossier du bot\n2. Rendez le script exécutable :\n\`\`\`bash\nchmod +x scripts/update.sh\n\`\`\`\n3. Lancez-le :\n\`\`\`bash\n./scripts/update.sh\n\`\`\``;

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📜 Script de mise à jour manuel')
        .setDescription(
          `Le script \`${scriptName}\` permet de mettre à jour le bot automatiquement.\n\n${instructions}`
        )
        .addFields(
          { 
            name: '✨ Fonctionnalités', 
            value: '• Vérifie les mises à jour\n• Sauvegarde votre .env\n• Télécharge et installe automatiquement\n• Redéploie les commandes' 
          }
        )
        .setFooter({ text: 'Script disponible dans le dossier scripts/' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    else if (subcommand === 'install') {
      await interaction.deferReply({ ephemeral: true });

      // Check if Git is available
      try {
        await execAsync('git --version');
      } catch (error) {
        return interaction.editReply(
          '❌ **Git n\'est pas installé !**\n\n' +
          '📥 Téléchargez Git depuis : https://git-scm.com/\n\n' +
          'Ou utilisez `/update script` pour une mise à jour manuelle.'
        );
      }

      // Check if we're in a Git repository
      if (!existsSync('.git')) {
        return interaction.editReply(
          '❌ **Ce n\'est pas un dépôt Git !**\n\n' +
          '💡 Le dossier n\'a pas été cloné avec Git.\n\n' +
          '**Solutions :**\n' +
          '• Utilisez `/update script` pour une mise à jour manuelle\n' +
          '• Téléchargez depuis [GitHub](https://github.com/theo7791l/theoprotect)\n' +
          '• Clonez avec : `git clone https://github.com/theo7791l/theoprotect.git`'
        );
      }

      try {
        await interaction.editReply('🔍 Vérification des mises à jour...');

        // Fetch latest changes
        await execAsync('git fetch origin main');

        // Check if updates are available
        const { stdout: diffOutput } = await execAsync('git rev-list HEAD...origin/main --count');
        const updatesAvailable = parseInt(diffOutput.trim());

        if (updatesAvailable === 0) {
          return interaction.editReply('✅ Déjà à jour ! Aucune modification nécessaire.');
        }

        await interaction.editReply(`📦 ${updatesAvailable} mise(s) à jour disponible(s)\n\n🔄 Téléchargement...`);

        // Pull from git
        const { stdout: pullOutput, stderr: pullStderr } = await execAsync('git pull origin main');
        
        // Vérifier si c'est vraiment une erreur (ignorer les warnings normaux)
        const hasCriticalError = pullStderr && !pullStderr.includes('Already up to date') && !pullStderr.includes('From https://github');
        
        if (hasCriticalError) {
          console.warn('[Update] Git stderr (non-fatal):', pullStderr);
        }

        // Si le pull a réussi (même avec stderr non critique)
        if (pullOutput.includes('Already up to date') || pullOutput.includes('Fast-forward') || pullOutput.includes('files changed')) {
          await interaction.editReply('📦 Installation des dépendances...');

          // Install dependencies (ignorer les warnings npm)
          try {
            await execAsync('npm install', { timeout: 120000 }); // 2 min timeout
          } catch (npmError) {
            // Si npm install échoue partiellement, continuer quand même
            console.warn('[Update] npm install warnings:', npmError.stderr || npmError.message);
          }

          await interaction.editReply('⚙️ Déploiement des commandes...');

          // Deploy commands
          await execAsync('npm run deploy');

          const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Mise à jour terminée !')
            .setDescription(
              '🔄 **Le bot va redémarrer automatiquement dans 5 secondes...**\n\n' +
              '✨ Toutes les nouvelles fonctionnalités seront activées au redémarrage.\n\n' +
              '⚠️ **Note :** Si vous utilisez PM2, systemd ou Docker, le redémarrage sera automatique.\n' +
              '⚠️ **Sinon**, relancez manuellement avec `npm start` si le bot ne redémarre pas.'
            )
            .addFields(
              { name: '📝 Changements appliqués', value: pullOutput.substring(0, 1000) || 'Mises à jour installées avec succès' }
            )
            .setFooter({ text: 'Redémarrage automatique en cours...' })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });

          // Log restart
          console.log('');
          console.log('══════════════════════════════════════════════════');
          console.log('🔄 AUTO-RESTART: Update completed, restarting bot...');
          console.log('══════════════════════════════════════════════════');
          console.log('');

          // Restart bot after 5 seconds
          setTimeout(() => {
            process.exit(0); // Exit code 0 = normal exit, PM2/systemd will auto-restart
          }, 5000);
        } else {
          throw new Error('Échec du git pull : ' + pullOutput);
        }

      } catch (error) {
        console.error('[Update] Install failed:', error);

        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Échec de la mise à jour')
          .setDescription(
            '**Erreur :**\n```\n' + (error.message || error.stderr || error).toString().substring(0, 1000) + '\n```\n\n' +
            '**Solutions :**\n' +
            '• Utilisez `/update script` pour une mise à jour manuelle\n' +
            '• Vérifiez que Git est installé et configuré\n' +
            '• Assurez-vous d\'être dans un dépôt Git valide\n' +
            '• Vérifiez les permissions du dossier\n\n' +
            '📚 Guide : [INSTALL.md](https://github.com/theo7791l/theoprotect/blob/main/INSTALL.md)'
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  }
};