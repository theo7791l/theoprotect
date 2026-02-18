import axios from 'axios';

class AntiPhishingSystem {
  constructor() {
    this.cache = new Map(); // URL -> {isMalicious, timestamp}
    this.cacheTimeout = 3600000; // 1 hour
    this.phishingPatterns = [
      // Discord scams
      /discord[.-]?nitro/i,
      /free[.-]?nitro/i,
      /discord[.-]?gift/i,
      /steam[.-]?nitro/i,
      /dlscord/i,
      /discorcl/i,
      /discorcd/i,
      
      // Steam scams
      /steamcommunity[.-]?(com|ru|org|net|co)/i,
      /steam[.-]?community[.-]?com/i,
      /steampowered[.-]?(ru|org|net)/i,
      /steamcornmunity/i,
      
      // Generic phishing
      /verify[.-]?account/i,
      /claim[.-]?reward/i,
      /urgent[.-]?security/i,
      /suspended[.-]?account/i,
      /bit\.ly\//i,
      /tinyurl\.com\//i,
      /goo\.gl\//i
    ];
    
    this.suspiciousTLDs = [
      '.tk', '.ml', '.ga', '.cf', '.gq', // Free domains
      '.ru', '.su', '.cn', // High-risk countries
      '.top', '.xyz', '.club', '.online'
    ];
  }

