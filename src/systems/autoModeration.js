import antiNuke from './antiNuke.js';
import autoAntiRaid from './autoAntiRaid.js';
import autoAntiSpam from './autoAntiSpam.js';

class AutoModeration {
  constructor() {
    this.cleanupInterval = null;
  }

  start() {
    console.log('✅ [Auto-Moderation] System started');
    console.log('✅ [Bad Words Filter] 200+ words (exact match only)');
    console.log('✅ [Global Flood Detection] 12+ msg/5s threshold (ALL sources)');
    console.log('✅ [User Spam Detection] Level-based thresholds');
    
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