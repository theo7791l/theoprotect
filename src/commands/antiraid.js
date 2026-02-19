import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configurer le système anti-raid')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Mode de protection')
        .setRequired(true)
        .addChoices(
          { name: '❌ Désactivé', value: 'off' },
          { name: '👁️ Détection (logs uniquement)', value: 'detection' },
          { name: '🛡️ Protection (quarantaine)', value: 'protection' },
          { name: '🔒 Lockdown (kick automatique)', value: 'lockdown' }
        )
    ),

  async execute(interaction) {
    const mode = interaction.options.getString('mode');
    const enabled = mode !== 'off';

    try {
      db.updateGuildSettings(interaction.guild.id, {
        antiraid_enabled: enabled ? 1 : 0,
        antiraid_mode: mode
      });

      const modeEmoji = {
        off: '❌',
        detection: '👁️',
        protection: '🛡️',
        lockdown: '🔒'
      }[mode];

      const modeDescription = {
        off: 'Le système anti-raid est désactivé.',
        detection: 'Les raids sont détectés et loggés, mais aucune action automatique n\'est prise.',
        protection: 'Les membres suspects sont automatiquement mis en quarantaine.',
        lockdown: 'Les raids déclenchent un verrouillage automatique avec kick des suspects.'
      }[mode];

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x00ff00 : 0xff0000)
        .setTitle(`${modeEmoji} Anti-Raid: ${mode}`)
        .setDescription(
          `${modeDescription}\n\n` +
          `**Détections actives:**\n` +
          `• Comptes récents (<7 jours)\n` +
          `• Avatars par défaut\n` +
          `• Noms suspects (coordonnés)\n` +
          `• Joins massifs (>10 en 10s)\n` +
          `• Patterns similaires (Levenshtein)`
        )
        .setFooter({ text: `Configuré par ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      console.log(`[Config] ${interaction.user.tag} - Anti-raid: ${mode}`);
    } catch (error) {
      console.error('[AntiRaid Config] Error:', error);
      await interaction.reply({
        content: '❌ Erreur lors de la configuration de l\'anti-raid.',
        ephemeral: true
      });
    }
  }
};