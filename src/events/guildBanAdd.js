import antiNuke from '../systems/antiNuke.js';

export default {
  name: 'guildBanAdd',
  async execute(ban) {
    try {
      const guild = ban.guild;
      
      const auditLogs = await guild.fetchAuditLogs({
        type: 22, // MEMBER_BAN_ADD
        limit: 1
      });
      
      const banLog = auditLogs.entries.first();
      if (!banLog) return;
      
      const { executor } = banLog;
      if (!executor || executor.bot) return;
      
      const isNuke = antiNuke.trackAction(executor.id, guild.id, 'banAdd');
      
      if (isNuke) {
        await antiNuke.handleNukeAttempt(guild, executor, 'banAdd');
      }
    } catch (error) {
      console.error('[guildBanAdd] Error:', error);
    }
  }
};