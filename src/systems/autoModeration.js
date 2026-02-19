// Auto-moderation passif qui tourne en arrière-plan
import antiNuke from './antiNuke.js';
import autoAntiRaid from './autoAntiRaid.js';

class AutoModeration {
  constructor() {
    this.cleanupInterval = null;
  }

  start() {
    console.log('✅ [Auto-Moderation] System started');
    
    // Nettoyer les caches toutes les minutes
    this.cleanupInterval = setInterval(() => {
      antiNuke.clearCache();
      autoAntiRaid.clearCache();
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