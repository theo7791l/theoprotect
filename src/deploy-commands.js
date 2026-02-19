import pkg from 'discord.js';
const { REST, Routes } = pkg;
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`📦 Loading ${commandFiles.length} commands...`);

for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    if (command.default?.data) {
      commands.push(command.default.data.toJSON());
      console.log(`✅ Loaded: ${command.default.data.name}`);
    }
  } catch (error) {
    console.error(`❌ Failed to load ${file}:`, error.message);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands.`);

    if (process.env.GUILD_ID) {
      // Guild commands (instant, for development)
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
      console.log(`✅ Successfully reloaded ${data.length} guild commands.`);
    } else {
      // Global commands (takes up to 1 hour)
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
      console.log(`✅ Successfully reloaded ${data.length} global commands.`);
      console.log(`⚠️  Global commands can take up to 1 hour to update.`);
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
})();