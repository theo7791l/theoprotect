import { AttachmentBuilder } from 'discord.js';
import { createCanvas } from 'canvas';
import config from '../config/config.js';

class CaptchaSystem {
  constructor() {
    this.pendingVerifications = new Map(); // userId -> { code, attempts, timeout }
    this.verifiedUsers = new Set();
  }

  /**
   * Generate random captcha code
   */
  generateCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate captcha image
   */
  generateImage(code) {
    const canvas = createCanvas(300, 100);
    const ctx = canvas.getContext('2d');

    // Background with noise
    ctx.fillStyle = '#2c2f33';
    ctx.fillRect(0, 0, 300, 100);

    // Add random lines (noise)
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 300, Math.random() * 100);
      ctx.lineTo(Math.random() * 300, Math.random() * 100);
      ctx.stroke();
    }

    // Draw code with distortion
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

  /**
   * Start verification for a member
   */
  async startVerification(member) {
    const code = this.generateCode(config.captcha.length);
    const image = this.generateImage(code);
    const attachment = new AttachmentBuilder(image, { name: 'captcha.png' });

    this.pendingVerifications.set(member.id, {
      code,
      attempts: 0,
      timestamp: Date.now()
    });

    // Auto-kick after timeout
    setTimeout(() => {
      if (this.pendingVerifications.has(member.id)) {
        member.kick('Captcha non résolu dans le temps imparti').catch(() => {});
        this.pendingVerifications.delete(member.id);
      }
    }, config.captcha.timeout);

    return { attachment, code };
  }

  /**
   * Verify user's answer
   */
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

  /**
   * Check if user is verified
   */
  isVerified(userId) {
    return this.verifiedUsers.has(userId);
  }

  /**
   * Remove verification requirement (bypass)
   */
  bypass(userId) {
    this.verifiedUsers.add(userId);
    this.pendingVerifications.delete(userId);
  }
}

export default new CaptchaSystem();