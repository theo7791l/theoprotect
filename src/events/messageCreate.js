import antiSpam from '../systems/antiSpam.js';
import antiPhishing from '../systems/antiPhishing.js';
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

    // Anti-phishing check (priority)
    const phishingResult = await antiPhishing.analyzeMessage(message);
    if (phishingResult.isPhishing) {
      await antiPhishing.executeAction(message, phishingResult.action, phishingResult.urls);
      
      // Log action
      db.logAction(
        message.guild.id,
        message.author.id,
        client.user.id,
        phishingResult.action.type,
        `Phishing détecté: ${phishingResult.urls.map(u => u.url).join(', ')}`,
        null,
        JSON.stringify(phishingResult.urls)
      );

      // Update reputation
      db.updateReputation(message.author.id, message.guild.id, { score: -20 });
      
      console.log(`[AntiPhishing] ${message.author.tag} - ${phishingResult.action.type} - URLs: ${phishingResult.urls.length}`);
      return;
    }

    // Anti-spam check
    if (config.antiSpam.enabled) {
      const settings = db.getGuildSettings(message.guild.id);
      if (settings.antispam_enabled) {
        const result = await antiSpam.analyzeMessage(message);
        
        if (result.isSpam && result.action.type !== 'NONE') {
          await antiSpam.executeAction(message, result.action);
          
          // Log action
          db.logAction(
            message.guild.id,
            message.author.id,
            client.user.id,
            result.action.type,
            result.action.reason,
            result.action.duration || null,
            JSON.stringify(result.violations)
          );

          // Update reputation based on action severity
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
        }
      }
    }
  }
};