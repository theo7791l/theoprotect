import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import smartLockdown from '../systems/smartLockdown.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Verrouiller le serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('activate')
        .setDescription('Activer le lockdown')
        .addStringOption(option =>
          option.setName('niveau')
            .setDescription('Niveau de lockdown')
            .setRequired(true)
            .addChoices(
              { name: '🟡 Soft - Messages uniquement', value: 'SOFT' },
              { name: '🟠 Medium - Messages + fichiers', value: 'MEDIUM' },
              { name: '🔴 Hard - Tout bloqué', value: 'HARD' },
              { name: '⚫ Raid - Mode urgence', value: 'RAID' }
            )
        )
        .addStringOption(option =>
          option.setName('raison')
            .setDescription('Raison du lockdown')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deactivate')
        .setDescription('Désactiver le lockdown')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Voir le statut du lockdown')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'activate') {
      await interaction.deferReply();

      const level = interaction.options.getString('niveau');
      const reason = interaction.options.getString('raison') || 'Aucune raison fournie';

      const result = await smartLockdown.activateLockdown(interaction.guild, level, reason);

      if (result.success) {
        await interaction.editReply(
          `🔒 **Lockdown activé**\n` +
          `➡️ Niveau: **${result.level}**\n` +
          `➡️ Salons verrouillés: **${result.channelsLocked}**\n` +
          `➡️ Raison: ${reason}`
        );
      } else {
        await interaction.editReply('❌ Erreur lors de l\'activation du lockdown.');
      }
    }
    else if (subcommand === 'deactivate') {
      await interaction.deferReply();

      const result = await smartLockdown.deactivateLockdown(interaction.guild);

      if (result.success) {
        const duration = Math.floor(result.duration / 1000);
        await interaction.editReply(
          `✅ **Lockdown désactivé**\n` +
          `➡️ Salons restaurés: **${result.channelsRestored}**\n` +
          `➡️ Durée: **${duration}s**`
        );
      } else {
        await interaction.editReply('❌ Aucun lockdown actif.');
      }
    }
    else if (subcommand === 'status') {
      const status = smartLockdown.getStatus(interaction.guild.id);

      if (!status) {
        return interaction.reply({ content: '✅ Aucun lockdown actif.', ephemeral: true });
      }

      const duration = Math.floor((Date.now() - status.activatedAt) / 1000);

      await interaction.reply({
        content: 
          `🔒 **Lockdown actif**\n` +
          `➡️ Niveau: **${status.level}**\n` +
          `➡️ Raison: ${status.reason}\n` +
          `➡️ Actif depuis: **${duration}s**`,
        ephemeral: true
      });
    }
  }
};