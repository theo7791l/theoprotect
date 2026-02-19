import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
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
        .setDescription('Installer la dernière version (REDÉMARRE LE BOT)')
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
          { name: 'Node.js', value: process.version, inline: true }
        )
        .setFooter({ text: 'TheoProtect - Protection avancée' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    else if (subcommand === 'check') {
      await interaction.deferReply({ ephemeral: true });

      try {
        // Get current version
        const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
        const currentVersion = packageJson.version;

        // Fetch latest release from GitHub
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
          )
          .setFooter({ text: 'Utilisez /update install pour mettre à jour' })
          .setTimestamp();

        if (!isUpToDate) {
          embed.addFields({
            name: '📝 Notes de version',
            value: releaseNotes.substring(0, 1024) // Discord limit
          });
        }

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
    else if (subcommand === 'install') {
      await interaction.deferReply({ ephemeral: true });

      // Security check: owner only
      if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.editReply('❌ Seul le propriétaire du bot peut installer des mises à jour.');
      }

      try {
        await interaction.editReply('🔄 Téléchargement de la dernière version...');

        // Pull from git
        const { stdout: pullOutput, stderr: pullError } = await execAsync('git pull');
        
        if (pullError && !pullError.includes('Already up to date')) {
          throw new Error(pullError);
        }

        if (pullOutput.includes('Already up to date')) {
          return interaction.editReply('✅ Déjà à jour ! Aucune modification nécessaire.');
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
            '1. Vérifiez que Git est installé\n' +
            '2. Assurez-vous d\'être dans un dépôt Git valide\n' +
            '3. Vérifiez les permissions du dossier\n' +
            '4. Mettez à jour manuellement avec `git pull && npm install`'
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  }
};