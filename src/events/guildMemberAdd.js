import autoAntiRaid from '../systems/autoAntiRaid.js';
import captcha from '../systems/captcha.js';
import db from '../database/database.js';

export default {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const settings = db.getGuildSettings(member.guild.id);
      
      // Auto Anti-Raid check
      await autoAntiRaid.checkMember(member);
      
      // Captcha check (si activé et disponible)
      if (settings.captcha_enabled && captcha.isAvailable()) {
        await captcha.sendCaptcha(member).catch(error => {
          console.error('[Captcha] Error sending captcha:', error);
        });
      }
      
      console.log(`[Member Join] ${member.user.tag} joined ${member.guild.name}`);
    } catch (error) {
      console.error('[guildMemberAdd] Error:', error);
    }
  }
};