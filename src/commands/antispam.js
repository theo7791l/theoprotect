import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Configurer le système anti-spam')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option =>
      option.setName('niveau')
        .setDescription('Niveau de protection')
        .setRequired(true)
        .addChoices(
          { name: '🟢 Faible (Tolérant)', value: 'low' },
          { name: '🟡 Moyen (Recommandé)', value: 'medium' },
          { name: '🟠 Élevé (Strict)', value: 'high' },
          { name: '🔴 Extrême (Maximum)', value: 'extreme' }
        )
    )
    .addBooleanOption(option =>
      option.setName('actif')
        .setDescription('Activer ou désactiver l\'anti-spam')
        .setRequired(true)
    ),

  async execute(interaction) {
    const level = interaction.options.getString('niveau');
    const enabled = interaction.options.getBoolean('actif');

    try {
      db.updateGuildSettings(interaction.guild.id, {
        antispam_enabled: enabled ? 1 : 0,
        antispam_level: level
      });

      const levelEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        extreme: '🔴'
      }[level];

      const embed = new EmbedBuilder()
        .setColor(enabled ? 0x00ff00 : 0xff0000)
        .setTitle(`${enabled ? '✅' : '❌'} Anti-Spam ${enabled ? 'Activé' : 'Désactivé'}`)
        .setDescription(
          `**Niveau:** ${levelEmoji} ${level}\n\n` +
          `**Protection:**\n` +
          `• Détection de flood\n` +
          `• Détection de messages dupliqués\n` +
          `• Détection de spam de mentions\n` +
          `• Détection de spam d'emojis\n` +
          `• Détection de liens suspects`
        )
        .setFooter({ text: `Configuré par ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      console.log(`[Config] ${interaction.user.tag} - Anti-spam: ${enabled ? 'ON' : 'OFF'} (${level})`);
    } catch (error) {
      console.error('[AntiSpam Config] Error:', error);
      await interaction.reply({
        content: '❌ Erreur lors de la configuration de l\'anti-spam.',
        ephemeral: true
      });
    }
  }
};