import antiRaid from '../systems/antiRaid.js';
import captcha from '../systems/captcha.js';
import config from '../config/config.js';
import db from '../database/database.js';
import { EmbedBuilder } from 'discord.js';

export default {
  name: 'guildMemberAdd',
  async execute(member, client) {
    // Get guild settings
    const settings = db.getGuildSettings(member.guild.id);

    // Anti-raid check
    if (settings.antiraid_enabled) {
      const result = await antiRaid.analyzeMemberJoin(member);
      
      if (result.isSuspicious && result.action.type !== 'NONE' && result.action.type !== 'MONITOR') {
        const response = await antiRaid.executeAction(member, result.action);
        console.log(`[AntiRaid] ${member.user.tag} - ${result.action.type} - Score: ${result.riskScore}`);
        
        // Log to database
        db.logAction(
          member.guild.id,
          member.id,
          client.user.id,
          result.action.type,
          result.action.reason,
          null,
          JSON.stringify(result.riskFactors)
        );

        // Send alert to log channel
        if (settings.log_channel) {
          const logChannel = member.guild.channels.cache.get(settings.log_channel);
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
        }
        return;
      }
    }

    // Captcha verification (only if canvas is available)
    if (settings.captcha_enabled && captcha.isAvailable()) {
      try {
        const verificationChannel = settings.captcha_channel 
          ? member.guild.channels.cache.get(settings.captcha_channel)
          : member.guild.channels.cache.find(c => c.name === 'vérification');

        if (!verificationChannel) {
          console.warn(`[Captcha] No verification channel found for guild ${member.guild.id}`);
          return;
        }

        const { attachment } = await captcha.startVerification(member);
        
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🔒 Vérification requise')
          .setDescription(`Bienvenue ${member} !\n\nPour accéder au serveur, résolvez le captcha ci-dessous.\n⏱️ Vous avez **${config.captcha.timeout / 60000} minutes** et **${config.captcha.maxAttempts} essais**.`)
          .setImage('attachment://captcha.png')
          .setFooter({ text: 'Tapez le code dans ce salon' })
          .setTimestamp();

        await verificationChannel.send({ 
          content: `${member}`,
          embeds: [embed], 
          files: [attachment] 
        });

        // Add unverified role
        const unverifiedRole = settings.quarantine_role
          ? member.guild.roles.cache.get(settings.quarantine_role)
          : member.guild.roles.cache.find(r => r.name === 'Non vérifié');

        if (unverifiedRole) {
          await member.roles.add(unverifiedRole).catch(() => {});
        }
      } catch (error) {
        console.error('[Captcha] Error starting verification:', error.message);
      }
    } else if (settings.captcha_enabled && !captcha.isAvailable()) {
      console.warn('[Captcha] Captcha enabled but Canvas not available - skipping');
    }
  }
};