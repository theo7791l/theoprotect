import antiNuke from '../systems/antiNuke.js';

export default {
  name: 'channelDelete',
  async execute(channel) {
    try {
      if (!channel.guild) return;
      
      // Récupérer qui a supprimé le salon
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: 12, // CHANNEL_DELETE
        limit: 1
      });
      
      const deleteLog = auditLogs.entries.first();
      if (!deleteLog) return;
      
      const { executor } = deleteLog;
      if (!executor || executor.bot) return;
      
      // Vérifier si c'est un nuke
      const isNuke = antiNuke.trackAction(executor.id, channel.guild.id, 'channelDelete');
      
      if (isNuke) {
        await antiNuke.handleNukeAttempt(channel.guild, executor, 'channelDelete');
      }
    } catch (error) {
      console.error('[channelDelete] Error:', error);
    }
  }
};