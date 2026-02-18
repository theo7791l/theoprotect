import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à avertir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison de l\'avertissement')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const reason = interaction.options.getString('raison');

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Vous ne pouvez pas vous avertir vous-même.', ephemeral: true });
    }

    if (target.bot) {
      return interaction.reply({ content: '❌ Vous ne pouvez pas avertir un bot.', ephemeral: true });
    }

    // Add warning to database
    db.addWarning(interaction.guild.id, target.id, interaction.user.id, reason);
    db.logAction(interaction.guild.id, target.id, interaction.user.id, 'WARN', reason);

    const warnings = db.getWarnings(target.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('⚠️ Avertissement')
      .setDescription(`${target} a reçu un avertissement.`)
      .addFields(
        { name: 'Modérateur', value: interaction.user.toString(), inline: true },
        { name: 'Raison', value: reason, inline: true },
        { name: 'Total d\'avertissements', value: warnings.length.toString(), inline: true }
      )
      .setTimestamp();

    // Try to DM the user
    try {
      await target.send({
        embeds: [embed.setDescription(`Vous avez reçu un avertissement sur **${interaction.guild.name}**.`)]
      });
    } catch (error) {
      // User has DMs disabled
    }

    await interaction.reply({ embeds: [embed] });

    // Auto-action based on warning count
    if (warnings.length >= 5) {
      const member = interaction.guild.members.cache.get(target.id);
      await member?.ban({ reason: '5 avertissements atteints' });
      await interaction.followUp({ content: `🔨 ${target} a été banni automatiquement (5 warns).` });
    } else if (warnings.length >= 3) {
      const member = interaction.guild.members.cache.get(target.id);
      await member?.timeout(3600000, '3 avertissements atteints');
      await interaction.followUp({ content: `🔇 ${target} a été timeout 1h (3 warns).` });
    }
  }
};