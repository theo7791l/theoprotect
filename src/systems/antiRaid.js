import config from '../config/config.js';

class AntiRaidSystem {
  constructor() {
    this.joinQueue = []; // Recent joins with timestamps
    this.suspiciousUsers = new Set();
    this.raidMode = false;
    this.raidStartTime = null;
    this.joinPatterns = new Map(); // Track join patterns
  }

  /**
   * Analyze new member join for raid patterns
   */
  async analyzeMemberJoin(member) {
    const now = Date.now();
    const accountAge = now - member.user.createdTimestamp;
    const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);

    // Add to join queue
    this.joinQueue.push({
      userId: member.id,
      username: member.user.username,
      timestamp: now,
      accountAge: accountAgeDays,
      avatarHash: member.user.avatar
    });

    // Clean old joins
    this.joinQueue = this.joinQueue.filter(
      join => now - join.timestamp < config.antiRaid.joinTimeWindow
    );

    // Calculate risk factors
    const riskFactors = [];

    // 1. Young account
    if (accountAgeDays < config.antiRaid.accountAgeMin) {
      riskFactors.push({
        type: 'YOUNG_ACCOUNT',
        severity: 3,
        details: `Compte créé il y a ${accountAgeDays.toFixed(1)} jours`
      });
    }

    // 2. Default avatar
    if (!member.user.avatar) {
      riskFactors.push({
        type: 'DEFAULT_AVATAR',
        severity: 2,
        details: 'Pas d\'avatar personnalisé'
      });
    }

    // 3. Suspicious username patterns
    const suspiciousPatterns = [
      /discord.*nitro/i,
      /free.*nitro/i,
      /@everyone/i,
      /(.)\1{4,}/, // Repeated characters
      /^[a-zA-Z0-9]{1,3}$/,  // Very short names
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(member.user.username))) {
      riskFactors.push({
        type: 'SUSPICIOUS_USERNAME',
        severity: 3,
        details: 'Pattern de nom suspect'
      });
    }

    // 4. Rapid join rate
    const recentJoins = this.joinQueue.length;
    if (recentJoins > config.antiRaid.joinThreshold) {
      riskFactors.push({
        type: 'RAPID_JOINS',
        severity: 5,
        details: `${recentJoins} membres ont rejoint en ${config.antiRaid.joinTimeWindow / 1000}s`
      });

      // Activate raid mode
      if (!this.raidMode) {
        this.activateRaidMode();
      }
    }

    // 5. Similar usernames (coordinated attack)
    const similarNames = this.joinQueue.filter(join => {
      const similarity = this.calculateSimilarity(join.username, member.user.username);
      return similarity > 0.7 && join.userId !== member.id;
    });

    if (similarNames.length > 3) {
      riskFactors.push({
        type: 'COORDINATED_USERNAMES',
        severity: 4,
        details: `${similarNames.length} noms similaires détectés`
      });
    }

    // 6. No mutual servers (can indicate throwaway account)
    // This would require checking mutual guilds - skip for now

    // Calculate total risk score
    const riskScore = riskFactors.reduce((sum, factor) => sum + factor.severity, 0);
    const isSuspicious = riskScore >= 5 || this.raidMode;

    if (isSuspicious) {
      this.suspiciousUsers.add(member.id);
    }

    return {
      isSuspicious,
      riskScore,
      riskFactors,
      raidMode: this.raidMode,
      action: this.determineAction(riskScore, this.raidMode)
    };
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Determine action based on risk score
   */
  determineAction(riskScore, isRaidMode) {
    if (isRaidMode || riskScore >= 10) {
      return { type: 'BAN', reason: 'Raid détecté - Compte suspect' };
    } else if (riskScore >= 7) {
      return { type: 'KICK', reason: 'Comportement hautement suspect' };
    } else if (riskScore >= 5) {
      return { type: 'QUARANTINE', reason: 'Compte suspect - Quarantaine automatique' };
    } else if (riskScore >= 3) {
      return { type: 'MONITOR', reason: 'Surveillance renforcée' };
    }
    
    return { type: 'NONE' };
  }

  /**
   * Execute action on suspicious member
   */
  async executeAction(member, action) {
    try {
      switch (action.type) {
        case 'BAN':
          await member.ban({ reason: action.reason, deleteMessageSeconds: 0 });
          return { success: true, message: `🔨 ${member.user.tag} banni` };
          
        case 'KICK':
          await member.kick(action.reason);
          return { success: true, message: `👢 ${member.user.tag} expulsé` };
          
        case 'QUARANTINE':
          // Remove all roles and add quarantine role
          const quarantineRole = member.guild.roles.cache.find(r => r.name === 'Quarantaine');
          if (quarantineRole) {
            await member.roles.set([quarantineRole], action.reason);
            return { success: true, message: `⚠️ ${member.user.tag} mis en quarantaine` };
          }
          return { success: false, message: 'Rôle Quarantaine introuvable' };
          
        case 'MONITOR':
          // Just flag for monitoring
          return { success: true, message: `🔍 ${member.user.tag} sous surveillance` };
          
        default:
          return { success: true, message: 'Aucune action' };
      }
    } catch (error) {
      console.error('[AntiRaid] Error executing action:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Activate raid protection mode
   */
  activateRaidMode() {
    this.raidMode = true;
    this.raidStartTime = Date.now();
    console.log('🚨 [AntiRaid] RAID MODE ACTIVATED');
    
    // Auto-deactivate after 10 minutes of no suspicious activity
    setTimeout(() => {
      if (this.raidMode && this.joinQueue.length < 3) {
        this.deactivateRaidMode();
      }
    }, 600000);
  }

  /**
   * Deactivate raid protection mode
   */
  deactivateRaidMode() {
    this.raidMode = false;
    this.raidStartTime = null;
    console.log('✅ [AntiRaid] Raid mode deactivated');
  }

  /**
   * Get raid statistics
   */
  getRaidStats() {
    return {
      isActive: this.raidMode,
      startTime: this.raidStartTime,
      recentJoins: this.joinQueue.length,
      suspiciousUsers: this.suspiciousUsers.size,
      joinQueue: this.joinQueue
    };
  }
}

export default new AntiRaidSystem();