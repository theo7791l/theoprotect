import antiNuke from '../systems/antiNuke.js';

export default {
  name: 'channelCreate',
  async execute(channel) {
    try {
      if (!channel.guild) return;
      
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: 10, // CHANNEL_CREATE
        limit: 1
      });
      
      const createLog = auditLogs.entries.first();
      if (!createLog) return;
      
      const { executor } = createLog;
      if (!executor || executor.bot) return;
      
      const isNuke = antiNuke.trackAction(executor.id, channel.guild.id, 'channelCreate');
      
      if (isNuke) {
        await antiNuke.handleNukeAttempt(channel.guild, executor, 'channelCreate');
      }
    } catch (error) {
      console.error('[channelCreate] Error:', error);
    }
  }
};