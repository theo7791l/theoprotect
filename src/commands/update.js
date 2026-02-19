import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
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
        .setDescription('Installer la dernière version automatiquement')
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

        const response = await axios.get(
          'https://api.github.com/repos/theo7791l/theoprotect/releases/latest',
          { timeout: 10000 }
        );

        const latestVersion = response.data.tag_name.replace('v', '');
        const releaseNotes = response.data.body || 'Aucune note de version';
        const publishedAt = new Date(response.data.published_at);

        const isUpToDate = currentVersion === latestVersion;

        const embed = new EmbedBuilder()
          .setColor(isUpToDate ? 0x00ff00 : 0xffa500)
          .setTitle(isUpToDate ? '✅ Vous êtes à jour !' : '🔄 Mise à jour disponible')
          .addFields(
            { name: 'Version actuelle', value: `v${currentVersion}`, inline: true },
            { name: 'Dernière version', value: `v${latestVersion}`, inline: true },
            { name: 'Publiée le', value: `<t:${Math.floor(publishedAt.getTime() / 1000)}:R>`, inline: true }
          );

        if (!isUpToDate) {
          embed.addFields({
            name: '📝 Notes de version',
            value: releaseNotes.substring(0, 1024)
          });
          embed.addFields({
            name: '🔄 Pour mettre à jour',
            value: 
              `**Option 1 (Automatique):**\n` +
              `\`/update install\` (nécessite Git)\n\n` +
              `**Option 2 (Script manuel):**\n` +
              `\`/update script\` puis exécutez le script\n\n` +
              `**Option 3 (Manuel):**\n` +
              `\`\`\`\ngit pull origin main\nnpm install\nnpm run deploy\n\`\`\``,
            inline: false
          });
        }

        embed.setFooter({ text: 'TheoProtect Auto-Update' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('[Update] Check failed:', error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Erreur de vérification')
          .setDescription(
            error.response?.status === 404 
              ? 'Aucune release trouvée sur GitHub.'
              : 'Impossible de contacter GitHub. Vérifiez votre connexion.'
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
        ? `**Windows:**\n1. Ouvrez le dossier du bot\n2. Double-cliquez sur \`scripts/update.bat\`\n3. Suivez les instructions\n\nOu en ligne de commande :\n\`\`\`\ncd C:\\TheoProtect\\scripts\nupdate.bat\n\`\`\``
        : `**Linux/macOS:**\n1. Ouvrez un terminal dans le dossier du bot\n2. Rendez le script exécutable :\n\`\`\`bash\nchmod +x scripts/update.sh\n\`\`\`\n3. Lancez-le :\n\`\`\`bash\n./scripts/update.sh\n\`\`\``;

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

      // Security check: owner only
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.editReply('❌ Seul le propriétaire du bot peut installer des mises à jour.');
      }

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
          '**Solution :** Utilisez `/update script` ou téléchargez manuellement depuis GitHub.'
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
        const { stdout: pullOutput, stderr: pullError } = await execAsync('git pull origin main');
        
        if (pullError && !pullError.includes('Already up to date')) {
          throw new Error(pullError);
        }

        await interaction.editReply('📦 Installation des dépendances...');

        // Install dependencies
        await execAsync('npm install');

        await interaction.editReply('⚙️ Déploiement des commandes...');

        // Deploy commands
        await execAsync('npm run deploy');

        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('✅ Mise à jour terminée !')
          .setDescription(
            '**Le bot va redémarrer dans 5 secondes.**\n\n' +
            '⚠️ Si vous utilisez PM2 ou un gestionnaire de processus, le redémarrage sera automatique.\n' +
            '⚠️ Sinon, relancez manuellement le bot avec `npm start`.'
          )
          .addFields(
            { name: 'Changements', value: pullOutput.substring(0, 1024) || 'Voir les logs Git' }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Restart bot after 5 seconds
        setTimeout(() => {
          console.log('🔄 Restarting bot after update...');
          process.exit(0); // PM2/systemd will auto-restart
        }, 5000);

      } catch (error) {
        console.error('[Update] Install failed:', error);

        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ Échec de la mise à jour')
          .setDescription(
            '**Erreur:**\n```\n' + error.message.substring(0, 1000) + '\n```\n\n' +
            '**Solutions:**\n' +
            '1. Utilisez `/update script` pour une mise à jour manuelle\n' +
            '2. Vérifiez que Git est installé et configuré\n' +
            '3. Assurez-vous d\'être dans un dépôt Git valide\n' +
            '4. Vérifiez les permissions du dossier\n\n' +
            '📚 Guide complet : https://github.com/theo7791l/theoprotect/blob/main/INSTALL.md'
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  }
};