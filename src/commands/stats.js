import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database/database.js';
import antiRaid from '../systems/antiRaid.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Statistiques de protection du serveur'),

  async execute(interaction) {
    await interaction.deferReply();

    const settings = db.getGuildSettings(interaction.guild.id);
    const raidStats = antiRaid.getRaidStats();
    const recentLogs = db.getModLogs(interaction.guild.id, 100);

    // Count actions
    const actionCounts = {
      warns: recentLogs.filter(l => l.action_type === 'WARN').length,
      timeouts: recentLogs.filter(l => l.action_type === 'TIMEOUT').length,
      kicks: recentLogs.filter(l => l.action_type === 'KICK').length,
      bans: recentLogs.filter(l => l.action_type === 'BAN').length
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📊 Statistiques de TheoProtect')
      .setDescription(`Serveur: **${interaction.guild.name}**`)
      .addFields(
        {
          name: '🛡️ État des modules',
          value: 
            `➡️ Anti-Spam: ${settings.antispam_enabled ? '✅' : '❌'} (${settings.antispam_level})\n` +
            `➡️ Anti-Raid: ${settings.antiraid_enabled ? '✅' : '❌'} (${settings.antiraid_mode})\n` +
            `➡️ Captcha: ${settings.captcha_enabled ? '✅' : '❌'}`,
          inline: false
        },
        {
          name: '🚨 Mode Raid',
          value: raidStats.isActive ? 
            `🔴 **ACTIF**\n➡️ Joins récents: ${raidStats.recentJoins}\n➡️ Comptes suspects: ${raidStats.suspiciousUsers}` :
            '✅ Inactif',
          inline: false
        },
        {
          name: '📝 Actions de modération (100 dernières)',
          value: 
            `⚠️ Warns: **${actionCounts.warns}**\n` +
            `🔇 Timeouts: **${actionCounts.timeouts}**\n` +
            `👢 Kicks: **${actionCounts.kicks}**\n` +
            `🔨 Bans: **${actionCounts.bans}**`,
          inline: true
        },
        {
          name: '👥 Membres',
          value: 
            `➡️ Total: **${interaction.guild.memberCount}**\n` +
            `➡️ Humains: **${interaction.guild.members.cache.filter(m => !m.user.bot).size}**\n` +
            `➡️ Bots: **${interaction.guild.members.cache.filter(m => m.user.bot).size}**`,
          inline: true
        }
      )
      .setFooter({ text: 'TheoProtect - Protection avancée' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};