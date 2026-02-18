class SmartLockdownSystem {
  constructor() {
    this.lockdownStates = new Map(); // guildId -> state
    this.lockdownLevels = {
      SOFT: {
        name: 'Soft Lockdown',
        permissions: {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false,
          CREATE_PUBLIC_THREADS: false
        },
        allowedRoles: ['Modérateur', 'Admin']
      },
      MEDIUM: {
        name: 'Medium Lockdown',
        permissions: {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false,
          CREATE_PUBLIC_THREADS: false,
          SEND_MESSAGES_IN_THREADS: false,
          ATTACH_FILES: false
        },
        allowedRoles: ['Admin']
      },
      HARD: {
        name: 'Hard Lockdown',
        permissions: {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false,
          CREATE_PUBLIC_THREADS: false,
          SEND_MESSAGES_IN_THREADS: false,
          ATTACH_FILES: false,
          CONNECT: false,
          SPEAK: false
        },
        allowedRoles: [],
        disableInvites: true
      },
      RAID: {
        name: 'Raid Protection',
        permissions: {
          SEND_MESSAGES: false,
          ADD_REACTIONS: false,
          CREATE_PUBLIC_THREADS: false,
          SEND_MESSAGES_IN_THREADS: false,
          ATTACH_FILES: false,
          CONNECT: false,
          SPEAK: false,
          VIEW_CHANNEL: false
        },
        allowedRoles: [],
        disableInvites: true,
        kickNewMembers: true
      }
    };
  }

  /**
   * Activate lockdown
   */
  async activateLockdown(guild, level = 'SOFT', reason = 'Lockdown activé') {
    const lockdownConfig = this.lockdownLevels[level];
    if (!lockdownConfig) {
      throw new Error(`Invalid lockdown level: ${level}`);
    }

    const originalPermissions = [];

    // Store original permissions
    for (const [, channel] of guild.channels.cache) {
      if (channel.isTextBased() || channel.isVoiceBased()) {
        const everyonePerms = channel.permissionOverwrites.cache.get(guild.id);
        originalPermissions.push({
          channelId: channel.id,
          permissions: everyonePerms ? {
            allow: everyonePerms.allow.bitfield,
            deny: everyonePerms.deny.bitfield
          } : null
        });

        // Apply lockdown permissions
        const denyPerms = Object.entries(lockdownConfig.permissions)
          .filter(([, value]) => value === false)
          .map(([key]) => key);

        await channel.permissionOverwrites.edit(guild.id, 
          Object.fromEntries(denyPerms.map(perm => [perm, false])),
          { reason }
        ).catch(err => console.error(`Failed to lock ${channel.name}:`, err.message));
      }
    }

    // Disable server invites if needed
    if (lockdownConfig.disableInvites) {
      await guild.invites.fetch().then(invites => {
        invites.forEach(invite => invite.delete(reason).catch(() => {}));
      }).catch(() => {});
    }

    this.lockdownStates.set(guild.id, {
      level,
      reason,
      activatedAt: Date.now(),
      originalPermissions
    });

    return {
      success: true,
      level: lockdownConfig.name,
      channelsLocked: originalPermissions.length
    };
  }

  /**
   * Deactivate lockdown
   */
  async deactivateLockdown(guild) {
    const state = this.lockdownStates.get(guild.id);
    if (!state) {
      return { success: false, reason: 'No active lockdown' };
    }

    let restored = 0;

    // Restore original permissions
    for (const channelData of state.originalPermissions) {
      const channel = guild.channels.cache.get(channelData.channelId);
      if (!channel) continue;

      try {
        if (channelData.permissions) {
          await channel.permissionOverwrites.edit(guild.id, {
            allow: BigInt(channelData.permissions.allow),
            deny: BigInt(channelData.permissions.deny)
          }, { reason: 'Lockdown désactivé' });
        } else {
          // Remove override if there was none originally
          await channel.permissionOverwrites.delete(guild.id, { reason: 'Lockdown désactivé' });
        }
        restored++;
      } catch (err) {
        console.error(`Failed to restore ${channel.name}:`, err.message);
      }
    }

    this.lockdownStates.delete(guild.id);

    return {
      success: true,
      channelsRestored: restored,
      duration: Date.now() - state.activatedAt
    };
  }

  /**
   * Get lockdown status
   */
  getStatus(guildId) {
    return this.lockdownStates.get(guildId) || null;
  }

  /**
   * Auto-escalate lockdown based on threat level
   */
  async autoEscalateLockdown(guild, threatLevel) {
    const currentState = this.lockdownStates.get(guild.id);
    
    if (threatLevel >= 9 && (!currentState || currentState.level !== 'RAID')) {
      return await this.activateLockdown(guild, 'RAID', 'Auto-escalade: Raid détecté');
    } else if (threatLevel >= 7 && (!currentState || currentState.level === 'SOFT')) {
      return await this.activateLockdown(guild, 'HARD', 'Auto-escalade: Menace élevée');
    } else if (threatLevel >= 5 && !currentState) {
      return await this.activateLockdown(guild, 'MEDIUM', 'Auto-escalade: Menace modérée');
    }

    return null;
  }
}

export default new SmartLockdownSystem();