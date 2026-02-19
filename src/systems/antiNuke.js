import db from '../database/database.js';

class AntiNukeSystem {
  constructor() {
    this.thresholds = {
      channelDelete: { limit: 3, time: 10000 }, // 3 channels en 10s
      channelCreate: { limit: 5, time: 10000 }, // 5 channels en 10s
      roleDelete: { limit: 3, time: 10000 },
      roleCreate: { limit: 5, time: 10000 },
      banAdd: { limit: 5, time: 30000 }, // 5 bans en 30s
      kickAdd: { limit: 8, time: 30000 },
      memberRoleUpdate: { limit: 10, time: 5000 } // 10 changements de rôles en 5s
    };
    
    this.actions = new Map(); // userId -> [{action, timestamp}]
  }

  trackAction(userId, guildId, actionType) {
    const key = `${userId}-${guildId}-${actionType}`;
    const now = Date.now();
    
    if (!this.actions.has(key)) {
      this.actions.set(key, []);
    }
    
    const userActions = this.actions.get(key);
    const threshold = this.thresholds[actionType];
    
    if (!threshold) return false;
    
    // Nettoyer les actions anciennes
    const validActions = userActions.filter(a => now - a.timestamp < threshold.time);
    validActions.push({ action: actionType, timestamp: now });
    this.actions.set(key, validActions);
    
    // Vérifier le seuil
    if (validActions.length >= threshold.limit) {
      console.log(`[Anti-Nuke] 🚨 Threshold exceeded: ${userId} - ${actionType} (${validActions.length}/${threshold.limit})`);
      return true;
    }
    
    return false;
  }

  async handleNukeAttempt(guild, executor, actionType) {
    if (!guild || !executor) return;
    
    try {
      console.log(`[Anti-Nuke] ⚠️ Nuke attempt detected: ${executor.tag} - ${actionType}`);
      
      // Log dans la database
      db.logAction(guild.id, {
        type: 'anti_nuke',
        user_id: executor.id,
        action: actionType,
        timestamp: Date.now()
      });
      
      // Retirer les permissions dangereuses
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (member && member.permissions.has('Administrator')) {
        const dangerousPerms = [
          'Administrator',
          'ManageGuild',
          'ManageChannels',
          'ManageRoles',
          'BanMembers',
          'KickMembers'
        ];
        
        // Retirer tous les rôles avec permissions dangereuses
        for (const role of member.roles.cache.values()) {
          if (role.permissions.any(dangerousPerms) && role.editable) {
            await member.roles.remove(role).catch(console.error);
            console.log(`[Anti-Nuke] 🛡️ Removed role: ${role.name} from ${executor.tag}`);
          }
        }
      }
      
      // Bannir l'attaquant
      await guild.members.ban(executor.id, { 
        reason: `[Anti-Nuke] Suspicious activity detected: ${actionType}` 
      }).catch(console.error);
      
      console.log(`[Anti-Nuke] ✅ Banned ${executor.tag} for nuke attempt`);
      
      // Envoyer un log
      const logChannel = guild.channels.cache.find(c => 
        c.name.includes('log') || c.name.includes('theoprotect')
      );
      
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          embeds: [{
            color: 0xff0000,
            title: '🚨 Anti-Nuke: Attaque détectée',
            description: `**Utilisateur:** ${executor.tag} (${executor.id})\n**Action:** ${actionType}\n**Sanction:** Ban automatique`,
            timestamp: new Date().toISOString(),
            footer: { text: 'TheoProtect Anti-Nuke' }
          }]
        }).catch(console.error);
      }
      
      return true;
    } catch (error) {
      console.error('[Anti-Nuke] Error handling nuke attempt:', error);
      return false;
    }
  }

  clearCache() {
    const now = Date.now();
    for (const [key, actions] of this.actions.entries()) {
      const validActions = actions.filter(a => now - a.timestamp < 60000);
      if (validActions.length === 0) {
        this.actions.delete(key);
      } else {
        this.actions.set(key, validActions);
      }
    }
  }
}

export default new AntiNukeSystem();