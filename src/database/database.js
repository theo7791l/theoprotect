import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { getDatabasePath } from '../utils/paths.js';

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  init() {
    const path = getDatabasePath();
    
    // Create data directory if not exists
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`📁 Created data directory: ${dir}`);
    }

    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.createTables();
    console.log(`✅ Database initialized: ${path}`);
  }

  createTables() {
    // Guild settings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        antispam_enabled INTEGER DEFAULT 1,
        antispam_level TEXT DEFAULT 'medium',
        antiraid_enabled INTEGER DEFAULT 1,
        antiraid_mode TEXT DEFAULT 'protection',
        captcha_enabled INTEGER DEFAULT 0,
        captcha_channel TEXT,
        log_channel TEXT,
        quarantine_role TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Member reputation
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS member_reputation (
        user_id TEXT,
        guild_id TEXT,
        score INTEGER DEFAULT 100,
        warnings INTEGER DEFAULT 0,
        kicks INTEGER DEFAULT 0,
        timeouts INTEGER DEFAULT 0,
        messages_sent INTEGER DEFAULT 0,
        helpful_actions INTEGER DEFAULT 0,
        last_violation INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (user_id, guild_id)
      )
    `);

    // Moderation logs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS moderation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT,
        action_type TEXT NOT NULL,
        reason TEXT,
        duration INTEGER,
        evidence TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Warnings
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Raid history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS raid_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        members_joined INTEGER DEFAULT 0,
        members_banned INTEGER DEFAULT 0,
        members_kicked INTEGER DEFAULT 0,
        severity TEXT DEFAULT 'medium'
      )
    `);

    // Backups
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        backup_data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Whitelist/Blacklist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS access_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        list_type TEXT NOT NULL,
        reason TEXT,
        added_by TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  // Guild settings
  getGuildSettings(guildId) {
    const stmt = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
    return stmt.get(guildId) || this.createDefaultSettings(guildId);
  }

  createDefaultSettings(guildId) {
    const stmt = this.db.prepare(`
      INSERT INTO guild_settings (guild_id) VALUES (?)
      ON CONFLICT(guild_id) DO NOTHING
    `);
    stmt.run(guildId);
    return this.getGuildSettings(guildId);
  }

  updateGuildSettings(guildId, settings) {
    const keys = Object.keys(settings);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => settings[key]);
    
    const stmt = this.db.prepare(`
      UPDATE guild_settings SET ${setClause} WHERE guild_id = ?
    `);
    stmt.run(...values, guildId);
  }

  // Reputation system
  getReputation(userId, guildId) {
    const stmt = this.db.prepare('SELECT * FROM member_reputation WHERE user_id = ? AND guild_id = ?');
    return stmt.get(userId, guildId);
  }

  updateReputation(userId, guildId, changes) {
    const existing = this.getReputation(userId, guildId);
    
    if (!existing) {
      const stmt = this.db.prepare(`
        INSERT INTO member_reputation (user_id, guild_id, score, warnings, kicks, timeouts)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(userId, guildId, changes.score || 100, changes.warnings || 0, changes.kicks || 0, changes.timeouts || 0);
    } else {
      const keys = Object.keys(changes);
      const setClause = keys.map(key => `${key} = ${key} + ?`).join(', ');
      const values = keys.map(key => changes[key]);
      
      const stmt = this.db.prepare(`
        UPDATE member_reputation SET ${setClause} WHERE user_id = ? AND guild_id = ?
      `);
      stmt.run(...values, userId, guildId);
    }
  }

  // Warnings
  addWarning(guildId, userId, moderatorId, reason) {
    const stmt = this.db.prepare(`
      INSERT INTO warnings (guild_id, user_id, moderator_id, reason)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(guildId, userId, moderatorId, reason);
    this.updateReputation(userId, guildId, { warnings: 1, score: -10 });
  }

  getWarnings(userId, guildId) {
    const stmt = this.db.prepare('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY timestamp DESC');
    return stmt.all(userId, guildId);
  }

  clearWarnings(userId, guildId) {
    const stmt = this.db.prepare('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?');
    stmt.run(userId, guildId);
  }

  // Moderation logs
  logAction(guildId, userId, moderatorId, actionType, reason, duration = null, evidence = null) {
    const stmt = this.db.prepare(`
      INSERT INTO moderation_logs (guild_id, user_id, moderator_id, action_type, reason, duration, evidence)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(guildId, userId, moderatorId, actionType, reason, duration, evidence);
  }

  getModLogs(guildId, limit = 50) {
    const stmt = this.db.prepare('SELECT * FROM moderation_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(guildId, limit);
  }

  // Raid history
  startRaid(guildId) {
    const stmt = this.db.prepare('INSERT INTO raid_history (guild_id, start_time) VALUES (?, ?)');
    const result = stmt.run(guildId, Date.now());
    return result.lastInsertRowid;
  }

  endRaid(raidId, stats) {
    const stmt = this.db.prepare(`
      UPDATE raid_history 
      SET end_time = ?, members_joined = ?, members_banned = ?, members_kicked = ?, severity = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), stats.joined, stats.banned, stats.kicked, stats.severity, raidId);
  }

  // Backups
  saveBackup(guildId, backupData) {
    const stmt = this.db.prepare('INSERT INTO backups (guild_id, backup_data) VALUES (?, ?)');
    const result = stmt.run(guildId, JSON.stringify(backupData));
    return result.lastInsertRowid;
  }

  getBackup(backupId) {
    const stmt = this.db.prepare('SELECT * FROM backups WHERE id = ?');
    const backup = stmt.get(backupId);
    if (backup) {
      backup.backup_data = JSON.parse(backup.backup_data);
    }
    return backup;
  }

  getLatestBackup(guildId) {
    const stmt = this.db.prepare('SELECT * FROM backups WHERE guild_id = ? ORDER BY created_at DESC LIMIT 1');
    const backup = stmt.get(guildId);
    if (backup) {
      backup.backup_data = JSON.parse(backup.backup_data);
    }
    return backup;
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('👋 Database connection closed');
    }
  }
}

export default new DatabaseManager();