import config from '../config/config.js';

class AntiSpamSystem {
  constructor() {
    this.messageCache = new Map(); // userId -> [timestamps]
    this.duplicateCache = new Map(); // userId -> [message contents]
    this.warnings = new Map(); // userId -> count
    this.violationScores = new Map(); // userId -> score
  }

  /**
   * Analyze message for spam patterns
   */
  async analyzeMessage(message) {
    if (message.author.bot) return { isSpam: false };
    if (message.member?.permissions.has('Administrator')) return { isSpam: false };

    const userId = message.author.id;
    const now = Date.now();
    const violations = [];

    // Message frequency check
    if (!this.messageCache.has(userId)) {
      this.messageCache.set(userId, []);
    }
    const userMessages = this.messageCache.get(userId);
    userMessages.push(now);

    // Clean old messages
    const recentMessages = userMessages.filter(
      timestamp => now - timestamp < config.antiSpam.timeWindow
    );
    this.messageCache.set(userId, recentMessages);

    // Check message rate
    if (recentMessages.length > config.antiSpam.maxMessages) {
      violations.push({
        type: 'MESSAGE_FLOOD',
        severity: 3,
        count: recentMessages.length
      });
    }

    // Duplicate message check
    if (!this.duplicateCache.has(userId)) {
      this.duplicateCache.set(userId, []);
    }
    const userDuplicates = this.duplicateCache.get(userId);
    userDuplicates.push({ content: message.content, timestamp: now });
    
    // Clean old duplicates
    const recentDuplicates = userDuplicates.filter(
      msg => now - msg.timestamp < 30000
    );
    this.duplicateCache.set(userId, recentDuplicates);

    const duplicateCount = recentDuplicates.filter(
      msg => msg.content === message.content
    ).length;

    if (duplicateCount > config.antiSpam.maxDuplicates) {
      violations.push({
        type: 'DUPLICATE_MESSAGE',
        severity: 2,
        count: duplicateCount
      });
    }

    // Mention spam check
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > config.antiSpam.maxMentions) {
      violations.push({
        type: 'MENTION_SPAM',
        severity: 4,
        count: mentionCount
      });
    }

    // Emoji spam check
    const emojiMatches = message.content.match(/<a?:\w+:\d+>/g) || [];
    if (emojiMatches.length > config.antiSpam.maxEmojis) {
      violations.push({
        type: 'EMOJI_SPAM',
        severity: 2,
        count: emojiMatches.length
      });
    }

    // Link spam check (Discord invites)
    const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/\w+/gi;
    if (inviteRegex.test(message.content)) {
      violations.push({
        type: 'INVITE_SPAM',
        severity: 5
      });
    }

    // External link spam
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = message.content.match(urlRegex) || [];
    if (urls.length > 3) {
      violations.push({
        type: 'LINK_SPAM',
        severity: 3,
        count: urls.length
      });
    }

    // Calculate total violation score
    const totalScore = violations.reduce((sum, v) => sum + v.severity, 0);
    const currentScore = this.violationScores.get(userId) || 0;
    this.violationScores.set(userId, currentScore + totalScore);

    // Determine if spam
    const isSpam = violations.length > 0;
    const action = this.determineAction(userId, totalScore);

    return {
      isSpam,
      violations,
      action,
      score: totalScore
    };
  }

  /**
   * Determine appropriate action based on violation score
   */
  determineAction(userId, score) {
    const userScore = this.violationScores.get(userId) || 0;
    
    if (userScore >= config.antiSpam.banThreshold) {
      return { type: 'BAN', reason: 'Spam excessif répété' };
    } else if (userScore >= config.antiSpam.kickThreshold) {
      return { type: 'KICK', reason: 'Spam sévère' };
    } else if (userScore >= config.antiSpam.muteThreshold) {
      return { type: 'TIMEOUT', duration: 3600000, reason: 'Spam' }; // 1h
    } else if (userScore >= config.antiSpam.warnThreshold) {
      return { type: 'WARN', reason: 'Comportement spam détecté' };
    } else if (score >= 3) {
      return { type: 'DELETE', reason: 'Message suspect' };
    }
    
    return { type: 'NONE' };
  }

  /**
   * Execute the determined action
   */
  async executeAction(message, action) {
    try {
      switch (action.type) {
        case 'DELETE':
          await message.delete();
          break;
          
        case 'WARN':
          await message.delete();
          await message.channel.send({
            content: `⚠️ ${message.author}, ${action.reason}. Ceci est un avertissement.`,
            allowedMentions: { users: [message.author.id] }
          }).then(msg => setTimeout(() => msg.delete(), 5000));
          break;
          
        case 'TIMEOUT':
          await message.delete();
          await message.member.timeout(action.duration, action.reason);
          await message.channel.send({
            content: `🔇 ${message.author} a été timeout pour: ${action.reason}`,
            allowedMentions: { users: [] }
          }).then(msg => setTimeout(() => msg.delete(), 10000));
          break;
          
        case 'KICK':
          await message.delete();
          await message.member.kick(action.reason);
          await message.channel.send({
            content: `👢 ${message.author.tag} a été expulsé pour: ${action.reason}`,
            allowedMentions: { users: [] }
          });
          break;
          
        case 'BAN':
          await message.delete();
          await message.member.ban({ reason: action.reason, deleteMessageSeconds: 86400 });
          await message.channel.send({
            content: `🔨 ${message.author.tag} a été banni pour: ${action.reason}`,
            allowedMentions: { users: [] }
          });
          break;
      }
      
      return true;
    } catch (error) {
      console.error('[AntiSpam] Error executing action:', error);
      return false;
    }
  }

  /**
   * Reset user violations (called after timeout period)
   */
  resetUser(userId) {
    this.messageCache.delete(userId);
    this.duplicateCache.delete(userId);
    this.violationScores.delete(userId);
  }

  /**
   * Get user statistics
   */
  getUserStats(userId) {
    return {
      messages: this.messageCache.get(userId)?.length || 0,
      violations: this.violationScores.get(userId) || 0,
      warnings: this.warnings.get(userId) || 0
    };
  }
}

export default new AntiSpamSystem();