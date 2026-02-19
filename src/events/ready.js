import { ActivityType } from 'discord.js';
import { getCurrentVersion, checkForUpdates } from '../utils/version.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    const version = getCurrentVersion();
    
    console.log(`🚀 ${client.user.tag} is online!`);
    console.log(`📦 Version: v${version}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Protecting ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} members`);
    
    // Check for updates on startup
    const updateInfo = await checkForUpdates();
    if (updateInfo.hasUpdate) {
      console.log(`\n⚠️  NEW UPDATE AVAILABLE: v${updateInfo.latest}`);
      console.log(`📥 Current version: v${updateInfo.current}`);
      console.log(`🔗 Download: ${updateInfo.releaseUrl}`);
      console.log(`💡 Use /update check to see details\n`);
    } else if (updateInfo.error) {
      console.log(`⚠️  Could not check for updates: ${updateInfo.error}`);
    } else {
      console.log(`✅ You are running the latest version!\n`);
    }
    
    // Set status
    client.user.setPresence({
      activities: [{
        name: `v${version} | ${client.guilds.cache.size} serveurs | /help`,
        type: ActivityType.Watching
      }],
      status: 'online'
    });

    // Update status every 5 minutes
    setInterval(() => {
      const activities = [
        { name: `v${version} | /help`, type: ActivityType.Watching },
        { name: 'les raids 🛡️', type: ActivityType.Watching },
        { name: 'votre sécurité 🔒', type: ActivityType.Watching },
        { name: `${client.guilds.cache.size} serveurs`, type: ActivityType.Watching }
      ];
      const activity = activities[Math.floor(Math.random() * activities.length)];
      client.user.setPresence({ activities: [activity], status: 'online' });
    }, 300000);
  }
};