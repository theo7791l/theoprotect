import antiRaid from '../systems/antiRaid.js';
import captcha from '../systems/captcha.js';
import config from '../config/config.js';
import { EmbedBuilder } from 'discord.js';

export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // Anti-raid check
    if (config.antiRaid.enabled) {
      const result = await antiRaid.analyzeMemberJoin(member);
      
      if (result.isSuspicious && result.action.type !== 'NONE' && result.action.type !== 'MONITOR') {
        const response = await antiRaid.executeAction(member, result.action);
        console.log(`[AntiRaid] ${member.user.tag} - ${result.action.type} - Score: ${result.riskScore}`);
        
        // Send alert to log channel
        const logChannel = member.guild.channels.cache.find(c => c.name === 'theoprotect-logs');
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🚨 Membre suspect détecté')
            .addFields(
              { name: 'Utilisateur', value: `${member.user.tag} (${member.id})`, inline: true },
              { name: 'Score de risque', value: `${result.riskScore}/15`, inline: true },
              { name: 'Action', value: result.action.type, inline: true },
              { name: 'Facteurs de risque', value: result.riskFactors.map(f => `• ${f.details}`).join('\n') || 'Aucun' }
            )
            .setTimestamp();
          
          logChannel.send({ embeds: [embed] }).catch(() => {});
        }
        return;
      }
    }

    // Captcha verification
    if (config.captcha.enabled) {
      const verificationChannel = member.guild.channels.cache.find(c => c.name === 'vérification');
      if (!verificationChannel) return;

      const { attachment } = await captcha.startVerification(member);
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('🔒 Vérification requise')
        .setDescription(`Bienvenue ${member} !\n\nPour accéder au serveur, résolvez le captcha ci-dessous.\n⏱️ Vous avez **${config.captcha.timeout / 60000} minutes** et **${config.captcha.maxAttempts} essais**.`)
        .setImage('attachment://captcha.png')
        .setFooter({ text: 'Tapez le code dans ce salon' })
        .setTimestamp();

      verificationChannel.send({ 
        content: `${member}`,
        embeds: [embed], 
        files: [attachment] 
      }).catch(console.error);

      // Add unverified role
      const unverifiedRole = member.guild.roles.cache.find(r => r.name === 'Non vérifié');
      if (unverifiedRole) {
        member.roles.add(unverifiedRole).catch(() => {});
      }
    }
  }
};