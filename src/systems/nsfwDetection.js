import axios from 'axios';

/**
 * NSFW Image Detection System
 * Uses Sightengine API to detect NSFW content in images
 * Requires SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET in .env
 */
class NSFWDetectionSystem {
  constructor() {
    this.apiUser = process.env.SIGHTENGINE_API_USER;
    this.apiSecret = process.env.SIGHTENGINE_API_SECRET;
    this.enabled = !!(this.apiUser && this.apiSecret);
    this.cache = new Map(); // URL -> result
    this.cacheTimeout = 3600000; // 1 hour

    if (!this.enabled) {
      console.log('⚠️  [NSFW] Sightengine API not configured - NSFW detection disabled');
      console.log('   💡 Add SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET to .env to enable');
    } else {
      console.log('✅ [NSFW] Detection system enabled');
    }
  }

  /**
   * Check if system is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Extract image URLs from message
   */
  extractImageUrls(message) {
    const urls = [];

    // Attachments
    message.attachments.forEach(attachment => {
      if (attachment.contentType?.startsWith('image/')) {
        urls.push(attachment.url);
      }
    });

    // Embeds
    message.embeds.forEach(embed => {
      if (embed.image?.url) urls.push(embed.image.url);
      if (embed.thumbnail?.url) urls.push(embed.thumbnail.url);
    });

    // URLs in message content
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
    const contentUrls = message.content.match(urlRegex) || [];
    urls.push(...contentUrls);

    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Check image URL with Sightengine API
   */
  async checkImage(imageUrl) {
    if (!this.enabled) return null;

    // Check cache
    const cached = this.cache.get(imageUrl);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    try {
      const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
        params: {
          url: imageUrl,
          models: 'nudity-2.1,gore,offensive',
          api_user: this.apiUser,
          api_secret: this.apiSecret
        },
        timeout: 10000
      });

      const data = response.data;

      // Calculate NSFW score
      const nsfwScore = Math.max(
        data.nudity?.sexual_activity || 0,
        data.nudity?.sexual_display || 0,
        data.nudity?.erotica || 0,
        data.gore?.prob || 0,
        data.offensive?.prob || 0
      );

      const result = {
        isNSFW: nsfwScore > 0.7,
        score: nsfwScore,
        details: {
          nudity: data.nudity,
          gore: data.gore,
          offensive: data.offensive
        }
      };

      // Cache result
      this.cache.set(imageUrl, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('[NSFW] API error:', error.message);
      return null;
    }
  }

  /**
   * Analyze message for NSFW content
   */
  async analyzeMessage(message) {
    if (!this.enabled) {
      return { hasNSFW: false, checked: false };
    }

    const imageUrls = this.extractImageUrls(message);
    if (imageUrls.length === 0) {
      return { hasNSFW: false, images: [] };
    }

    const results = [];

    for (const url of imageUrls) {
      const result = await this.checkImage(url);
      if (result && result.isNSFW) {
        results.push({
          url,
          score: result.score,
          details: result.details
        });
      }
    }

    return {
      hasNSFW: results.length > 0,
      checked: true,
      images: results,
      action: results.length > 0 ? this.determineAction(results) : null
    };
  }

  /**
   * Determine action based on NSFW detection
   */
  determineAction(results) {
    const maxScore = Math.max(...results.map(r => r.score));

    if (maxScore >= 0.9) {
      return {
        type: 'BAN',
        reason: 'Contenu NSFW extrêmement explicite',
        deleteMessage: true
      };
    } else if (maxScore >= 0.8) {
      return {
        type: 'TIMEOUT',
        reason: 'Contenu NSFW détecté',
        duration: 86400000, // 24h
        deleteMessage: true
      };
    } else if (maxScore >= 0.7) {
      return {
        type: 'WARN',
        reason: 'Contenu potentiellement inapproprié',
        deleteMessage: true
      };
    }

    return {
      type: 'DELETE',
      reason: 'Contenu suspect détecté'
    };
  }

  /**
   * Execute action
   */
  async executeAction(message, action, results) {
    try {
      // Delete message
      await message.delete();

      const imageList = results.map(r => 
        `• Score: ${(r.score * 100).toFixed(1)}% - ${r.url.substring(0, 50)}...`
      ).join('\n');

      switch (action.type) {
        case 'WARN':
          await message.channel.send({
            content: `⚠️ ${message.author}, votre message a été supprimé pour contenu inapproprié.\n\n**Images détectées:**\n${imageList}`,
            allowedMentions: { users: [message.author.id] }
          }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
          break;

        case 'TIMEOUT':
          await message.member.timeout(action.duration, action.reason);
          await message.channel.send({
            content: `🔇 ${message.author} a été timeout 24h pour partage de contenu NSFW.`,
            allowedMentions: { users: [] }
          });
          break;

        case 'BAN':
          await message.member.ban({ reason: action.reason, deleteMessageSeconds: 86400 });
          await message.channel.send({
            content: `🔨 ${message.author.tag} a été banni pour partage de contenu NSFW explicite.`,
            allowedMentions: { users: [] }
          });
          break;

        default:
          await message.channel.send({
            content: `🚫 Message supprimé : contenu inapproprié détecté.`,
            allowedMentions: { users: [] }
          }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
      }

      return true;
    } catch (error) {
      console.error('[NSFW] Error executing action:', error);
      return false;
    }
  }
}

export default new NSFWDetectionSystem();