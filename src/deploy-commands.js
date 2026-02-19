import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import config from './config/config.js';
import { getCommandsPath } from './utils/paths.js';

const commands = [];
const commandsPath = getCommandsPath();

try {
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const filePath = `${commandsPath}/${file}`.replace(/\\/g, '/');
      const command = await import(`file:///${filePath}`);
      if (command.default?.data) {
        commands.push(command.default.data.toJSON());
        console.log(`✅ Loaded: ${command.default.data.name}`);
      } else {
        console.log(`⚠️  Skipped ${file}: No data export`);
      }
    } catch (err) {
      console.error(`❌ Failed to load ${file}:`, err.message);
    }
  }
} catch (error) {
  console.error('❌ Error reading commands directory:', error.message);
  process.exit(1);
}

if (commands.length === 0) {
  console.error('❌ No commands found to deploy!');
  process.exit(1);
}

if (!config.token) {
  console.error('❌ DISCORD_TOKEN is not set in .env file!');
  process.exit(1);
}

if (!config.clientId) {
  console.error('❌ CLIENT_ID is not set in .env file!');
  process.exit(1);
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`\n🚀 Deploying ${commands.length} application commands...`);

    // Deploy globally or to a specific guild
    if (config.guildId) {
      // Guild-specific (instant update)
      console.log(`🎯 Deploying to guild: ${config.guildId}`);
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} commands to guild!`);
      console.log('\n💡 Commands are now available instantly in your server.');
    } else {
      // Global (takes up to 1 hour)
      console.log('🌍 Deploying globally...');
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} commands globally!`);
      console.log('\n⏱️  Note: Global commands can take up to 1 hour to appear.');
      console.log('💡 For instant testing, set GUILD_ID in .env to deploy to a specific server.');
    }

    console.log('\n✅ Deployment complete! You can now start the bot with: npm start');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    
    if (error.code === 50001) {
      console.error('\n🚫 Missing Access - Check that:');
      console.error('1. CLIENT_ID matches your bot application ID');
      console.error('2. Bot is in the server (if using GUILD_ID)');
      console.error('3. Bot has applications.commands scope');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n🌐 Network error - Check your internet connection');
    } else if (error.rawError?.message?.includes('token')) {
      console.error('\n🔑 Invalid token - Check DISCORD_TOKEN in .env');
    }
    
    process.exit(1);
  }
})();