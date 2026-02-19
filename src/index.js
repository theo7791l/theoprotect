import pkg from 'discord.js';
const { Client, GatewayIntentBits, Collection, ActivityType } = pkg;
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
import db from './database/database.js';
import autoAntiSpam from './systems/autoAntiSpam.js';

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
  // Convert Windows path to file:// URL for ESM
  const fileURL = pathToFileURL(filePath).href;
  const command = (await import(fileURL)).default;
  
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
  // Convert Windows path to file:// URL for ESM
  const fileURL = pathToFileURL(filePath).href;
  const event = (await import(fileURL)).default;
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  
  console.log(`✅ Loaded event: ${event.name}`);
}

// Start dashboard (async after bot is ready)
if (process.env.DISABLE_DASHBOARD !== 'true') {
  try {
    const dashboardURL = pathToFileURL(join(__dirname, 'dashboard', 'server.js')).href;
    await import(dashboardURL);
    console.log('✅ Dashboard loaded successfully');
  } catch (error) {
    console.error('⚠️  Dashboard failed to load:', error.message);
    console.log('💡 Bot will continue without dashboard. Set DISABLE_DASHBOARD=true in .env to hide this message.');
  }
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
