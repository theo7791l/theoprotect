import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/config.js';
import db from './database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
try {
  db.init();
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
}

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
const commandsPath = join(__dirname, 'commands');
if (existsSync(commandsPath)) {
  try {
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      try {
        const command = await import(`./commands/${file}`);
        if (command.default?.data && command.default?.execute) {
          client.commands.set(command.default.data.name, command.default);
          console.log(`✅ Loaded command: ${command.default.data.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load command ${file}:`, error.message);
      }
    }
    console.log(`✅ Loaded ${client.commands.size} commands`);
  } catch (error) {
    console.error('❌ Error reading commands directory:', error);
  }
} else {
  console.warn('⚠️  Commands folder not found');
}

// Load events
const eventsPath = join(__dirname, 'events');
if (existsSync(eventsPath)) {
  try {
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    let loadedEvents = 0;
    
    for (const file of eventFiles) {
      try {
        const event = await import(`./events/${file}`);
        if (event.default?.name && event.default?.execute) {
          if (event.default.once) {
            client.once(event.default.name, (...args) => event.default.execute(...args, client));
          } else {
            client.on(event.default.name, (...args) => event.default.execute(...args, client));
          }
          console.log(`✅ Loaded event: ${event.default.name}`);
          loadedEvents++;
        }
      } catch (error) {
        console.error(`❌ Failed to load event ${file}:`, error.message);
      }
    }
    console.log(`✅ Loaded ${loadedEvents} events`);
  } catch (error) {
    console.error('❌ Error reading events directory:', error);
  }
} else {
  console.warn('⚠️  Events folder not found');
}

// Validate configuration
if (!config.token) {
  console.error('❌ DISCORD_TOKEN not found in .env file');
  console.error('Please create a .env file with your bot token');
  process.exit(1);
}

if (!config.clientId) {
  console.error('❌ CLIENT_ID not found in .env file');
  process.exit(1);
}

console.log('\n🚀 Starting TheoProtect...');

// Login
client.login(config.token).catch(error => {
  console.error('❌ Failed to login:', error.message);
  console.error('\nPlease check:');
  console.error('- DISCORD_TOKEN is set in .env');
  console.error('- Token is valid and not expired');
  console.error('- Bot has MESSAGE CONTENT and SERVER MEMBERS intents enabled in Discord Developer Portal');
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

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  db.close();
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});