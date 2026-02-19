import db from '../database/database.js';
import badWords from './badWords.js';

class AutoAntiSpam {
  constructor() {
    this.messageCache = new Map(); // userId-guildId -> [messages]
    this.warningsCache = new Map(); // userId-guildId -> count
    this.globalMessageCache = new Map(); // guildId-channelId -> [all messages]
    this.floodSanctions = new Map(); // userId-guildId -> sanction count
    this.botSpamCache = new Map(); // Track bot spam per bot per channel
    this.cleanupInProgress = new Set(); // Track channels being cleaned
  }

  async checkMessage(message) {
    if (!message.guild) return;
    
    const settings = db.getGuildSettings(message.guild.id);
    if (!settings.antispam_enabled) return;
    
    const key = `${message.author.id}-${message.guild.id}`;
    const now = Date.now();
    const isBot = message.author.bot || !!message.webhookId;
    
    // 1. Vérifier les mots inappropriés (seulement pour messages humains)
    if (!isBot) {
      const badWordCheck = badWords.containsBadWords(message.content);
      if (badWordCheck.detected) {
        await this.handleBadWord(message, badWordCheck);
        return;
      }
    }
    
    // 2. Vérifier message long/spam en un seul message (TOUS)
    if (await this.checkSingleMessageFlood(message, isBot)) {
      // CLEANUP après détection
      await this.cleanupChannelFlood(message.channel);
      return;
    }
    
    // 3. Vérifier flood global (TOUS les messages, incluant webhooks/bots/API)
    if (await this.checkGlobalFlood(message, now)) {
      // CLEANUP après détection
      await this.cleanupChannelFlood(message.channel);
      return;
    }
    
    // 4. Vérifier spam classique (seulement utilisateurs)
    if (!isBot) {
      const spamDetected = await this.checkRegularSpam(message, key, now, settings);
      if (spamDetected) {
        // CLEANUP après détection
        await this.cleanupChannelFlood(message.channel);
      }
    }
  }

