import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('voicemod')
    .setDescription('Modération vocale avancée')
    .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('muteall')
        .setDescription('Mute tous les membres d\'un salon vocal')
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Salon vocal à mute')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('unmuteall')
        .setDescription('Unmute tous les membres d\'un salon vocal')
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Salon vocal à unmute')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disconnectall')
        .setDescription('Déconnecter tous les membres d\'un salon vocal')
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Salon vocal à vider')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('moveall')
        .setDescription('Déplacer tous les membres vers un autre salon')
        .addChannelOption(option =>
          option.setName('source')
            .setDescription('Salon source')
            .setRequired(true)
        )
        .addChannelOption(option =>
          option.setName('destination')
            .setDescription('Salon destination')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (subcommand === 'muteall') {
      const channel = interaction.options.getChannel('salon');
      
      if (!channel.isVoiceBased()) {
        return interaction.editReply('❌ Ce n\'est pas un salon vocal.');
      }

      let muted = 0;
      for (const [, member] of channel.members) {
        try {
          await member.voice.setMute(true, `Mute all par ${interaction.user.tag}`);
          muted++;
        } catch (error) {
          console.error(`Cannot mute ${member.user.tag}:`, error.message);
        }
      }

      await interaction.editReply(`🔇 **${muted}** membre(s) muté(s) dans ${channel}.`);
    }
    else if (subcommand === 'unmuteall') {
      const channel = interaction.options.getChannel('salon');
      
      if (!channel.isVoiceBased()) {
        return interaction.editReply('❌ Ce n\'est pas un salon vocal.');
      }

      let unmuted = 0;
      for (const [, member] of channel.members) {
        try {
          await member.voice.setMute(false, `Unmute all par ${interaction.user.tag}`);
          unmuted++;
        } catch (error) {
          console.error(`Cannot unmute ${member.user.tag}:`, error.message);
        }
      }

      await interaction.editReply(`🔊 **${unmuted}** membre(s) unmuté(s) dans ${channel}.`);
    }
    else if (subcommand === 'disconnectall') {
      const channel = interaction.options.getChannel('salon');
      
      if (!channel.isVoiceBased()) {
        return interaction.editReply('❌ Ce n\'est pas un salon vocal.');
      }

      let disconnected = 0;
      for (const [, member] of channel.members) {
        try {
          await member.voice.disconnect(`Disconnect all par ${interaction.user.tag}`);
          disconnected++;
        } catch (error) {
          console.error(`Cannot disconnect ${member.user.tag}:`, error.message);
        }
      }

      await interaction.editReply(`🚫 **${disconnected}** membre(s) déconnecté(s) de ${channel}.`);
    }
    else if (subcommand === 'moveall') {
      const source = interaction.options.getChannel('source');
      const destination = interaction.options.getChannel('destination');
      
      if (!source.isVoiceBased() || !destination.isVoiceBased()) {
        return interaction.editReply('❌ Les deux salons doivent être vocaux.');
      }

      let moved = 0;
      for (const [, member] of source.members) {
        try {
          await member.voice.setChannel(destination, `Move all par ${interaction.user.tag}`);
          moved++;
        } catch (error) {
          console.error(`Cannot move ${member.user.tag}:`, error.message);
        }
      }

      await interaction.editReply(`👉 **${moved}** membre(s) déplacé(s) de ${source} vers ${destination}.`);
    }
  }
};