import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/config.js';
import db from './database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
const commandsPath = join(__dirname, 'commands');
try {
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    if (command.default?.data && command.default?.execute) {
      client.commands.set(command.default.data.name, command.default);
      console.log(`✅ Loaded command: ${command.default.data.name}`);
    }
  }
  console.log(`✅ Loaded ${client.commands.size} commands`);
} catch (error) {
  console.log('⚠️  No commands folder found or empty');
}

// Load events
const eventsPath = join(__dirname, 'events');
try {
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    if (event.default?.name && event.default?.execute) {
      if (event.default.once) {
        client.once(event.default.name, (...args) => event.default.execute(...args, client));
      } else {
        client.on(event.default.name, (...args) => event.default.execute(...args, client));
      }
      console.log(`✅ Loaded event: ${event.default.name}`);
    }
  }
  console.log(`✅ Loaded ${eventFiles.length} events`);
} catch (error) {
  console.log('⚠️  No events folder found or empty');
}

// Login
client.login(config.token).catch(error => {
  console.error('❌ Failed to login:', error);
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