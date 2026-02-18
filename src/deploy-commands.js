import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.default?.data) {
    commands.push(command.default.data.toJSON());
    console.log(`✅ Loaded: ${command.default.data.name}`);
  }
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} commands...`);

    // Deploy globally or to a specific guild
    if (config.guildId) {
      // Guild-specific (instant update)
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log('✅ Commands deployed to guild!');
    } else {
      // Global (takes up to 1 hour)
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log('✅ Commands deployed globally!');
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
})();