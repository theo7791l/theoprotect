import antiSpam from '../systems/antiSpam.js';
import config from '../config/config.js';

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Anti-spam check
    if (config.antiSpam.enabled) {
      const result = await antiSpam.analyzeMessage(message);
      
      if (result.isSpam && result.action.type !== 'NONE') {
        await antiSpam.executeAction(message, result.action);
        
        // Log to console
        console.log(`[AntiSpam] ${message.author.tag} - ${result.action.type} - Score: ${result.score}`);
      }
    }
  }
};