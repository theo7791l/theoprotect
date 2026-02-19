import autoModeration from '../systems/autoModeration.js';

export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🚀 ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Protecting ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} members`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('🛡️  Systems Status:');
    console.log('✅ Anti-Spam Detection');
    console.log('✅ Anti-Raid Detection (Auto)');
    console.log('✅ Anti-Nuke Protection (Auto)');
    console.log('✅ Auto-Moderation (Background)');
    console.log('');
    
    // Start auto-moderation
    autoModeration.start();
    
    // Set bot status
    client.user.setPresence({
      activities: [{ name: `${client.guilds.cache.size} serveurs | /config`, type: 3 }],
      status: 'online'
    });
    
    console.log('✅ TheoProtect ready to protect!');
    console.log('');
  }
};