import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  init() {
    const dbPath = process.env.DATABASE_PATH || './data/theoprotect.db';
    const dbDir = dirname(dbPath);

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
      console.log(`Created data directory: ${dbDir}`);
    }

    this.db = new Database(dbPath);
    console.log(`Database initialized: ${dbPath}`);

    this.createTables();
  }

  createTables() {
    // Guild settings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        antispam_enabled INTEGER DEFAULT 1,
        antispam_level TEXT DEFAULT 'medium',
        antiraid_enabled INTEGER DEFAULT 1,
        antiraid_mode TEXT DEFAULT 'detection',
        captcha_enabled INTEGER DEFAULT 0,
        captcha_channel TEXT,
        log_channel TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // User warnings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        user_id TEXT,
        moderator_id TEXT,
        reason TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // User reputation
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reputation (
        guild_id TEXT,
        user_id TEXT,
        score INTEGER DEFAULT 100,
        last_increment INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);

    // Action logs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        type TEXT,
        data TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Backups
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT,
        backup_data TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  getGuildSettings(guildId) {
    let settings = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    
    if (!settings) {
      this.db.prepare(`
        INSERT INTO guild_settings (guild_id) VALUES (?)
      `).run(guildId);
      settings = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    }
    
    return settings;
  }

  updateGuildSettings(guildId, updates) {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    
    this.db.prepare(`
      UPDATE guild_settings SET ${setClause} WHERE guild_id = ?
    `).run(...values, guildId);
  }

  addWarning(guildId, userId, moderatorId, reason) {
    this.db.prepare(`
      INSERT INTO warnings (guild_id, user_id, moderator_id, reason)
      VALUES (?, ?, ?, ?)
    `).run(guildId, userId, moderatorId, reason);
  }

  getWarnings(guildId, userId) {
    return this.db.prepare(`
      SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?
      ORDER BY timestamp DESC
    `).all(guildId, userId);
  }

  clearWarnings(guildId, userId) {
    this.db.prepare(`
      DELETE FROM warnings WHERE guild_id = ? AND user_id = ?
    `).run(guildId, userId);
  }

  getReputation(guildId, userId) {
    let rep = this.db.prepare(`
      SELECT * FROM reputation WHERE guild_id = ? AND user_id = ?
    `).get(guildId, userId);
    
    if (!rep) {
      this.db.prepare(`
        INSERT INTO reputation (guild_id, user_id, score) VALUES (?, ?, 100)
      `).run(guildId, userId);
      rep = { guild_id: guildId, user_id: userId, score: 100, last_increment: 0 };
    }
    
    return rep;
  }

  updateReputation(guildId, userId, change) {
    const current = this.getReputation(guildId, userId);
    const newScore = Math.max(0, Math.min(200, current.score + change));
    
    this.db.prepare(`
      UPDATE reputation SET score = ? WHERE guild_id = ? AND user_id = ?
    `).run(newScore, guildId, userId);
  }

  getLastReputationIncrement(guildId, userId) {
    const rep = this.getReputation(guildId, userId);
    return rep.last_increment;
  }

  setLastReputationIncrement(guildId, userId, timestamp) {
    this.db.prepare(`
      UPDATE reputation SET last_increment = ? WHERE guild_id = ? AND user_id = ?
    `).run(timestamp, guildId, userId);
  }

  logAction(guildId, data) {
    this.db.prepare(`
      INSERT INTO action_logs (guild_id, type, data)
      VALUES (?, ?, ?)
    `).run(guildId, data.type, JSON.stringify(data));
  }

  getActionLogs(guildId, limit = 100) {
    return this.db.prepare(`
      SELECT * FROM action_logs WHERE guild_id = ?
      ORDER BY timestamp DESC LIMIT ?
    `).all(guildId, limit);
  }

  createBackup(guildId, backupData) {
    this.db.prepare(`
      INSERT INTO backups (guild_id, backup_data)
      VALUES (?, ?)
    `).run(guildId, JSON.stringify(backupData));
    
    return this.db.prepare('SELECT last_insert_rowid()').get()['last_insert_rowid()'];
  }

  getBackup(backupId) {
    return this.db.prepare(`
      SELECT * FROM backups WHERE id = ?
    `).get(backupId);
  }

  getBackups(guildId) {
    return this.db.prepare(`
      SELECT id, guild_id, timestamp FROM backups WHERE guild_id = ?
      ORDER BY timestamp DESC
    `).all(guildId);
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('Database closed');
    }
  }
}

export default new DatabaseManager();