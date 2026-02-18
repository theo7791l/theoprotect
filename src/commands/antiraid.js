import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configurer l\'anti-raid')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Mode de protection')
        .setRequired(true)
        .addChoices(
          { name: '❌ Désactivé', value: 'off' },
          { name: '🔍 Détection uniquement', value: 'detection' },
          { name: '🛡️ Protection (quarantaine)', value: 'protection' },
          { name: '🚨 Lockdown (ban automatique)', value: 'lockdown' }
        )
    ),

  async execute(interaction) {
    const mode = interaction.options.getString('mode');

    db.updateGuildSettings(interaction.guild.id, {
      antiraid_enabled: mode !== 'off' ? 1 : 0,
      antiraid_mode: mode
    });

    await interaction.reply({
      content: `✅ Anti-raid configuré en mode: **${mode}**`,
      ephemeral: true
    });
  }
};