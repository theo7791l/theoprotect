import db from '../database/database.js';

class AutoAntiRaid {
  constructor() {
    this.joinCache = new Map(); // guildId -> [{userId, timestamp}]
    this.raidThreshold = 10; // 10 joins en 10 secondes = raid
    this.raidTimeWindow = 10000; // 10 secondes
    this.suspiciousPatterns = new Map();
  }

  async checkMember(member) {
    const guild = member.guild;
    const settings = db.getGuildSettings(guild.id);
    
    if (!settings.antiraid_enabled) return;
    
    const guildId = guild.id;
    const now = Date.now();
    
    // Ajouter au cache
    if (!this.joinCache.has(guildId)) {
      this.joinCache.set(guildId, []);
    }
    
    const joins = this.joinCache.get(guildId);
    joins.push({ userId: member.id, timestamp: now });
    
    // Nettoyer les anciens
    const recentJoins = joins.filter(j => now - j.timestamp < this.raidTimeWindow);
    this.joinCache.set(guildId, recentJoins);
    
    // Détecter raid massif
    if (recentJoins.length >= this.raidThreshold) {
      console.log(`[Auto Anti-Raid] 🚨 RAID DETECTED: ${recentJoins.length} joins in ${this.raidTimeWindow/1000}s`);
      await this.handleRaid(guild, settings);
    }
    
    // Analyser le membre
    const isSuspicious = this.analyzeMember(member);
    
    if (isSuspicious) {
      await this.handleSuspiciousMember(member, settings);
    }
  }

  analyzeMember(member) {
    const accountAge = Date.now() - member.user.createdTimestamp;
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
    
    let suspicionScore = 0;
    const reasons = [];
    
    // Compte récent (< 7 jours)
    if (daysSinceCreation < 7) {
      suspicionScore += 3;
      reasons.push(`Compte créé il y a ${Math.floor(daysSinceCreation)} jours`);
    }
    
    // Pas d'avatar
    if (!member.user.avatar) {
      suspicionScore += 2;
      reasons.push('Pas d\'avatar personnalisé');
    }
    
    // Nom suspect (caractères spéciaux, très long)
    const username = member.user.username;
    const specialChars = (username.match(/[^a-zA-Z0-9_]/g) || []).length;
    if (specialChars > 5) {
      suspicionScore += 2;
      reasons.push('Nom avec nombreux caractères spéciaux');
    }
    
    if (username.length > 25) {
      suspicionScore += 1;
      reasons.push('Nom très long');
    }
    
    // Pattern de nom coordonné (ex: "raid123", "bot456")
    const coordPattern = /(raid|bot|spam|nuke|alt)\d+/i;
    if (coordPattern.test(username)) {
      suspicionScore += 4;
      reasons.push('Pattern de nom coordonné détecté');
    }
    
    if (suspicionScore >= 5) {
      console.log(`[Auto Anti-Raid] ⚠️ Suspicious member: ${member.user.tag} (score: ${suspicionScore})`);
      console.log(`[Auto Anti-Raid] Reasons:`, reasons);
      return true;
    }
    
    return false;
  }

  async handleRaid(guild, settings) {
    try {
      // Log le raid
      db.logAction(guild.id, {
        type: 'raid_detected',
        timestamp: Date.now(),
        joins_count: this.joinCache.get(guild.id).length
      });
      
      // Selon le mode
      if (settings.antiraid_mode === 'lockdown') {
        await this.activateLockdown(guild);
      } else if (settings.antiraid_mode === 'protection') {
        // Le mode protection gère les membres individuellement
        console.log('[Auto Anti-Raid] Protection mode: handling suspicious members individually');
      }
      
      // Notifier dans les logs
      const logChannel = guild.channels.cache.find(c => 
        c.name.includes('log') || c.name.includes('theoprotect')
      );
      
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          embeds: [{
            color: 0xff0000,
            title: '🚨 RAID DÉTECTÉ',
            description: `**${this.joinCache.get(guild.id).length} membres** ont rejoint en moins de 10 secondes !\n\n**Mode actuel:** ${settings.antiraid_mode}\n**Action:** ${settings.antiraid_mode === 'lockdown' ? 'Lockdown activé' : 'Surveillance renforcée'}`,
            timestamp: new Date().toISOString(),
            footer: { text: 'TheoProtect Auto Anti-Raid' }
          }]
        }).catch(console.error);
      }
    } catch (error) {
      console.error('[Auto Anti-Raid] Error handling raid:', error);
    }
  }

  async handleSuspiciousMember(member, settings) {
    try {
      const guild = member.guild;
      
      // Log le membre suspect
      db.logAction(guild.id, {
        type: 'suspicious_member',
        user_id: member.id,
        username: member.user.tag,
        timestamp: Date.now()
      });
      
      // Actions selon le mode
      if (settings.antiraid_mode === 'lockdown') {
        await member.kick('[Anti-Raid] Membre suspect détecté pendant un raid').catch(console.error);
        console.log(`[Auto Anti-Raid] ✅ Kicked suspicious member: ${member.user.tag}`);
      } else if (settings.antiraid_mode === 'protection') {
        // Quarantaine (retirer tous les rôles)
        const roles = member.roles.cache.filter(r => r.id !== guild.id); // Garde @everyone
        if (roles.size > 0) {
          await member.roles.remove(roles).catch(console.error);
        }
        console.log(`[Auto Anti-Raid] ⚠️ Quarantined suspicious member: ${member.user.tag}`);
      } else if (settings.antiraid_mode === 'detection') {
        console.log(`[Auto Anti-Raid] 👁️ Detected (no action): ${member.user.tag}`);
      }
      
      // Log dans le salon
      const logChannel = guild.channels.cache.find(c => 
        c.name.includes('log') || c.name.includes('theoprotect')
      );
      
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          embeds: [{
            color: 0xffa500,
            title: '⚠️ Membre suspect détecté',
            description: `**Membre:** ${member.user.tag} (${member.id})\n**Compte créé:** <t:${Math.floor(member.user.createdTimestamp/1000)}:R>\n**Avatar:** ${member.user.avatar ? 'Oui' : 'Non'}\n**Action:** ${settings.antiraid_mode === 'lockdown' ? 'Kick' : settings.antiraid_mode === 'protection' ? 'Quarantaine' : 'Détection seule'}`,
            timestamp: new Date().toISOString(),
            footer: { text: 'TheoProtect Auto Anti-Raid' }
          }]
        }).catch(console.error);
      }
    } catch (error) {
      console.error('[Auto Anti-Raid] Error handling suspicious member:', error);
    }
  }

  async activateLockdown(guild) {
    try {
      // Désactiver les invitations
      const invites = await guild.invites.fetch().catch(() => new Map());
      for (const invite of invites.values()) {
        await invite.delete('[Anti-Raid] Lockdown automatique').catch(console.error);
      }
      
      // Bloquer les nouveaux membres (vérifier les permissions du bot)
      console.log(`[Auto Anti-Raid] 🔒 Lockdown activated for ${guild.name}`);
    } catch (error) {
      console.error('[Auto Anti-Raid] Error activating lockdown:', error);
    }
  }

  clearCache() {
    const now = Date.now();
    for (const [guildId, joins] of this.joinCache.entries()) {
      const recentJoins = joins.filter(j => now - j.timestamp < 60000);
      if (recentJoins.length === 0) {
        this.joinCache.delete(guildId);
      } else {
        this.joinCache.set(guildId, recentJoins);
      }
    }
  }
}

export default new AutoAntiRaid();