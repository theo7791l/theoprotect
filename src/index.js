import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { readdirSync } from 'fs';
import config from './config/config.js';
import db from './database/database.js';
import { getCommandsPath, getEventsPath } from './utils/paths.js';

// Initialize database
db.init();

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.commands = new Collection();

// Load commands
const commandsPath = getCommandsPath();
try {
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    try {
      const filePath = `${commandsPath}/${file}`.replace(/\\/g, '/');
      const command = await import(`file:///${filePath}`);
      if (command.default?.data && command.default?.execute) {
        client.commands.set(command.default.data.name, command.default);
        console.log(`✅ Loaded command: ${command.default.data.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
    }
  }
  console.log(`✅ Loaded ${client.commands.size} commands`);
} catch (error) {
  console.error('❌ No commands folder found or error loading commands:', error.message);
}

// Load events
const eventsPath = getEventsPath();
try {
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    try {
      const filePath = `${eventsPath}/${file}`.replace(/\\/g, '/');
      const event = await import(`file:///${filePath}`);
      if (event.default?.name && event.default?.execute) {
        if (event.default.once) {
          client.once(event.default.name, (...args) => event.default.execute(...args, client));
        } else {
          client.on(event.default.name, (...args) => event.default.execute(...args, client));
        }
        console.log(`✅ Loaded event: ${event.default.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to load event ${file}:`, err.message);
    }
  }
  console.log(`✅ Loaded ${eventFiles.length} events`);
} catch (error) {
  console.error('❌ No events folder found or error loading events:', error.message);
}

// Login
console.log('🚀 Starting TheoProtect...');
client.login(config.token).catch(error => {
  console.error('❌ Failed to login:', error.message);
  console.error('\nPlease check:');
  console.error('1. DISCORD_TOKEN is set in .env');
  console.error('2. Token is valid and not expired');
  console.error('3. Bot has MESSAGE CONTENT and SERVER MEMBERS intents enabled in Discord Developer Portal');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  db.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down...');
  db.close();
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});