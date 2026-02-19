import db from '../database/database.js';
import badWords from './badWords.js';

class AutoAntiSpam {
  constructor() {
    this.messageCache = new Map(); // userId-guildId -> [messages]
    this.warningsCache = new Map(); // userId-guildId -> count
    this.apiSpamCache = new Map(); // userId-guildId -> {count, lastReset}
  }

  async checkMessage(message) {
    if (!message.guild || message.author.bot) return;
    
    const settings = db.getGuildSettings(message.guild.id);
    if (!settings.antispam_enabled) return;
    
    const key = `${message.author.id}-${message.guild.id}`;
    const now = Date.now();
    
    // 1. Vérifier les mots inappropriés
    const badWordCheck = badWords.containsBadWords(message.content);
    if (badWordCheck.detected) {
      await this.handleBadWord(message, badWordCheck);
      return;
    }
    
    // 2. Vérifier spam API (quota de messages)
    await this.checkAPISpam(message, key, now);
    
    // 3. Vérifier spam classique
    await this.checkRegularSpam(message, key, now, settings);
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

  async checkAPISpam(message, key, now) {
    // Détecter spam d'API (webhooks, bots non marqués, etc.)
    if (!this.apiSpamCache.has(key)) {
      this.apiSpamCache.set(key, { count: 0, lastReset: now, messages: [] });
    }
    
    const apiData = this.apiSpamCache.get(key);
    
    // Reset toutes les 5 secondes
    if (now - apiData.lastReset > 5000) {
      apiData.count = 0;
      apiData.messages = [];
      apiData.lastReset = now;
    }
    
    apiData.count++;
    apiData.messages.push(message.id);
    
    // Quota: 10 messages en 5 secondes = API spam
    if (apiData.count >= 10) {
      console.log(`[API Spam] Detected from ${message.author.tag} (${apiData.count} messages in 5s)`);
      
      // Supprimer tous les messages de ce spam
      for (const msgId of apiData.messages) {
        try {
          const msg = await message.channel.messages.fetch(msgId).catch(() => null);
          if (msg) await msg.delete().catch(console.error);
        } catch (e) {}
      }
      
      // Réduire réputation
      db.updateReputation(message.guild.id, message.author.id, -20);
      
      // Timeout si membre
      if (message.member && !message.author.bot) {
        await message.member.timeout(30 * 60 * 1000, '[Auto-Mod] API Spam détecté').catch(console.error);
        console.log(`[API Spam] Muted ${message.author.tag} for 30 minutes`);
      }
      
      // Notification
      await message.channel.send({
        embeds: [{
          color: 0xff0000,
          title: '🚨 Spam API détecté',
          description: `**${apiData.count} messages** supprimés de ${message.author}\n\n${message.author.bot ? '⚠️ Bot détecté - messages nettoyés' : '🔇 Utilisateur mute 30 minutes'}`,
          timestamp: new Date().toISOString()
        }]
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
      
      // Reset
      this.apiSpamCache.delete(key);
      
      // Log
      db.logAction(message.guild.id, {
        type: 'api_spam_detected',
        user_id: message.author.id,
        messages_count: apiData.count,
        timestamp: now
      });
    }
  }

  async checkRegularSpam(message, key, now, settings) {
    // Spam classique (flood, duplicatas, etc.)
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
    
    // Clear API spam cache
    for (const [key, data] of this.apiSpamCache.entries()) {
      if (now - data.lastReset > 60000) {
        this.apiSpamCache.delete(key);
      }
    }
  }
}

export default new AutoAntiSpam();