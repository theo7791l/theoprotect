import db from '../database/database.js';
import badWords from './badWords.js';

class AutoAntiSpam {
  constructor() {
    this.messageCache = new Map(); // userId-guildId -> [messages]
    this.warningsCache = new Map(); // userId-guildId -> count
    this.globalMessageCache = new Map(); // guildId-channelId -> [all messages]
  }

  async checkMessage(message) {
    if (!message.guild) return;
    
    // Ignorer les bots marqués comme bots (sauf webhooks)
    if (message.author.bot && !message.webhookId) return;
    
    const settings = db.getGuildSettings(message.guild.id);
    if (!settings.antispam_enabled) return;
    
    const key = `${message.author.id}-${message.guild.id}`;
    const now = Date.now();
    
    // 1. Vérifier les mots inappropriés (seulement pour messages humains)
    if (!message.author.bot && !message.webhookId) {
      const badWordCheck = badWords.containsBadWords(message.content);
      if (badWordCheck.detected) {
        await this.handleBadWord(message, badWordCheck);
        return;
      }
    }
    
    // 2. Vérifier flood global (TOUS les messages, incluant webhooks/bots)
    await this.checkGlobalFlood(message, now);
    
    // 3. Vérifier spam classique (seulement utilisateurs)
    if (!message.author.bot && !message.webhookId) {
      await this.checkRegularSpam(message, key, now, settings);
    }
  }

