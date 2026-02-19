import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits 
} from 'discord.js';
import db from '../database/database.js';
import nsfwDetection from '../systems/nsfwDetection.js';
import aiModerator from '../systems/aiModerator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurer TheoProtect pour ce serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const settings = db.getGuildSettings(interaction.guild.id);

    // Create embed with current configuration
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ 
        name: 'TheoProtect Configuration', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setDescription('🔧 **Panel de configuration**\n\nSélectionnez un module ci-dessous pour le configurer.')
      .addFields(
        { 
          name: '🛡️ Anti-Spam', 
          value: `${settings.antispam_enabled ? '✅ **Actif**' : '❌ Inactif'}\n📊 Niveau: **${settings.antispam_level}**`,
          inline: true 
        },
        { 
          name: '🚨 Anti-Raid', 
          value: `${settings.antiraid_enabled ? '✅ **Actif**' : '❌ Inactif'}\n🎯 Mode: **${settings.antiraid_mode}**`,
          inline: true 
        },
        { 
          name: '🔐 Captcha', 
          value: settings.captcha_enabled ? '✅ **Actif**' : '❌ Inactif',
          inline: true 
        },
        {
          name: '📝 Salon de logs',
          value: settings.log_channel ? `<#${settings.log_channel}>` : '❌ Non configuré',
          inline: true
        },
        {
          name: '🖼️ Détection NSFW',
          value: nsfwDetection.isEnabled() ? '✅ **Actif** (Sightengine)' : '❌ Désactivé (pas d\'API)',
          inline: true
        },
        {
          name: '🤖 AI Moderator',
          value: aiModerator.isEnabled() ? '✅ **Actif** (OpenAI)' : '❌ Désactivé (pas d\'API)',
          inline: true
        }
      )
      .setFooter({ text: 'TheoProtect • Configuration' })
      .setTimestamp();

    // Create select menu for module selection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('config_module')
      .setPlaceholder('🔽 Sélectionnez un module à configurer')
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
          description: 'Activer/désactiver le captcha',
          value: 'captcha',
          emoji: '🔐'
        },
        {
          label: 'Salon de logs',
          description: 'Définir le salon des logs',
          value: 'logs',
          emoji: '📝'
        }
      ]);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    // Create quick action buttons
    const buttonsRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('config_stats')
          .setLabel('Statistiques')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('config_backup')
          .setLabel('Backup')
          .setEmoji('🗄️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('config_lockdown')
          .setLabel('Lockdown')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setLabel('Documentation')
          .setEmoji('📖')
          .setStyle(ButtonStyle.Link)
          .setURL('https://github.com/theo7791l/theoprotect#readme')
      );

    await interaction.reply({ 
      embeds: [embed], 
      components: [selectRow, buttonsRow], 
      ephemeral: true 
    });
  }
};