import { ActivityType } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🚀 ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Protecting ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} members`);
    
    // Set status
    client.user.setPresence({
      activities: [{
        name: `${client.guilds.cache.size} serveurs | /help`,
        type: ActivityType.Watching
      }],
      status: 'online'
    });

    // Update status every 5 minutes
    setInterval(() => {
      const activities = [
        { name: `/help | ${client.guilds.cache.size} serveurs`, type: ActivityType.Watching },
        { name: 'les raids 🛡️', type: ActivityType.Watching },
        { name: 'votre sécurité 🔒', type: ActivityType.Watching }
      ];
      const activity = activities[Math.floor(Math.random() * activities.length)];
      client.user.setPresence({ activities: [activity], status: 'online' });
    }, 300000);
  }
};