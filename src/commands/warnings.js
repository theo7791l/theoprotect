import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Voir les avertissements d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à vérifier')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membre');
    const warnings = db.getWarnings(target.id, interaction.guild.id);

    if (warnings.length === 0) {
      return interaction.reply({
        content: `✅ ${target} n'a aucun avertissement.`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle(`⚠️ Avertissements de ${target.tag}`)
      .setDescription(
        warnings.map((w, i) => 
          `**${i + 1}.** <t:${w.timestamp}:R>\n➡️ Modérateur: <@${w.moderator_id}>\n➡️ Raison: ${w.reason}`
        ).join('\n\n')
      )
      .setFooter({ text: `Total: ${warnings.length} avertissement(s)` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};