  async handleBadWord(message, detection) {
    try {
      const key = `${message.author.id}-${message.guild.id}`;
      
      // Récupérer le nombre d'avertissements
      const warnings = this.warningsCache.get(key) || 0;
      
      // Supprimer le message
      await message.delete().catch(console.error);
      
      // Réduire le score de réputation
      db.updateReputation(message.guild.id, message.author.id, -10);
      
      if (warnings === 0) {
        // Premier avertissement
        this.warningsCache.set(key, 1);
        
        await message.channel.send({
          content: `⚠️ ${message.author}, **Avertissement 1/2** : Langage inapproprié détecté. Prochain avertissement = mute.`,
          allowedMentions: { users: [message.author.id] }
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        
        console.log(`[Bad Words] Warning 1/2 for ${message.author.tag} (word: ${detection.word})`);
      } else {
        // Deuxième avertissement -> Mute
        this.warningsCache.set(key, 2);
        
        const member = message.member;
        await member.timeout(10 * 60 * 1000, '[Auto-Mod] Langage inapproprié (2e avertissement)').catch(console.error);
        
        await message.channel.send({
          content: `🔇 ${message.author} a été **mute 10 minutes** pour langage inapproprié répété.`,
          allowedMentions: { users: [message.author.id] }
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        
        // Reset après mute
        setTimeout(() => {
          this.warningsCache.delete(key);
        }, 10 * 60 * 1000);
        
        console.log(`[Bad Words] Muted ${message.author.tag} for 10 minutes (word: ${detection.word})`);
      }
      
      // Log dans la database
      db.logAction(message.guild.id, {
        type: 'bad_word_detected',
        user_id: message.author.id,
        word: detection.word,
        severity: detection.severity,
        warnings: warnings + 1,
        timestamp: Date.now()
      });
      
      // Log dans le salon de logs
      const logChannel = message.guild.channels.cache.find(c => 
        c.name.includes('log') || c.name.includes('theoprotect')
      );
      
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          embeds: [{
            color: warnings === 0 ? 0xffa500 : 0xff0000,
            title: '🤬 Langage inapproprié détecté',
            description: `**Utilisateur:** ${message.author.tag} (${message.author.id})\n**Salon:** ${message.channel}\n**Mot détecté:** ||${detection.word}||\n**Sévérité:** ${detection.severity}\n**Avertissement:** ${warnings + 1}/2\n**Action:** ${warnings === 0 ? 'Avertissement' : 'Mute 10 minutes'}`,
            fields: [
              { name: 'Message original', value: message.content.substring(0, 1000) || 'Vide' }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'TheoProtect Auto-Moderation' }
          }]
        }).catch(console.error);
      }
    } catch (error) {
      console.error('[Bad Words] Error handling:', error);
    }
  }

  async checkGlobalFlood(message, now) {
    // Détection de flood GLOBAL (tous messages confondus)
    const channelKey = `${message.guild.id}-${message.channel.id}`;
    
    if (!this.globalMessageCache.has(channelKey)) {
      this.globalMessageCache.set(channelKey, []);
    }
    
    const channelMessages = this.globalMessageCache.get(channelKey);
    channelMessages.push({ 
      id: message.id, 
      authorId: message.author.id,
      timestamp: now,
      isBot: message.author.bot || !!message.webhookId
    });
    
    // Garder seulement les 20 derniers messages des 5 dernières secondes
    const recentMessages = channelMessages.filter(m => now - m.timestamp < 5000).slice(-20);
    this.globalMessageCache.set(channelKey, recentMessages);
    
    // Seuil: 12+ messages en 5 secondes dans le salon = FLOOD
    if (recentMessages.length >= 12) {
      console.log(`[Global Flood] Detected in ${message.channel.name} (${recentMessages.length} messages in 5s)`);
      
      // Supprimer TOUS les messages du flood
      const deletedCount = await this.bulkDeleteMessages(message.channel, recentMessages.map(m => m.id));
      
      console.log(`[Global Flood] Deleted ${deletedCount} messages`);
      
      // Notification
      await message.channel.send({
        embeds: [{
          color: 0xff0000,
          title: '🚨 Flood détecté',
          description: `**${deletedCount} messages** supprimés pour flood dans ce salon.\n\n⚠️ Ralentissez le débit de messages !`,
          timestamp: new Date().toISOString(),
          footer: { text: 'TheoProtect Auto-Moderation' }
        }]
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
      
      // Timeout les utilisateurs humains impliqués
      const humanAuthors = new Set(
        recentMessages
          .filter(m => !m.isBot)
          .map(m => m.authorId)
      );
      
      for (const authorId of humanAuthors) {
        try {
          const member = await message.guild.members.fetch(authorId).catch(() => null);
          if (member && !member.permissions.has('Administrator')) {
            await member.timeout(5 * 60 * 1000, '[Auto-Mod] Participation à un flood').catch(console.error);
            db.updateReputation(message.guild.id, authorId, -15);
            console.log(`[Global Flood] Muted ${member.user.tag}`);
          }
        } catch (e) {}
      }
      
      // Reset cache
      this.globalMessageCache.delete(channelKey);
      
      // Log
      db.logAction(message.guild.id, {
        type: 'global_flood_detected',
        channel_id: message.channel.id,
        messages_count: deletedCount,
        timestamp: now
      });
    }
  }

  async bulkDeleteMessages(channel, messageIds) {
    let deletedCount = 0;
    
    // Diviser en chunks de 100 (limite Discord)
    const chunks = [];
    for (let i = 0; i < messageIds.length; i += 100) {
      chunks.push(messageIds.slice(i, i + 100));
    }
    
    for (const chunk of chunks) {
      try {
        // Messages de moins de 14 jours peuvent être bulk delete
        const messages = await channel.messages.fetch({ limit: 100 }).catch(() => new Map());
        const toDelete = chunk.filter(id => messages.has(id));
        
        if (toDelete.length > 1) {
          await channel.bulkDelete(toDelete, true).catch(console.error);
          deletedCount += toDelete.length;
        } else if (toDelete.length === 1) {
          const msg = messages.get(toDelete[0]);
          if (msg) {
            await msg.delete().catch(console.error);
            deletedCount++;
          }
        }
      } catch (error) {
        console.error('[Bulk Delete] Error:', error);
      }
    }
    
    return deletedCount;
  }

  async checkRegularSpam(message, key, now, settings) {
    // Spam classique (utilisateurs uniquement)
    if (!this.messageCache.has(key)) {
      this.messageCache.set(key, []);
    }
    
    const messages = this.messageCache.get(key);
    messages.push({ content: message.content, timestamp: now, id: message.id });
    
    // Garder seulement les 10 derniers messages des 10 dernières secondes
    const recentMessages = messages.filter(m => now - m.timestamp < 10000).slice(-10);
    this.messageCache.set(key, recentMessages);
    
    // Détection selon le niveau
    const thresholds = {
      low: { messages: 8, time: 5000 },
      medium: { messages: 6, time: 5000 },
      high: { messages: 5, time: 5000 },
      extreme: { messages: 4, time: 5000 }
    };
    
    const threshold = thresholds[settings.antispam_level] || thresholds.medium;
    const recentInWindow = recentMessages.filter(m => now - m.timestamp < threshold.time);
    
    if (recentInWindow.length >= threshold.messages) {
      console.log(`[Anti-Spam] Detected from ${message.author.tag} (${recentInWindow.length} messages)`);
      
      // Supprimer les messages
      for (const msg of recentInWindow) {
        try {
          const toDelete = await message.channel.messages.fetch(msg.id).catch(() => null);
          if (toDelete) await toDelete.delete().catch(console.error);
        } catch (e) {}
      }
      
      // Timeout
      if (message.member) {
        await message.member.timeout(5 * 60 * 1000, '[Auto-Mod] Spam détecté').catch(console.error);
      }
      
      // Réduire réputation
      db.updateReputation(message.guild.id, message.author.id, -15);
      
      await message.channel.send({
        content: `🔇 ${message.author} a été **mute 5 minutes** pour spam.`,
        allowedMentions: { users: [message.author.id] }
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      
      // Clear cache
      this.messageCache.delete(key);
    }
  }

  clearCache() {
    const now = Date.now();
    
    // Clear message cache
    for (const [key, messages] of this.messageCache.entries()) {
      const recent = messages.filter(m => now - m.timestamp < 60000);
      if (recent.length === 0) {
        this.messageCache.delete(key);
      } else {
        this.messageCache.set(key, recent);
      }
    }
    
    // Clear global cache
    for (const [key, messages] of this.globalMessageCache.entries()) {
      const recent = messages.filter(m => now - m.timestamp < 60000);
      if (recent.length === 0) {
        this.globalMessageCache.delete(key);
      } else {
        this.globalMessageCache.set(key, recent);
      }
    }
  }
}

export default new AutoAntiSpam();