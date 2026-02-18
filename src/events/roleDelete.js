import antiNuke from '../systems/antiNuke.js';
import { EmbedBuilder, AuditLogEvent } from 'discord.js';

export default {
  name: 'roleDelete',
  async execute(role) {
    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 1
      });

      const deleteLog = auditLogs.entries.first();
      if (!deleteLog) return;

      const { executor } = deleteLog;
      if (!executor) return;

      const result = await antiNuke.trackAction(executor, role.guild, 'ROLE_DELETE');

      if (result.isNuke) {
        const member = role.guild.members.cache.get(executor.id);
        if (member) {
          const response = await antiNuke.executeResponse(member, result.action);
          console.log(`[AntiNuke] ${executor.tag} - ROLE_DELETE nuke detected`);

          const logChannel = role.guild.channels.cache.find(c => c.name === 'theoprotect-logs');
          if (logChannel) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('🚨 TENTATIVE DE NUKE DÉTECTÉE')
              .setDescription(`**${executor.tag}** a supprimé plusieurs rôles rapidement.`)
              .addFields(
                { name: 'Exécuteur', value: `${executor} (${executor.id})`, inline: true },
                { name: 'Action', value: response.message, inline: true },
                { name: 'Rôle supprimé', value: role.name, inline: true }
              )
              .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('[AntiNuke] Error in roleDelete:', error);
    }
  }
};