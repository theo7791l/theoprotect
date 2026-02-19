import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  init(path = './data/theoprotect.db') {
    try {
      // Resolve absolute path
      const dbPath = resolve(path);
      const dir = dirname(dbPath);

      // Create data directory if not exists
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`✅ Created data directory: ${dir}`);
      }

      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      console.log(`✅ Database initialized: ${dbPath}`);
      
      this.createTables();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  createTables() {
    try {
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
    } catch (error) {
      console.error('❌ Failed to create database tables:', error);
      throw error;
    }
  }

  // Guild settings
  getGuildSettings(guildId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?');
      return stmt.get(guildId) || this.createDefaultSettings(guildId);
    } catch (error) {
      console.error('[DB] Error getting guild settings:', error);
      return this.createDefaultSettings(guildId);
    }
  }

  createDefaultSettings(guildId) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO guild_settings (guild_id) VALUES (?)
        ON CONFLICT(guild_id) DO NOTHING
      `);
      stmt.run(guildId);
      return this.getGuildSettings(guildId);
    } catch (error) {
      console.error('[DB] Error creating default settings:', error);
      return {
        guild_id: guildId,
        antispam_enabled: 1,
        antispam_level: 'medium',
        antiraid_enabled: 1,
        antiraid_mode: 'protection',
        captcha_enabled: 0
      };
    }
  }

  updateGuildSettings(guildId, settings) {
    try {
      const keys = Object.keys(settings);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = keys.map(key => settings[key]);
      
      const stmt = this.db.prepare(`
        UPDATE guild_settings SET ${setClause} WHERE guild_id = ?
      `);
      stmt.run(...values, guildId);
    } catch (error) {
      console.error('[DB] Error updating guild settings:', error);
    }
  }

  // Reputation system
  getReputation(userId, guildId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM member_reputation WHERE user_id = ? AND guild_id = ?');
      return stmt.get(userId, guildId);
    } catch (error) {
      console.error('[DB] Error getting reputation:', error);
      return null;
    }
  }

  updateReputation(userId, guildId, changes) {
    try {
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
    } catch (error) {
      console.error('[DB] Error updating reputation:', error);
    }
  }

  // Warnings
  addWarning(guildId, userId, moderatorId, reason) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO warnings (guild_id, user_id, moderator_id, reason)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(guildId, userId, moderatorId, reason);
      this.updateReputation(userId, guildId, { warnings: 1, score: -10 });
    } catch (error) {
      console.error('[DB] Error adding warning:', error);
    }
  }

  getWarnings(userId, guildId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY timestamp DESC');
      return stmt.all(userId, guildId);
    } catch (error) {
      console.error('[DB] Error getting warnings:', error);
      return [];
    }
  }

  clearWarnings(userId, guildId) {
    try {
      const stmt = this.db.prepare('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?');
      stmt.run(userId, guildId);
    } catch (error) {
      console.error('[DB] Error clearing warnings:', error);
    }
  }

  // Moderation logs
  logAction(guildId, userId, moderatorId, actionType, reason, duration = null, evidence = null) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO moderation_logs (guild_id, user_id, moderator_id, action_type, reason, duration, evidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(guildId, userId, moderatorId, actionType, reason, duration, evidence);
    } catch (error) {
      console.error('[DB] Error logging action:', error);
    }
  }

  getModLogs(guildId, limit = 50) {
    try {
      const stmt = this.db.prepare('SELECT * FROM moderation_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?');
      return stmt.all(guildId, limit);
    } catch (error) {
      console.error('[DB] Error getting mod logs:', error);
      return [];
    }
  }

  // Raid history
  startRaid(guildId) {
    try {
      const stmt = this.db.prepare('INSERT INTO raid_history (guild_id, start_time) VALUES (?, ?)');
      const result = stmt.run(guildId, Date.now());
      return result.lastInsertRowid;
    } catch (error) {
      console.error('[DB] Error starting raid:', error);
      return null;
    }
  }

  endRaid(raidId, stats) {
    try {
      const stmt = this.db.prepare(`
        UPDATE raid_history 
        SET end_time = ?, members_joined = ?, members_banned = ?, members_kicked = ?, severity = ?
        WHERE id = ?
      `);
      stmt.run(Date.now(), stats.joined, stats.banned, stats.kicked, stats.severity, raidId);
    } catch (error) {
      console.error('[DB] Error ending raid:', error);
    }
  }

  // Backups
  saveBackup(guildId, backupData) {
    try {
      const stmt = this.db.prepare('INSERT INTO backups (guild_id, backup_data) VALUES (?, ?)');
      const result = stmt.run(guildId, JSON.stringify(backupData));
      return result.lastInsertRowid;
    } catch (error) {
      console.error('[DB] Error saving backup:', error);
      return null;
    }
  }

  getBackup(backupId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM backups WHERE id = ?');
      const backup = stmt.get(backupId);
      if (backup) {
        backup.backup_data = JSON.parse(backup.backup_data);
      }
      return backup;
    } catch (error) {
      console.error('[DB] Error getting backup:', error);
      return null;
    }
  }

  getLatestBackup(guildId) {
    try {
      const stmt = this.db.prepare('SELECT * FROM backups WHERE guild_id = ? ORDER BY created_at DESC LIMIT 1');
      const backup = stmt.get(guildId);
      if (backup) {
        backup.backup_data = JSON.parse(backup.backup_data);
      }
      return backup;
    } catch (error) {
      console.error('[DB] Error getting latest backup:', error);
      return null;
    }
  }

  close() {
    if (this.db) {
      try {
        this.db.close();
        console.log('✅ Database connection closed');
      } catch (error) {
        console.error('❌ Error closing database:', error);
      }
    }
  }
}

export default new DatabaseManager();