  /**
   * Extract URLs from message
   */
  extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return text.match(urlRegex) || [];
  }

  /**
   * Check if URL matches phishing patterns
   */
  checkPatterns(url) {
    const risks = [];
    
    // Check phishing patterns
    for (const pattern of this.phishingPatterns) {
      if (pattern.test(url)) {
        risks.push({
          type: 'PATTERN_MATCH',
          severity: 4,
          pattern: pattern.toString()
        });
      }
    }

    // Check suspicious TLDs
    for (const tld of this.suspiciousTLDs) {
      if (url.toLowerCase().includes(tld)) {
        risks.push({
          type: 'SUSPICIOUS_TLD',
          severity: 2,
          tld
        });
      }
    }

    // Check for IP addresses in URL
    const ipRegex = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    if (ipRegex.test(url)) {
      risks.push({
        type: 'IP_ADDRESS',
        severity: 3,
        detail: 'URL contient une adresse IP'
      });
    }

    // Check for homograph attacks (unicode lookalikes)
    if (/[\u0400-\u04FF]/.test(url)) { // Cyrillic
      risks.push({
        type: 'HOMOGRAPH',
        severity: 5,
        detail: 'Caractères cyrilliques détectés'
      });
    }

    // Check for excessive subdomains
    const hostname = url.split('/')[2] || '';
    const subdomains = hostname.split('.');
    if (subdomains.length > 4) {
      risks.push({
        type: 'EXCESSIVE_SUBDOMAINS',
        severity: 2,
        count: subdomains.length
      });
    }

    return risks;
  }

  /**
   * Check URL with Google Safe Browsing (requires API key)
   */
  async checkGoogleSafeBrowsing(url) {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
    if (!apiKey) return null;

    try {
      const response = await axios.post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          client: {
            clientId: 'theoprotect',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        },
        { timeout: 5000 }
      );

      return response.data.matches ? response.data.matches.length > 0 : false;
    } catch (error) {
      console.error('[AntiPhishing] Google Safe Browsing error:', error.message);
      return null;
    }
  }

  /**
   * Check URL with PhishTank (free, no API key needed)
   */
  async checkPhishTank(url) {
    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await axios.get(
        `https://checkurl.phishtank.com/checkurl/`,
        {
          params: {
            url: encodedUrl,
            format: 'json'
          },
          timeout: 5000
        }
      );

      return response.data?.results?.in_database === true;
    } catch (error) {
      // PhishTank has rate limits, fail silently
      return null;
    }
  }

  /**
   * Main analysis function
   */
  async analyzeMessage(message) {
    const urls = this.extractUrls(message.content);
    if (urls.length === 0) return { isPhishing: false };

    const results = [];

    for (const url of urls) {
      // Check cache first
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        if (cached.isMalicious) {
          results.push({ url, ...cached });
        }
        continue;
      }

      // Pattern-based check (instant)
      const patternRisks = this.checkPatterns(url);
      const patternScore = patternRisks.reduce((sum, r) => sum + r.severity, 0);

      // External API checks (async, may fail)
      let externalCheck = null;
      try {
        const [googleResult, phishTankResult] = await Promise.allSettled([
          this.checkGoogleSafeBrowsing(url),
          this.checkPhishTank(url)
        ]);

        if (googleResult.status === 'fulfilled' && googleResult.value === true) {
          externalCheck = 'Google Safe Browsing';
        } else if (phishTankResult.status === 'fulfilled' && phishTankResult.value === true) {
          externalCheck = 'PhishTank';
        }
      } catch (error) {
        console.error('[AntiPhishing] External check error:', error);
      }

      const isMalicious = patternScore >= 4 || externalCheck !== null;

      // Cache result
      this.cache.set(url, {
        isMalicious,
        patternScore,
        patternRisks,
        externalCheck,
        timestamp: Date.now()
      });

      if (isMalicious) {
        results.push({
          url,
          isMalicious,
          patternScore,
          patternRisks,
          externalCheck
        });
      }
    }

    return {
      isPhishing: results.length > 0,
      urls: results,
      action: results.length > 0 ? this.determineAction(results) : null
    };
  }

  /**
   * Determine action based on threat level
   */
  determineAction(results) {
    const maxScore = Math.max(...results.map(r => r.patternScore));
    const hasExternalConfirmation = results.some(r => r.externalCheck);

    if (hasExternalConfirmation || maxScore >= 8) {
      return {
        type: 'BAN',
        reason: 'Lien de phishing détecté (confirmé par base de données externe)',
        deleteMessage: true
      };
    } else if (maxScore >= 5) {
      return {
        type: 'KICK',
        reason: 'Lien hautement suspect détecté',
        deleteMessage: true
      };
    } else if (maxScore >= 3) {
      return {
        type: 'DELETE',
        reason: 'Lien suspect détecté',
        warn: true
      };
    }

    return { type: 'DELETE', reason: 'Lien potentiellement dangereux' };
  }

  /**
   * Execute action
   */
  async executeAction(message, action, results) {
    try {
      // Delete message
      if (action.deleteMessage || action.type === 'DELETE') {
        await message.delete();
      }

      const urlList = results.map(r => `• <${r.url}>`).join('\n');
      const detectionInfo = results.map(r => {
        if (r.externalCheck) return `Confirmé par: ${r.externalCheck}`;
        return `Patterns détectés: ${r.patternRisks.map(pr => pr.type).join(', ')}`;
      }).join('\n');

      switch (action.type) {
        case 'DELETE':
          await message.channel.send({
            content: `⚠️ ${message.author}, message supprimé pour lien suspect.\n\n**URLs bloquées:**\n${urlList}`,
            allowedMentions: { users: [message.author.id] }
          }).then(msg => setTimeout(() => msg.delete(), 10000));
          break;

        case 'KICK':
          await message.member.kick(action.reason);
          await message.channel.send({
            content: `🚫 ${message.author.tag} a été expulsé pour partage de lien de phishing.\n\n${detectionInfo}`,
            allowedMentions: { users: [] }
          });
          break;

        case 'BAN':
          await message.member.ban({ reason: action.reason, deleteMessageSeconds: 86400 });
          await message.channel.send({
            content: `🔨 ${message.author.tag} a été banni pour partage de lien de phishing confirmé.\n\n${detectionInfo}`,
            allowedMentions: { users: [] }
          });
          break;
      }

      return true;
    } catch (error) {
      console.error('[AntiPhishing] Error executing action:', error);
      return false;
    }
  }

  /**
   * Clear old cache entries
   */
  clearCache() {
    const now = Date.now();
    for (const [url, data] of this.cache.entries()) {
      if (now - data.timestamp > this.cacheTimeout) {
        this.cache.delete(url);
      }
    }
  }
}

export default new AntiPhishingSystem();