  async checkSingleMessageFlood(message, isBot) {
    const content = message.content;
    
    // Détection de spam en un seul message
    const isSingleMessageFlood = (
      content.length > 2000 || // Message très long
      content.split('\n').length > 20 || // Trop de lignes
      /([A-Z]{50,})|([a-z]{100,})|([0-9]{50,})/.test(content) || // Chaînes répétitives
      /(.)\1{30,}/.test(content) || // Caractères répétés (aaaaaaa...)
      content.match(/[^\w\s]{20,}/g) // Caractères spéciaux répétés
    );
    
    if (isSingleMessageFlood) {
      console.log(`[Single Message Flood] Detected from ${message.author.tag} (Bot: ${isBot})`);
      
      try {
        // Supprimer le message IMMÉDIATEMENT
        await message.delete().catch(console.error);
        
        // Pour les BOTS: Log immédiat
        if (isBot) {
          const botKey = `${message.author.id}-${message.channel.id}`;
          const spamCount = (this.botSpamCache.get(botKey) || 0) + 1;
          this.botSpamCache.set(botKey, spamCount);
          
          setTimeout(() => {
            this.botSpamCache.delete(botKey);
          }, 60000);
          
          await this.logToChannel(message.guild, {
            color: 0xff6600,
            title: '🤖 Message spam de bot supprimé',
            description: 
              `**Bot:** ${message.author.tag} (${message.author.id})\n` +
              `**Salon:** ${message.channel}\n` +
              `**Longueur:** ${content.length} caractères\n` +
              `**Total supprimé:** ${spamCount} message(s)`,
            fields: [
              { name: 'Aperçu du contenu', value: content.substring(0, 500) + (content.length > 500 ? '...' : '') }
            ]
          });
        } else {
          // Pour les HUMAINS: Sanctions + notification publique
          const key = `${message.author.id}-${message.guild.id}`;
          const sanctions = (this.floodSanctions.get(key) || 0) + 1;
          this.floodSanctions.set(key, sanctions);
          
          if (sanctions === 1) {
            await message.member?.timeout(5 * 60 * 1000, '[Auto-Mod] Spam/Flood en un message').catch(console.error);
            db.updateReputation(message.guild.id, message.author.id, -20);
            
            await message.channel.send({
              content: `🚨 ${message.author}, **mute 5 minutes** pour flood/spam. Prochain flood = mute plus long.`,
              allowedMentions: { users: [message.author.id] }
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
          } else if (sanctions === 2) {
            await message.member?.timeout(30 * 60 * 1000, '[Auto-Mod] Flood répété').catch(console.error);
            db.updateReputation(message.guild.id, message.author.id, -30);
            
            await message.channel.send({
              content: `🔨 ${message.author}, **mute 30 minutes** pour flood répété. Prochain = kick.`,
              allowedMentions: { users: [message.author.id] }
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
          } else {
            try {
              await message.member?.kick('[Auto-Mod] Flood répété (3e fois)');
              db.updateReputation(message.guild.id, message.author.id, -50);
              
              await message.channel.send({
                content: `⛔ ${message.author.tag} a été **kick** pour flood répété.`
              }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
            } catch (e) {
              console.error('[Kick failed]:', e);
            }
          }
          
          setTimeout(() => {
            this.floodSanctions.delete(key);
          }, 60 * 60 * 1000);
          
          await this.logToChannel(message.guild, {
            color: 0xff0000,
            title: '🚨 Flood utilisateur détecté',
            description: 
              `**Utilisateur:** ${message.author.tag} (${message.author.id})\n` +
              `**Salon:** ${message.channel}\n` +
              `**Longueur:** ${content.length} caractères\n` +
              `**Sanction:** ${sanctions === 1 ? 'Mute 5 min' : sanctions === 2 ? 'Mute 30 min' : 'Kick'}`,
            fields: [
              { name: 'Contenu', value: content.substring(0, 500) + (content.length > 500 ? '...' : '') }
            ]
          });
        }
        
        db.logAction(message.guild.id, {
          type: 'single_message_flood',
          user_id: message.author.id,
          is_bot: isBot,
          message_length: content.length,
          timestamp: Date.now()
        });
        
        return true;
      } catch (error) {
        console.error('[Single Message Flood] Error:', error);
      }
    }
    
    return false;
  }

  /**
   * NOUVEAU SYSTÈME AMÉLIORÉ:
   * Scanner TOUS les messages des 30 dernières secondes dans le salon
   * et supprimer TOUS ceux qui matchent les critères de flood/spam
   * (bots ET humains, tous types de spam)
   */
  async cleanupChannelFlood(channel) {
    const channelKey = `${channel.id}`;
    
    // Éviter les cleanups multiples simultanés dans le même salon
    if (this.cleanupInProgress.has(channelKey)) {
      console.log(`[Cleanup] Already in progress for ${channel.name}, skipping`);
      return;
    }
    
    this.cleanupInProgress.add(channelKey);
    console.log(`[Cleanup] 🧹 Scanning ${channel.name} for ALL flood/spam in last 30 seconds...`);
    
    try {
      // Récupérer les 100 derniers messages (limite Discord)
      const messages = await channel.messages.fetch({ limit: 100 }).catch(() => new Map());
      
      if (messages.size === 0) {
        console.log(`[Cleanup] No messages found in ${channel.name}`);
        this.cleanupInProgress.delete(channelKey);
        return;
      }
      
      const now = Date.now();
      const thirtySecondsAgo = now - (30 * 1000); // 30 secondes
      const toDelete = [];
      
      // Filtrer TOUS les messages récents (< 30 secondes) qui sont du spam/flood
      for (const [id, msg] of messages) {
        // Ignorer les messages de plus de 30 secondes
        if (msg.createdTimestamp < thirtySecondsAgo) continue;
        
        // Ignorer les messages du bot lui-même
        if (msg.author.id === msg.client.user.id) continue;
        
        // Vérifier si c'est un message de flood (mêmes critères que checkSingleMessageFlood)
        const content = msg.content;
        const isFlood = (
          content.length > 2000 ||
          content.split('\n').length > 20 ||
          /([A-Z]{50,})|([a-z]{100,})|([0-9]{50,})/.test(content) ||
          /(.)\1{30,}/.test(content) ||
          content.match(/[^\w\s]{20,}/g)
        );
        
        if (isFlood) {
          toDelete.push({
            message: msg,
            isBot: msg.author.bot || !!msg.webhookId,
            author: msg.author.tag
          });
        }
      }
      
      if (toDelete.length > 0) {
        console.log(`[Cleanup] 🎯 Found ${toDelete.length} flood/spam message(s) to delete in ${channel.name}`);
        
        let deletedCount = 0;
        const deletedUsers = new Set();
        const deletedBots = new Set();
        
        // Supprimer tous les messages détectés
        for (const { message: msg, isBot, author } of toDelete) {
          try {
            await msg.delete().catch(console.error);
            deletedCount++;
            
            if (isBot) {
              deletedBots.add(author);
            } else {
              deletedUsers.add(author);
            }
            
            // Log chaque suppression
            db.logAction(channel.guild.id, {
              type: 'cleanup_flood',
              user_id: msg.author.id,
              is_bot: isBot,
              message_length: msg.content.length,
              timestamp: Date.now()
            });
          } catch (e) {
            console.error(`[Cleanup] Failed to delete message ${msg.id}:`, e);
          }
        }
        
        console.log(`[Cleanup] ✅ Deleted ${deletedCount}/${toDelete.length} flood/spam messages`);
        
        // Log global du cleanup
        if (deletedCount > 0) {
          const botList = Array.from(deletedBots).join(', ') || 'Aucun';
          const userList = Array.from(deletedUsers).join(', ') || 'Aucun';
          
          await this.logToChannel(channel.guild, {
            color: 0xff9900,
            title: '🧹 Nettoyage automatique effectué',
            description: 
              `**Salon:** ${channel}\n` +
              `**Messages supprimés:** ${deletedCount}\n` +
              `**Période:** 30 dernières secondes\n` +
              `**Bots:** ${deletedBots.size} (${botList})\n` +
              `**Utilisateurs:** ${deletedUsers.size} (${userList})\n\n` +
              `💡 Le salon a été automatiquement nettoyé après détection de flood/spam.`
          });
        }
      } else {
        console.log(`[Cleanup] ✅ No additional flood/spam found in ${channel.name}`);
      }
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    } finally {
      // Libérer le verrou après un délai pour éviter les scans trop fréquents
      setTimeout(() => {
        this.cleanupInProgress.delete(channelKey);
      }, 5000);
    }
  }

  async handleBadWord(message, detection) {
    try {
      const key = `${message.author.id}-${message.guild.id}`;
      
      const warnings = this.warningsCache.get(key) || 0;
      
      await message.delete().catch(console.error);
      
      db.updateReputation(message.guild.id, message.author.id, -10);
      
      if (warnings === 0) {
        this.warningsCache.set(key, 1);
        
        await message.channel.send({
          content: `⚠️ ${message.author}, **Avertissement 1/2** : Langage inapproprié détecté. Prochain avertissement = mute.`,
          allowedMentions: { users: [message.author.id] }
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        
        console.log(`[Bad Words] Warning 1/2 for ${message.author.tag} (word: ${detection.word})`);
      } else {
        this.warningsCache.set(key, 2);
        
        const member = message.member;
        await member.timeout(10 * 60 * 1000, '[Auto-Mod] Langage inapproprié (2e avertissement)').catch(console.error);
        
        await message.channel.send({
          content: `🔇 ${message.author} a été **mute 10 minutes** pour langage inapproprié répété.`,
          allowedMentions: { users: [message.author.id] }
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        
        setTimeout(() => {
          this.warningsCache.delete(key);
        }, 10 * 60 * 1000);
        
        console.log(`[Bad Words] Muted ${message.author.tag} for 10 minutes (word: ${detection.word})`);
      }
      
      db.logAction(message.guild.id, {
        type: 'bad_word_detected',
        user_id: message.author.id,
        word: detection.word,
        severity: detection.severity,
        warnings: warnings + 1,
        timestamp: Date.now()
      });
      
      await this.logToChannel(message.guild, {
        color: warnings === 0 ? 0xffa500 : 0xff0000,
        title: '🤬 Langage inapproprié détecté',
        description: 
          `**Utilisateur:** ${message.author.tag} (${message.author.id})\n` +
          `**Salon:** ${message.channel}\n` +
          `**Mot détecté:** ||${detection.word}||\n` +
          `**Sévérité:** ${detection.severity}\n` +
          `**Avertissement:** ${warnings + 1}/2\n` +
          `**Action:** ${warnings === 0 ? 'Avertissement' : 'Mute 10 minutes'}`,
        fields: [
          { name: 'Message original', value: message.content.substring(0, 1000) || 'Vide' }
        ]
      });
    } catch (error) {
      console.error('[Bad Words] Error handling:', error);
    }
  }

  async checkGlobalFlood(message, now) {
    const channelKey = `${message.guild.id}-${message.channel.id}`;
    
    if (!this.globalMessageCache.has(channelKey)) {
      this.globalMessageCache.set(channelKey, []);
    }
    
    const channelMessages = this.globalMessageCache.get(channelKey);
    channelMessages.push({ 
      id: message.id, 
      authorId: message.author.id,
      authorTag: message.author.tag,
      timestamp: now,
      isBot: message.author.bot,
      isWebhook: !!message.webhookId
    });
    
    const recentMessages = channelMessages.filter(m => now - m.timestamp < 5000);
    this.globalMessageCache.set(channelKey, recentMessages);
    
    if (recentMessages.length >= 10) {
      const botCount = recentMessages.filter(m => m.isBot || m.isWebhook).length;
      const humanCount = recentMessages.filter(m => !m.isBot && !m.isWebhook).length;
      const isMostlyBots = botCount >= 8;
      
      console.log(`[Global Flood] Detected in ${message.channel.name} (${recentMessages.length} msg, ${botCount} bots, ${humanCount} humans)`);
      
      const deletedCount = await this.bulkDeleteMessages(message.channel, recentMessages.map(m => m.id));
      
      console.log(`[Global Flood] Deleted ${deletedCount} messages`);
      
      if (!isMostlyBots && humanCount > 0) {
        await message.channel.send({
          embeds: [{
            color: 0xff0000,
            title: '🚨 Flood détecté',
            description: `**${deletedCount} messages** supprimés pour flood massif.\n\n⚠️ Ralentissez le débit de messages !`,
            timestamp: new Date().toISOString(),
            footer: { text: 'TheoProtect Auto-Moderation' }
          }]
        }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
      }
      
      const humanAuthors = recentMessages.filter(m => !m.isBot && !m.isWebhook);
      const uniqueHumans = [...new Set(humanAuthors.map(m => m.authorId))];
      
      for (const authorId of uniqueHumans) {
        try {
          const member = await message.guild.members.fetch(authorId).catch(() => null);
          if (member && !member.permissions.has('Administrator')) {
            const key = `${authorId}-${message.guild.id}`;
            const sanctions = (this.floodSanctions.get(key) || 0) + 1;
            this.floodSanctions.set(key, sanctions);
            
            if (sanctions === 1) {
              await member.timeout(10 * 60 * 1000, '[Auto-Mod] Participation à un flood').catch(console.error);
              db.updateReputation(message.guild.id, authorId, -25);
              console.log(`[Global Flood] Muted ${member.user.tag} (10 min)`);
            } else if (sanctions === 2) {
              await member.timeout(60 * 60 * 1000, '[Auto-Mod] Flood répété').catch(console.error);
              db.updateReputation(message.guild.id, authorId, -40);
              console.log(`[Global Flood] Muted ${member.user.tag} (1 hour)`);
            } else {
              await member.kick('[Auto-Mod] Flood répété (3e fois)').catch(console.error);
              db.updateReputation(message.guild.id, authorId, -60);
              console.log(`[Global Flood] Kicked ${member.user.tag}`);
            }
            
            setTimeout(() => {
              this.floodSanctions.delete(key);
            }, 2 * 60 * 60 * 1000);
          }
        } catch (e) {
          console.error('[Global Flood] Sanction error:', e);
        }
      }
      
      const botAuthors = [...new Set(recentMessages.filter(m => m.isBot || m.isWebhook).map(m => m.authorTag))];
      
      await this.logToChannel(message.guild, {
        color: isMostlyBots ? 0xff6600 : 0xff0000,
        title: isMostlyBots ? '⚠️ Flood massif de bots supprimé' : '🚨 Flood massif détecté',
        description: 
          `**Salon:** ${message.channel}\n` +
          `**Messages supprimés:** ${deletedCount}\n` +
          `**Bots/Webhooks:** ${botCount}\n` +
          `**Utilisateurs:** ${humanCount}\n\n` +
          (isMostlyBots ? `**Sources:** ${botAuthors.join(', ')}` : ''),
        fields: uniqueHumans.length > 0 ? [
          { name: 'Utilisateurs sanctionnés', value: uniqueHumans.map(id => `<@${id}>`).join(', ') || 'Aucun' }
        ] : []
      });
      
      this.globalMessageCache.delete(channelKey);
      
      db.logAction(message.guild.id, {
        type: 'global_flood_detected',
        channel_id: message.channel.id,
        messages_count: deletedCount,
        bot_count: botCount,
        human_count: humanCount,
        timestamp: now
      });
      
      return true;
    }
    
    return false;
  }

  async logToChannel(guild, embedData) {
    try {
      const logChannel = guild.channels.cache.find(c => 
        c.name.includes('log') || c.name.includes('theoprotect')
      );
      
      if (logChannel && logChannel.isTextBased()) {
        await logChannel.send({
          embeds: [{
            ...embedData,
            timestamp: new Date().toISOString(),
            footer: { text: 'TheoProtect Auto-Moderation' }
          }]
        }).catch(console.error);
      }
    } catch (error) {
      console.error('[Log to channel] Error:', error);
    }
  }

  async bulkDeleteMessages(channel, messageIds) {
    let deletedCount = 0;
    
    const chunks = [];
    for (let i = 0; i < messageIds.length; i += 100) {
      chunks.push(messageIds.slice(i, i + 100));
    }
    
    for (const chunk of chunks) {
      try {
        if (chunk.length > 1) {
          await channel.bulkDelete(chunk, true).catch(async (err) => {
            console.log('[Bulk Delete] Failed, trying one by one...');
            for (const id of chunk) {
              try {
                const msg = await channel.messages.fetch(id).catch(() => null);
                if (msg) {
                  await msg.delete().catch(() => {});
                  deletedCount++;
                }
              } catch (e) {}
            }
          });
          deletedCount += chunk.length;
        } else if (chunk.length === 1) {
          const msg = await channel.messages.fetch(chunk[0]).catch(() => null);
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
    if (!this.messageCache.has(key)) {
      this.messageCache.set(key, []);
    }
    
    const messages = this.messageCache.get(key);
    messages.push({ content: message.content, timestamp: now, id: message.id });
    
    const recentMessages = messages.filter(m => now - m.timestamp < 10000).slice(-10);
    this.messageCache.set(key, recentMessages);
    
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
      
      for (const msg of recentInWindow) {
        try {
          const toDelete = await message.channel.messages.fetch(msg.id).catch(() => null);
          if (toDelete) await toDelete.delete().catch(console.error);
        } catch (e) {}
      }
      
      if (message.member) {
        await message.member.timeout(5 * 60 * 1000, '[Auto-Mod] Spam détecté').catch(console.error);
      }
      
      db.updateReputation(message.guild.id, message.author.id, -20);
      
      await message.channel.send({
        content: `🔇 ${message.author} a été **mute 5 minutes** pour spam.`,
        allowedMentions: { users: [message.author.id] }
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      
      this.messageCache.delete(key);
      return true;
    }
    
    return false;
  }

  clearCache() {
    const now = Date.now();
    
    for (const [key, messages] of this.messageCache.entries()) {
      const recent = messages.filter(m => now - m.timestamp < 60000);
      if (recent.length === 0) {
        this.messageCache.delete(key);
      } else {
        this.messageCache.set(key, recent);
      }
    }
    
    for (const [key, messages] of this.globalMessageCache.entries()) {
      const recent = messages.filter(m => now - m.timestamp < 60000);
      if (recent.length === 0) {
        this.globalMessageCache.delete(key);
      } else {
        this.globalMessageCache.set(key, recent);
      }
    }
    
    for (const [key, count] of this.botSpamCache.entries()) {
      this.botSpamCache.delete(key);
    }
  }
}

export default new AutoAntiSpam();