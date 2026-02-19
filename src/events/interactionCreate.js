export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`[Command Error] ${interaction.commandName}:`, error);
        
        const errorMessage = { 
          content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', 
          ephemeral: true 
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
      return;
    }

    // Handle button interactions
    if (interaction.isButton()) {
      try {
        const handlers = client.buttonHandlers;
        if (handlers && handlers.has(interaction.customId)) {
          await handlers.get(interaction.customId)(interaction);
        } else {
          // Fallback for inline handlers
          await handleButtonInteraction(interaction, client);
        }
      } catch (error) {
        console.error(`[Button Error] ${interaction.customId}:`, error);
        const errorMessage = { 
          content: '❌ Erreur lors du traitement du bouton.', 
          ephemeral: true 
        };
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(errorMessage);
        }
      }
      return;
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
      try {
        const handlers = client.selectHandlers;
        if (handlers && handlers.has(interaction.customId)) {
          await handlers.get(interaction.customId)(interaction);
        } else {
          // Fallback for inline handlers
          await handleSelectMenuInteraction(interaction, client);
        }
      } catch (error) {
        console.error(`[Select Error] ${interaction.customId}:`, error);
        const errorMessage = { 
          content: '❌ Erreur lors du traitement du menu.', 
          ephemeral: true 
        };
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(errorMessage);
        }
      }
      return;
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      try {
        await handleModalSubmit(interaction, client);
      } catch (error) {
        console.error(`[Modal Error] ${interaction.customId}:`, error);
        const errorMessage = { 
          content: '❌ Erreur lors du traitement du formulaire.', 
          ephemeral: true 
        };
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(errorMessage);
        }
      }
    }
  }
};

// Button interaction handlers
async function handleButtonInteraction(interaction, client) {
  const customId = interaction.customId;

  // Config module buttons
  if (customId === 'config_stats') {
    const statsCommand = client.commands.get('stats');
    if (statsCommand) {
      await statsCommand.execute(interaction);
    }
  } 
  else if (customId === 'config_backup') {
    await interaction.reply({ content: '💡 Utilisez `/backup create` pour créer une sauvegarde.', ephemeral: true });
  } 
  else if (customId === 'config_lockdown') {
    await interaction.reply({ content: '💡 Utilisez `/lockdown activate [niveau]` pour activer le mode lockdown.', ephemeral: true });
  }
  else {
    await interaction.reply({ content: '❌ Action non reconnue.', ephemeral: true });
  }
}

// Select menu interaction handlers
async function handleSelectMenuInteraction(interaction, client) {
  const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
  const db = (await import('../database/database.js')).default;
  
  const customId = interaction.customId;
  const selectedValue = interaction.values[0];

  // Config module select menu
  if (customId === 'config_module') {
    await interaction.deferUpdate();

    const settings = db.getGuildSettings(interaction.guild.id);

    if (selectedValue === 'antispam') {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🛡️ Configuration Anti-Spam')
        .setDescription(
          `**État actuel:** ${settings.antispam_enabled ? '✅ Actif' : '❌ Inactif'}\n` +
          `**Niveau:** ${settings.antispam_level}\n\n` +
          `**Niveaux disponibles:**\n` +
          `• **low** - Tolérant (seulement spam extrême)\n` +
          `• **medium** - Équilibré (recommandé)\n` +
          `• **high** - Strict (peu de tolérance)\n` +
          `• **extreme** - Très strict (maximum sécurité)\n\n` +
          `💡 Utilisez \`/antispam [niveau] [actif]\` pour configurer`
        )
        .setFooter({ text: 'Exemple: /antispam high true' });

      await interaction.editReply({ embeds: [embed], components: [] });
    }
    else if (selectedValue === 'antiraid') {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🚨 Configuration Anti-Raid')
        .setDescription(
          `**État actuel:** ${settings.antiraid_enabled ? '✅ Actif' : '❌ Inactif'}\n` +
          `**Mode:** ${settings.antiraid_mode}\n\n` +
          `**Modes disponibles:**\n` +
          `• **off** - Désactivé\n` +
          `• **detection** - Détection seule (logs uniquement)\n` +
          `• **protection** - Protection active (quarantaine)\n` +
          `• **lockdown** - Verrouillage (kick auto)\n\n` +
          `💡 Utilisez \`/antiraid [mode]\` pour configurer`
        )
        .setFooter({ text: 'Exemple: /antiraid protection' });

      await interaction.editReply({ embeds: [embed], components: [] });
    }
    else if (selectedValue === 'captcha') {
      const captcha = (await import('../systems/captcha.js')).default;
      const isAvailable = captcha.isAvailable();

      const embed = new EmbedBuilder()
        .setColor(isAvailable ? 0x5865f2 : 0xffa500)
        .setTitle('🔐 Configuration Captcha')
        .setDescription(
          `**État actuel:** ${settings.captcha_enabled ? '✅ Actif' : '❌ Inactif'}\n` +
          `**Disponibilité:** ${isAvailable ? '✅ Canvas installé' : '❌ Canvas non installé'}\n\n` +
          (isAvailable 
            ? `Le captcha visuel est fonctionnel.\n\n💡 Pour activer: créez un salon **#vérification**` 
            : `⚠️ **Canvas n'est pas installé**\n\nInstallez-le avec:\n\`\`\`\nnpm install canvas\n\`\`\`\n\nSur Windows, des outils de compilation sont requis.`
          )
        )
        .setFooter({ text: settings.captcha_channel ? `Salon actuel: ${settings.captcha_channel}` : 'Pas de salon configuré' });

      await interaction.editReply({ embeds: [embed], components: [] });
    }
    else if (selectedValue === 'logs') {
      const channels = interaction.guild.channels.cache
        .filter(c => c.isTextBased() && !c.isThread())
        .map(c => `<#${c.id}>`)
        .slice(0, 10)
        .join(', ');

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📝 Configuration des Logs')
        .setDescription(
          `**Salon actuel:** ${settings.log_channel ? `<#${settings.log_channel}>` : '❌ Non configuré'}\n\n` +
          `**Salons disponibles:**\n${channels || 'Aucun salon trouvé'}\n\n` +
          `💡 Pour configurer, créez un salon **#theoprotect-logs**\n` +
          `Le bot le détectera automatiquement.`
        );

      await interaction.editReply({ embeds: [embed], components: [] });
    }
  }
}

// Modal submit handlers
async function handleModalSubmit(interaction, client) {
  await interaction.reply({ 
    content: '✅ Formulaire reçu !', 
    ephemeral: true 
  });
}