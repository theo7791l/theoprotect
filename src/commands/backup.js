import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';
import antiNuke from '../systems/antiNuke.js';

export default {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Gérer les sauvegardes du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Créer une sauvegarde du serveur')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lister les sauvegardes disponibles')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Voir les détails d\'une sauvegarde')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('ID de la sauvegarde')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      await interaction.deferReply({ ephemeral: true });

      const backup = await antiNuke.createBackup(interaction.guild);
      if (!backup) {
        return interaction.editReply('❌ Erreur lors de la création de la sauvegarde.');
      }

      const backupId = db.saveBackup(interaction.guild.id, backup);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Sauvegarde créée')
        .addFields(
          { name: 'ID', value: backupId.toString(), inline: true },
          { name: 'Salons', value: backup.channels.length.toString(), inline: true },
          { name: 'Rôles', value: backup.roles.length.toString(), inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
    else if (subcommand === 'list') {
      const backups = db.db.prepare('SELECT * FROM backups WHERE guild_id = ? ORDER BY created_at DESC LIMIT 10').all(interaction.guild.id);

      if (backups.length === 0) {
        return interaction.reply({ content: 'Aucune sauvegarde trouvée.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🗄️ Sauvegardes du serveur')
        .setDescription(
          backups.map(b => {
            const data = JSON.parse(b.backup_data);
            return `**ID ${b.id}** - <t:${b.created_at}:R>\n➡️ ${data.channels.length} salons, ${data.roles.length} rôles`;
          }).join('\n\n')
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    else if (subcommand === 'info') {
      const backupId = interaction.options.getInteger('id');
      const backup = db.getBackup(backupId);

      if (!backup || backup.guild_id !== interaction.guild.id) {
        return interaction.reply({ content: '❌ Sauvegarde introuvable.', ephemeral: true });
      }

      const data = backup.backup_data;

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`🗄️ Sauvegarde #${backupId}`)
        .addFields(
          { name: 'Serveur', value: data.guildName, inline: true },
          { name: 'Date', value: `<t:${backup.created_at}:F>`, inline: true },
          { name: 'Salons', value: data.channels.length.toString(), inline: true },
          { name: 'Rôles', value: data.roles.length.toString(), inline: true },
          { name: 'Emojis', value: data.emojis?.length?.toString() || '0', inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};