import { AttachmentBuilder } from 'discord.js';
import { createRequire } from 'module';
import config from '../config/config.js';

const require = createRequire(import.meta.url);

// Canvas is optional - only required if captcha is enabled
let Canvas = null;
let canvasAvailable = false;

try {
  Canvas = require('canvas');
  canvasAvailable = true;
  console.log('✅ [Captcha] Canvas loaded successfully');
} catch (error) {
  console.warn('[Captcha] Canvas not installed - Captcha system disabled');
  console.warn('[Captcha] Install canvas with: npm install canvas');
  console.warn('[Captcha] Note: Canvas requires build tools on Windows');
}

class CaptchaSystem {
  constructor() {
    this.pendingVerifications = new Map();
    this.verifiedUsers = new Set();
    this.enabled = canvasAvailable;
  }

  isAvailable() {
    return this.enabled;
  }

  generateCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  generateImage(code) {
    if (!canvasAvailable || !Canvas) {
      throw new Error('Canvas not available');
    }

    const canvas = Canvas.createCanvas(300, 100);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#2c2f33';
    ctx.fillRect(0, 0, 300, 100);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 300, Math.random() * 100);
      ctx.lineTo(Math.random() * 300, Math.random() * 100);
      ctx.stroke();
    }

    // Draw code
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < code.length; i++) {
      const x = 50 + i * 40;
      const y = 50 + (Math.random() - 0.5) * 20;
      const rotation = (Math.random() - 0.5) * 0.4;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 70%)`;
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    return canvas.toBuffer();
  }

  async sendCaptcha(member) {
    if (!this.isAvailable()) {
      console.warn('[Captcha] Canvas not available, skipping captcha for', member.user.tag);
      return;
    }

    try {
      const code = this.generateCode(config.captcha.length);
      const image = this.generateImage(code);
      const attachment = new AttachmentBuilder(image, { name: 'captcha.png' });

      this.pendingVerifications.set(member.id, {
        code,
        attempts: 0,
        timestamp: Date.now()
      });

      // Envoyer le captcha en DM
      await member.send({
        content: `🔒 **Vérification requise pour ${member.guild.name}**\n\nRésolvez ce captcha en envoyant le code visible sur l'image.\nVous avez ${config.captcha.maxAttempts} tentatives et ${Math.floor(config.captcha.timeout / 60000)} minutes.`,
        files: [attachment]
      });

      console.log(`[Captcha] Sent to ${member.user.tag}`);

      // Kick après timeout
      setTimeout(() => {
        if (this.pendingVerifications.has(member.id)) {
          member.kick('Captcha non résolu dans le temps imparti').catch(() => {});
          this.pendingVerifications.delete(member.id);
          console.log(`[Captcha] Kicked ${member.user.tag} (timeout)`);
        }
      }, config.captcha.timeout);
    } catch (error) {
      console.error('[Captcha] Error sending:', error);
    }
  }

  verifyAnswer(userId, answer) {
    const verification = this.pendingVerifications.get(userId);
    if (!verification) {
      return { success: false, reason: 'NO_PENDING_VERIFICATION' };
    }

    verification.attempts++;

    if (answer.toUpperCase() === verification.code) {
      this.pendingVerifications.delete(userId);
      this.verifiedUsers.add(userId);
      return { success: true };
    }

    if (verification.attempts >= config.captcha.maxAttempts) {
      this.pendingVerifications.delete(userId);
      return { success: false, reason: 'MAX_ATTEMPTS', shouldKick: true };
    }

    return { 
      success: false, 
      reason: 'WRONG_CODE',
      attemptsLeft: config.captcha.maxAttempts - verification.attempts
    };
  }

  isVerified(userId) {
    return this.verifiedUsers.has(userId);
  }

  bypass(userId) {
    this.verifiedUsers.add(userId);
    this.pendingVerifications.delete(userId);
  }
}

export default new CaptchaSystem();
