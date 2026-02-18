import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reputation')
    .setDescription('Voir la réputation d\'un membre')
    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre à vérifier (par défaut: vous)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    const rep = db.getReputation(target.id, interaction.guild.id);

    if (!rep) {
      return interaction.reply({
        content: `${target} n'a pas encore de réputation sur ce serveur.`,
        ephemeral: true
      });
    }

    // Calculate trust level
    let trustLevel = '🔴 Très faible';
    let color = 0xff0000;
    
    if (rep.score >= 150) {
      trustLevel = '🟢 Excellent';
      color = 0x00ff00;
    } else if (rep.score >= 100) {
      trustLevel = '🟡 Bon';
      color = 0x90ee90;
    } else if (rep.score >= 75) {
      trustLevel = '🟠 Moyen';
      color = 0xffa500;
    } else if (rep.score >= 50) {
      trustLevel = '🔴 Faible';
      color = 0xff6347;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🏆 Réputation de ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Score', value: `**${rep.score}**/200`, inline: true },
        { name: 'Niveau de confiance', value: trustLevel, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '⚠️ Avertissements', value: rep.warnings.toString(), inline: true },
        { name: '🔇 Timeouts', value: rep.timeouts.toString(), inline: true },
        { name: '👢 Expulsions', value: rep.kicks.toString(), inline: true },
        { name: '💬 Messages', value: rep.messages_sent.toString(), inline: true },
        { name: '✅ Actions utiles', value: rep.helpful_actions.toString(), inline: true }
      )
      .setFooter({ text: 'Score calculé depuis la création du compte' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};