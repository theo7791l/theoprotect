import antiSpam from '../systems/antiSpam.js';
import antiPhishing from '../systems/antiPhishing.js';
import nsfwDetection from '../systems/nsfwDetection.js';
import aiModerator from '../systems/aiModerator.js';
import config from '../config/config.js';
import db from '../database/database.js';

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Track message for reputation
    try {
      db.updateReputation(message.author.id, message.guild.id, { 
        messages_sent: 1,
        score: 0.1 // Small positive increment for activity
      });
    } catch (error) {
      // Ignore reputation errors
    }

    // Get guild settings
    const settings = db.getGuildSettings(message.guild.id);

    // 1. NSFW Detection (priority if enabled)
    if (nsfwDetection.isEnabled()) {
      const nsfwResult = await nsfwDetection.analyzeMessage(message);
      if (nsfwResult.hasNSFW && nsfwResult.action) {
        await nsfwDetection.executeAction(message, nsfwResult.action, nsfwResult.images);
        
        // Log action
        db.logAction(
          message.guild.id,
          message.author.id,
          client.user.id,
          nsfwResult.action.type,
          `NSFW détecté: ${nsfwResult.images.length} image(s)`,
          nsfwResult.action.duration || null,
          JSON.stringify(nsfwResult.images.map(i => ({ url: i.url, score: i.score })))
        );

        // Update reputation
        const scoreDeduction = {
          'DELETE': -5,
          'WARN': -10,
          'TIMEOUT': -20,
          'BAN': -50
        }[nsfwResult.action.type] || 0;

        db.updateReputation(message.author.id, message.guild.id, { score: scoreDeduction });
        
        console.log(`[NSFW] ${message.author.tag} - ${nsfwResult.action.type} - Images: ${nsfwResult.images.length}`);
        return; // Stop processing
      }
    }

    // 2. Anti-phishing check
    const phishingResult = await antiPhishing.analyzeMessage(message);
    if (phishingResult.isPhishing) {
      await antiPhishing.executeAction(message, phishingResult.action, phishingResult.urls);
      
      db.logAction(
        message.guild.id,
        message.author.id,
        client.user.id,
        phishingResult.action.type,
        `Phishing détecté: ${phishingResult.urls.map(u => u.url).join(', ')}`,
        null,
        JSON.stringify(phishingResult.urls)
      );

      db.updateReputation(message.author.id, message.guild.id, { score: -25 });
      
      console.log(`[AntiPhishing] ${message.author.tag} - ${phishingResult.action.type} - URLs: ${phishingResult.urls.length}`);
      return;
    }

    // 3. Anti-spam check
    if (config.antiSpam.enabled && settings.antispam_enabled) {
      const result = await antiSpam.analyzeMessage(message);
      
      if (result.isSpam && result.action.type !== 'NONE') {
        await antiSpam.executeAction(message, result.action);
        
        db.logAction(
          message.guild.id,
          message.author.id,
          client.user.id,
          result.action.type,
          result.action.reason,
          result.action.duration || null,
          JSON.stringify(result.violations)
        );

        const scoreDeduction = {
          'DELETE': -2,
          'WARN': -5,
          'TIMEOUT': -10,
          'KICK': -20,
          'BAN': -50
        }[result.action.type] || 0;

        db.updateReputation(message.author.id, message.guild.id, { 
          score: scoreDeduction,
          ...(result.action.type === 'TIMEOUT' && { timeouts: 1 }),
          ...(result.action.type === 'KICK' && { kicks: 1 })
        });
        
        console.log(`[AntiSpam] ${message.author.tag} - ${result.action.type} - Score: ${result.score}`);
        return;
      }
    }

    // 4. AI Moderator (last resort for complex cases)
    if (aiModerator.isEnabled() && message.content.length > 20) {
      // Get user context
      const reputation = db.getReputation(message.author.id, message.guild.id);
      const warnings = db.getWarnings(message.author.id, message.guild.id);

      const aiResult = await aiModerator.analyzeMessage(message, {
        userHistory: {
          reputation: reputation?.score || 100,
          warnings: warnings?.length || 0
        }
      });

      if (aiResult.analyzed && aiResult.violates && aiResult.action?.type !== 'NONE') {
        await aiModerator.executeAction(message, aiResult.action, aiResult);

        db.logAction(
          message.guild.id,
          message.author.id,
          client.user.id,
          aiResult.action.type,
          `AI: ${aiResult.reason} (${aiResult.confidence}%)`,
          aiResult.action.duration || null,
          JSON.stringify({ category: aiResult.category, severity: aiResult.severity })
        );

        const scoreDeduction = {
          'DELETE': -3,
          'WARN': -8,
          'TIMEOUT': -15,
          'BAN': -50
        }[aiResult.action.type] || 0;

        db.updateReputation(message.author.id, message.guild.id, { score: scoreDeduction });

        console.log(`[AI Mod] ${message.author.tag} - ${aiResult.action.type} - ${aiResult.category} (${aiResult.severity}/10)`);
      }
    }
  }
};