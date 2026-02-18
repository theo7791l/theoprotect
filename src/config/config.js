import dotenv from 'dotenv';
dotenv.config();

export default {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  ownerId: process.env.OWNER_ID,
  prefix: process.env.DEFAULT_PREFIX || '!',
  
  // Colors
  colors: {
    success: 0x00ff00,
    error: 0xff0000,
    warning: 0xffa500,
    info: 0x0099ff,
    primary: 0x5865f2
  },
  
  // Anti-spam settings
  antiSpam: {
    enabled: true,
    maxMessages: 5,
    timeWindow: 5000, // ms
    maxDuplicates: 3,
    maxMentions: 5,
    maxEmojis: 10,
    warnThreshold: 3,
    muteThreshold: 5,
    kickThreshold: 7,
    banThreshold: 10
  },
  
  // Anti-raid settings
  antiRaid: {
    enabled: true,
    joinThreshold: 10,
    joinTimeWindow: 10000, // ms
    accountAgeMin: 7, // days
    autoQuarantine: true
  },
  
  // Captcha settings
  captcha: {
    enabled: false,
    length: 6,
    timeout: 300000, // 5 min
    maxAttempts: 3,
    difficulty: 'medium' // easy, medium, hard
  },
  
  // Permissions
  permissions: {
    admin: ['Administrator', 'ManageGuild'],
    moderator: ['KickMembers', 'BanMembers', 'ManageMessages']
  }
};