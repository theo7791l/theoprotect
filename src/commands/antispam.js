import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Configurer l\'anti-spam')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option.setName('niveau')
        .setDescription('Niveau de protection')
        .setRequired(true)
        .addChoices(
          { name: '🟢 Faible - Spam lourd uniquement', value: 'low' },
          { name: '🟠 Moyen - Spam modéré', value: 'medium' },
          { name: '🔴 Élevé - Tous les spams', value: 'high' },
          { name: '⚫ Extrême - Ultra sensible', value: 'extreme' }
        )
    )
    .addBooleanOption(option =>
      option.setName('actif')
        .setDescription('Activer/désactiver l\'anti-spam')
        .setRequired(true)
    ),

  async execute(interaction) {
    const niveau = interaction.options.getString('niveau');
    const actif = interaction.options.getBoolean('actif');

    db.updateGuildSettings(interaction.guild.id, {
      antispam_enabled: actif ? 1 : 0,
      antispam_level: niveau
    });

    await interaction.reply({
      content: `✅ Anti-spam configuré :\n➡️ Statut: **${actif ? 'Actif' : 'Inactif'}**\n➡️ Niveau: **${niveau}**`,
      ephemeral: true
    });
  }
};