import pkg from 'discord.js';
const { Client, GatewayIntentBits, Collection, ActivityType } = pkg;
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import db from './database/database.js';
import autoAntiSpam from './systems/autoAntiSpam.js';

// Import dashboard
import './dashboard/server.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

client.commands = new Collection();

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = (await import(filePath)).default;
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(`⚠️  [WARNING] Command at ${filePath} is missing required "data" or "execute" property.`);
  }
}

// Load events
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = (await import(filePath)).default;
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  
  console.log(`✅ Loaded event: ${event.name}`);
}

// Login
client.login(process.env.DISCORD_TOKEN);

console.log('');
console.log('════════════════════════════════════════');
console.log('🛡️  TheoProtect Bot Starting...');
console.log('════════════════════════════════════════');
console.log('');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Shutting down gracefully...');
  autoAntiSpam.clearCache();
  db.close();
  client.destroy();
  process.exit(0);
});
