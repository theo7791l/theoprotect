import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurer TheoProtect pour ce serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = db.getGuildSettings(interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('⚙️ Configuration de TheoProtect')
      .setDescription('Sélectionnez un module à configurer ci-dessous')
      .addFields(
        { 
          name: '🛡️ Anti-Spam', 
          value: `➡️ **Statut:** ${settings.antispam_enabled ? '✅ Actif' : '❌ Inactif'}\n➡️ **Niveau:** ${settings.antispam_level}`,
          inline: true 
        },
        { 
          name: '🚨 Anti-Raid', 
          value: `➡️ **Statut:** ${settings.antiraid_enabled ? '✅ Actif' : '❌ Inactif'}\n➡️ **Mode:** ${settings.antiraid_mode}`,
          inline: true 
        },
        { 
          name: '🔐 Captcha', 
          value: `➡️ **Statut:** ${settings.captcha_enabled ? '✅ Actif' : '❌ Inactif'}`,
          inline: true 
        },
        {
          name: '📝 Logs',
          value: settings.log_channel ? `<#${settings.log_channel}>` : 'Non configuré',
          inline: true
        }
      )
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('config_module')
          .setPlaceholder('Sélectionnez un module')
          .addOptions([
            {
              label: 'Anti-Spam',
              description: 'Configurer la protection anti-spam',
              value: 'antispam',
              emoji: '🛡️'
            },
            {
              label: 'Anti-Raid',
              description: 'Configurer la protection anti-raid',
              value: 'antiraid',
              emoji: '🚨'
            },
            {
              label: 'Captcha',
              description: 'Configurer le système de captcha',
              value: 'captcha',
              emoji: '🔐'
            },
            {
              label: 'Salon de logs',
              description: 'Définir le salon des logs',
              value: 'logs',
              emoji: '📝'
            }
          ])
      );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};