import axios from 'axios';

/**
 * AI Moderator System
 * Uses OpenAI API to analyze complex moderation cases
 * Requires OPENAI_API_KEY in .env
 */
class AIModerator {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.enabled = !!this.apiKey;
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes

    if (!this.enabled) {
      console.log('⚠️  [AI Mod] OpenAI API not configured - AI Moderator disabled');
      console.log('   💡 Add OPENAI_API_KEY to .env to enable');
    } else {
      console.log(`✅ [AI Mod] AI Moderator enabled (${this.model})`);
    }
  }

  /**
   * Check if system is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Analyze message content with AI
   */
  async analyzeMessage(message, context = {}) {
    if (!this.enabled) {
      return { analyzed: false, reason: 'AI Moderator disabled' };
    }

    // Check cache
    const cacheKey = `${message.id}-${message.content}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    try {
      const prompt = this.buildPrompt(message, context);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un modérateur IA pour Discord. Analyse les messages et détecte: toxicité, harcèlement, discours haineux, spam intelligent, manipulation, et autres violations. Réponds UNIQUEMENT en JSON avec: {"violates": boolean, "severity": 0-10, "category": "...", "reason": "...", "confidence": 0-100}'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      const analysis = JSON.parse(aiResponse);

      const result = {
        analyzed: true,
        violates: analysis.violates,
        severity: analysis.severity,
        category: analysis.category,
        reason: analysis.reason,
        confidence: analysis.confidence,
        action: analysis.violates ? this.determineAction(analysis) : null
      };

      // Cache result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('[AI Mod] Analysis error:', error.message);
      return { analyzed: false, error: error.message };
    }
  }

  /**
   * Build analysis prompt
   */
  buildPrompt(message, context) {
    let prompt = `Message à analyser: "${message.content}"\n`;
    prompt += `Auteur: ${message.author.tag} (ID: ${message.author.id})\n`;
    
    if (context.userHistory) {
      prompt += `Historique: ${context.userHistory.warnings || 0} warns, réputation: ${context.userHistory.reputation || 100}\n`;
    }

    if (context.recentMessages) {
      prompt += `Messages récents du même utilisateur: ${context.recentMessages.length}\n`;
    }

    return prompt;
  }

  /**
   * Determine action based on AI analysis
   */
  determineAction(analysis) {
    const { severity, category, confidence } = analysis;

    // Only act on high confidence
    if (confidence < 70) {
      return { type: 'NONE', reason: 'Confiance insuffisante' };
    }

    if (severity >= 9 && ['hate_speech', 'harassment', 'threats'].includes(category)) {
      return {
        type: 'BAN',
        reason: `${category}: ${analysis.reason}`,
        deleteMessage: true
      };
    } else if (severity >= 7) {
      return {
        type: 'TIMEOUT',
        reason: `${category}: ${analysis.reason}`,
        duration: 3600000 * Math.ceil(severity / 2), // Hours based on severity
        deleteMessage: true
      };
    } else if (severity >= 5) {
      return {
        type: 'WARN',
        reason: `${category}: ${analysis.reason}`,
        deleteMessage: true
      };
    } else if (severity >= 3) {
      return {
        type: 'DELETE',
        reason: `${category}: ${analysis.reason}`
      };
    }

    return { type: 'NONE' };
  }

  /**
   * Execute moderation action
   */
  async executeAction(message, action, analysis) {
    try {
      if (action.deleteMessage) {
        await message.delete();
      }

      switch (action.type) {
        case 'DELETE':
          await message.channel.send({
            content: `⚠️ ${message.author}, message supprimé par l'IA: ${action.reason}`,
            allowedMentions: { users: [message.author.id] }
          }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 8000));
          break;

        case 'WARN':
          await message.channel.send({
            content: `⚠️ ${message.author} a reçu un avertissement (IA).\n**Raison:** ${action.reason}\n**Confiance:** ${analysis.confidence}%`,
            allowedMentions: { users: [message.author.id] }
          });
          break;

        case 'TIMEOUT':
          const hours = Math.ceil(action.duration / 3600000);
          await message.member.timeout(action.duration, action.reason);
          await message.channel.send({
            content: `🔇 ${message.author} timeout ${hours}h (détection IA).\n**Raison:** ${action.reason}`,
            allowedMentions: { users: [] }
          });
          break;

        case 'BAN':
          await message.member.ban({ reason: action.reason, deleteMessageSeconds: 86400 });
          await message.channel.send({
            content: `🔨 ${message.author.tag} banni (détection IA).\n**Raison:** ${action.reason}`,
            allowedMentions: { users: [] }
          });
          break;
      }

      return true;
    } catch (error) {
      console.error('[AI Mod] Error executing action:', error);
      return false;
    }
  }

  /**
   * Clear old cache entries
   */
  clearCache() {
    const now = Date.now();
    for (const [key, data] of this.cache.entries()) {
      if (now - data.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

export default new AIModerator();