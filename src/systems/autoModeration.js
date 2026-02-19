import antiNuke from './antiNuke.js';
import autoAntiRaid from './autoAntiRaid.js';
import autoAntiSpam from './autoAntiSpam.js';

class AutoModeration {
  constructor() {
    this.cleanupInterval = null;
  }

  start() {
    console.log('✅ [Auto-Moderation] System started');
    console.log('✅ [Bad Words Filter] Active with 200+ words');
    console.log('✅ [API Spam Detection] Active (10 msg/5s threshold)');
    
    // Nettoyer les caches toutes les minutes
    this.cleanupInterval = setInterval(() => {
      antiNuke.clearCache();
      autoAntiRaid.clearCache();
      autoAntiSpam.clearCache();
    }, 60000);
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('🛑 [Auto-Moderation] System stopped');
  }
}

export default new AutoModeration();