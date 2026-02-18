class AntiNukeSystem {
  constructor() {
    this.actionHistory = new Map(); // userId -> [actions]
    this.thresholds = {
      CHANNEL_DELETE: { limit: 3, window: 10000 },
      CHANNEL_CREATE: { limit: 5, window: 10000 },
      ROLE_DELETE: { limit: 3, window: 10000 },
      BAN: { limit: 5, window: 30000 },
      KICK: { limit: 5, window: 30000 },
      WEBHOOK_CREATE: { limit: 3, window: 10000 }
    };
    this.backups = new Map(); // guildId -> backup data
  }

  /**
   * Track and analyze dangerous actions
   */
  async trackAction(executor, guild, actionType) {
    if (!executor || executor.bot) return { isNuke: false };
    if (executor.id === guild.ownerId) return { isNuke: false };

    const userId = executor.id;
    const now = Date.now();

    if (!this.actionHistory.has(userId)) {
      this.actionHistory.set(userId, []);
    }

    const userActions = this.actionHistory.get(userId);
    userActions.push({ type: actionType, timestamp: now, guildId: guild.id });

    // Clean old actions
    const threshold = this.thresholds[actionType];
    if (!threshold) return { isNuke: false };

    const recentActions = userActions.filter(
      action => action.type === actionType && 
                now - action.timestamp < threshold.window &&
                action.guildId === guild.id
    );

    this.actionHistory.set(userId, recentActions);

    // Check if threshold exceeded
    const isNuke = recentActions.length >= threshold.limit;

    return {
      isNuke,
      count: recentActions.length,
      threshold: threshold.limit,
      action: isNuke ? this.determineResponse(actionType) : null
    };
  }

  /**
   * Determine response to nuke attempt
   */
  determineResponse(actionType) {
    return {
      type: 'BAN',
      reason: `Anti-Nuke: Tentative de nuke détectée (${actionType})`,
      removePermissions: true,
      notify: true
    };
  }

  /**
   * Execute anti-nuke response
   */
  async executeResponse(member, action) {
    try {
      // Remove dangerous permissions immediately
      if (action.removePermissions) {
        const roles = member.roles.cache.filter(role => 
          role.permissions.has('Administrator') ||
          role.permissions.has('ManageGuild') ||
          role.permissions.has('ManageChannels') ||
          role.permissions.has('ManageRoles') ||
          role.permissions.has('BanMembers')
        );
        
        for (const [, role] of roles) {
          try {
            await member.roles.remove(role, 'Anti-Nuke: Retrait des permissions dangereuses');
          } catch (err) {
            console.error(`Cannot remove role ${role.name}:`, err.message);
          }
        }
      }

      // Ban the member
      await member.ban({ reason: action.reason, deleteMessageSeconds: 0 });

      return { success: true, message: `🔨 ${member.user.tag} banni pour tentative de nuke` };
    } catch (error) {
      console.error('[AntiNuke] Error executing response:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Create guild backup
   */
  async createBackup(guild) {
    try {
      const backup = {
        timestamp: Date.now(),
        guildName: guild.name,
        channels: [],
        roles: [],
        emojis: []
      };

      // Backup channels
      for (const [, channel] of guild.channels.cache) {
        backup.channels.push({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          position: channel.position,
          permissions: channel.permissionOverwrites.cache.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow.bitfield.toString(),
            deny: overwrite.deny.bitfield.toString()
          }))
        });
      }

      // Backup roles
      for (const [, role] of guild.roles.cache) {
        if (role.name !== '@everyone') {
          backup.roles.push({
            id: role.id,
            name: role.name,
            color: role.color,
            permissions: role.permissions.bitfield.toString(),
            position: role.position,
            hoist: role.hoist,
            mentionable: role.mentionable
          });
        }
      }

      this.backups.set(guild.id, backup);
      return backup;
    } catch (error) {
      console.error('[AntiNuke] Backup error:', error);
      return null;
    }
  }

  /**
   * Get latest backup for guild
   */
  getBackup(guildId) {
    return this.backups.get(guildId);
  }
}

export default new AntiNukeSystem();