import autoAntiSpam from '../systems/autoAntiSpam.js';
import db from '../database/database.js';

export default {
  name: 'messageCreate',
  async execute(message) {
    // Ignorer les messages DM
    if (!message.guild) return;
    
    // Ignorer les bots (sauf pour la détection API spam)
    if (message.author.bot && !message.webhookId) return;
    
    try {
      // Auto anti-spam check (inclut bad words)
      await autoAntiSpam.checkMessage(message);
      
      // Incrémenter réputation pour activité normale (1 point toutes les 10 minutes max)
      if (!message.author.bot) {
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