import autoAntiSpam from '../systems/autoAntiSpam.js';
import db from '../database/database.js';

export default {
  name: 'messageCreate',
  async execute(message) {
    // Ignorer les messages DM
    if (!message.guild) return;
    
    // TOUS les messages sont maintenant traités (y compris bots, webhooks, API)
    // La détection de flood global s'applique à TOUTES les sources
    
    try {
      // Auto anti-spam check (inclut bad words + flood detection + spam API)
      await autoAntiSpam.checkMessage(message);
      
      // Incrémenter réputation UNIQUEMENT pour les humains
      if (!message.author.bot && !message.webhookId) {
        const lastIncrement = db.getLastReputationIncrement(message.guild.id, message.author.id);
        const now = Date.now();
        
        if (!lastIncrement || now - lastIncrement > 10 * 60 * 1000) {
          db.updateReputation(message.guild.id, message.author.id, 1);
          db.setLastReputationIncrement(message.guild.id, message.author.id, now);
        }
      }
    } catch (error) {
      console.error('[messageCreate] Error:', error);
    }
  }
};