import { AttachmentBuilder } from 'discord.js';
import { createRequire } from 'module';
import config from '../config/config.js';

const require = createRequire(import.meta.url);

// Canvas is optional - only required if captcha is enabled
// Try @napi-rs/canvas first (prebuilt binaries), then fallback to canvas
let Canvas = null;
let canvasAvailable = false;

try {
  // Try @napi-rs/canvas (recommended - prebuilt binaries)
  Canvas = require('@napi-rs/canvas');
  canvasAvailable = true;
  console.log('✅ [Captcha] @napi-rs/canvas loaded successfully');
} catch (error1) {
  try {
    // Fallback to regular canvas
    Canvas = require('canvas');
    canvasAvailable = true;
    console.log('✅ [Captcha] canvas loaded successfully');
  } catch (error2) {
    console.warn('[Captcha] Canvas not installed - Captcha system disabled');
    console.warn('[Captcha] Install with: npm install @napi-rs/canvas');
    console.warn('[Captcha] Or: npm install canvas (requires Visual Studio Build Tools)');
  }
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

    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 300, 100);
    gradient.addColorStop(0, '#2c2f33');
    gradient.addColorStop(1, '#23272a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 100);

    // Noise lines for security
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
      ctx.lineWidth = Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 300, Math.random() * 100);
      ctx.lineTo(Math.random() * 300, Math.random() * 100);
      ctx.stroke();
    }

    // Draw code with random colors and positions
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
      
      // Random color for each character
      const hue = Math.random() * 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
      ctx.fillText(code[i], 0, 0);
      
      ctx.restore();
    }

    // Add more noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * 300, Math.random() * 100, 2, 2);
    }

    return canvas.toBuffer('image/png');
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
        timestamp: Date.now(),
        guildId: member.guild.id
      });

      // Envoyer le captcha en DM
      const dmMessage = await member.send({
        embeds: [{
          color: 0x5865f2,
          title: '🔒 Vérification de sécurité',
          description: 
            `Bienvenue sur **${member.guild.name}** !\n\n` +
            `Pour accéder au serveur, résolvez ce captcha en envoyant le code visible sur l'image.\n\n` +
            `⏱️ **Temps limite:** ${Math.floor(config.captcha.timeout / 60000)} minutes\n` +
            `🎯 **Tentatives:** ${config.captcha.maxAttempts}\n\n` +
            `Répondez simplement avec le code dans ce salon.`,
          image: {
            url: 'attachment://captcha.png'
          },
          footer: {
            text: 'TheoProtect Security System'
          },
          timestamp: new Date().toISOString()
        }],
        files: [attachment]
      }).catch(async (error) => {
        console.error(`[Captcha] Cannot DM ${member.user.tag}, trying channel...`);
        
        // Si DM échoue, essayer dans un salon
        const verificationChannel = member.guild.channels.cache.find(c => 
          c.name.includes('verif') || c.name.includes('captcha') || c.name.includes('welcome')
        );
        
        if (verificationChannel && verificationChannel.isTextBased()) {
          return await verificationChannel.send({
            content: `${member}, vérification requise !`,
            embeds: [{
              color: 0x5865f2,
              title: '🔒 Vérification de sécurité',
              description: 
                `Résolvez ce captcha en envoyant le code visible sur l'image.\n\n` +
                `⏱️ **Temps limite:** ${Math.floor(config.captcha.timeout / 60000)} minutes`,
              image: { url: 'attachment://captcha.png' }
            }],
            files: [attachment]
          });
        }
        
        throw error;
      });

      console.log(`[Captcha] ✅ Sent to ${member.user.tag} (Code: ${code})`);

      // Timeout: Kick si pas résolu
      setTimeout(async () => {
        if (this.pendingVerifications.has(member.id)) {
          try {
            await member.kick('Captcha non résolu dans le temps imparti');
            this.pendingVerifications.delete(member.id);
            console.log(`[Captcha] ⏰ Kicked ${member.user.tag} (timeout)`);
          } catch (error) {
            console.error(`[Captcha] Cannot kick ${member.user.tag}:`, error.message);
          }
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
      console.log(`[Captcha] ✅ ${userId} verified successfully`);
      return { success: true };
    }

    if (verification.attempts >= config.captcha.maxAttempts) {
      this.pendingVerifications.delete(userId);
      console.log(`[Captcha] ❌ ${userId} failed (max attempts)`);
      return { success: false, reason: 'MAX_ATTEMPTS', shouldKick: true };
    }

    console.log(`[Captcha] ❌ ${userId} wrong code (${verification.attempts}/${config.captcha.maxAttempts})`);
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
    console.log(`[Captcha] 🔓 ${userId} bypassed`);
  }

  clearExpired() {
    const now = Date.now();
    for (const [userId, verification] of this.pendingVerifications.entries()) {
      if (now - verification.timestamp > config.captcha.timeout) {
        this.pendingVerifications.delete(userId);
      }
    }
  }
}

export default new CaptchaSystem();
