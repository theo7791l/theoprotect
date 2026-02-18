import antiNuke from '../systems/antiNuke.js';
import { EmbedBuilder, AuditLogEvent } from 'discord.js';

export default {
  name: 'channelDelete',
  async execute(channel) {
    if (!channel.guild) return;

    try {
      // Fetch audit logs
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1
      });

      const deleteLog = auditLogs.entries.first();
      if (!deleteLog) return;

      const { executor } = deleteLog;
      if (!executor) return;

      // Track action
      const result = await antiNuke.trackAction(executor, channel.guild, 'CHANNEL_DELETE');

      if (result.isNuke) {
        const member = channel.guild.members.cache.get(executor.id);
        if (member) {
          const response = await antiNuke.executeResponse(member, result.action);
          console.log(`[AntiNuke] ${executor.tag} - CHANNEL_DELETE nuke detected`);

          // Log to channel
          const logChannel = channel.guild.channels.cache.find(c => c.name === 'theoprotect-logs');
          if (logChannel) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('🚨 TENTATIVE DE NUKE DÉTECTÉE')
              .setDescription(`**${executor.tag}** a supprimé plusieurs salons rapidement.`)
              .addFields(
                { name: 'Exécuteur', value: `${executor} (${executor.id})`, inline: true },
                { name: 'Action', value: response.message, inline: true },
                { name: 'Salon supprimé', value: channel.name, inline: true },
                { name: 'Nombre de suppressions', value: result.count.toString(), inline: true }
              )
              .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('[AntiNuke] Error in channelDelete:', error);
    }
  }
};