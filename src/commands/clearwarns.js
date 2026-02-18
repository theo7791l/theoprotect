import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Effacer tous les avertissements d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre dont effacer les warns')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const warnings = db.getWarnings(target.id, interaction.guild.id);

    if (warnings.length === 0) {
      return interaction.reply({
        content: `${target} n'a aucun avertissement à effacer.`,
        ephemeral: true
      });
    }

    db.clearWarnings(target.id, interaction.guild.id);

    await interaction.reply({
      content: `✅ ${warnings.length} avertissement(s) effacé(s) pour ${target}.`,
      ephemeral: true
    });
  }
};