import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseManager {
  constructor() {
    this.db = new Database(join(__dirname, '../../data/theoprotect.db'));
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }

  initTables() {
    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        antispam_enabled INTEGER DEFAULT 1,
        antispam_level TEXT DEFAULT 'medium',
        antiraid_enabled INTEGER DEFAULT 1,
        captcha_enabled INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Logs table (NEW SCHEMA with user_id)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        type TEXT NOT NULL,
        user_id TEXT,
        is_bot INTEGER DEFAULT 0,
        message_length INTEGER,
        word TEXT,
        severity TEXT,
        warnings INTEGER,
        channel_id TEXT,
        messages_count INTEGER,
        bot_count INTEGER,
        human_count INTEGER,
        timestamp INTEGER NOT NULL
      )
    `);

    // Reputation table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_reputation (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reputation INTEGER DEFAULT 100,
        last_increment INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      )
    `);

    console.log('✅ Database tables initialized');
  }

  getGuildSettings(guildId) {
    let settings = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    
    if (!settings) {
      this.db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
      settings = this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    }
    
    return settings;
  }

  updateGuildSettings(guildId, settings) {
    const keys = Object.keys(settings);
    const values = Object.values(settings);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const query = `UPDATE guild_settings SET ${setClause} WHERE guild_id = ?`;
    
    this.db.prepare(query).run(...values, guildId);
  }

  logAction(guildId, data) {
    this.db.prepare(`
      INSERT INTO action_logs (
        guild_id, type, user_id, is_bot, message_length, word, severity, 
        warnings, channel_id, messages_count, bot_count, human_count, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      guildId,
      data.type,
      data.user_id || null,
      data.is_bot ? 1 : 0,
      data.message_length || null,
      data.word || null,
      data.severity || null,
      data.warnings || null,
      data.channel_id || null,
      data.messages_count || null,
      data.bot_count || null,
      data.human_count || null,
      data.timestamp
    );
  }

  getRecentLogs(limit = 50) {
    return this.db.prepare(`
      SELECT * FROM action_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit);
  }

  getGlobalStats() {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_actions,
        SUM(CASE WHEN type LIKE '%flood%' THEN 1 ELSE 0 END) as flood_detected,
        SUM(CASE WHEN type = 'bad_word_detected' THEN 1 ELSE 0 END) as bad_words_detected,
        SUM(CASE WHEN warnings >= 2 THEN 1 ELSE 0 END) as users_muted,
        0 as users_kicked,
        0 as users_banned,
        COUNT(DISTINCT guild_id) as guilds_protected
      FROM action_logs
    `).get();

    return {
      messages_moderated: stats.total_actions || 0,
      flood_detected: stats.flood_detected || 0,
      bad_words_detected: stats.bad_words_detected || 0,
      users_muted: stats.users_muted || 0,
      users_kicked: stats.users_kicked || 0,
      users_banned: stats.users_banned || 0,
      guilds_protected: stats.guilds_protected || 0
    };
  }

  getAllGuilds() {
    return this.db.prepare('SELECT * FROM guild_settings').all();
  }

  updateReputation(guildId, userId, delta) {
    this.db.prepare(`
      INSERT INTO user_reputation (guild_id, user_id, reputation)
      VALUES (?, ?, 100 + ?)
      ON CONFLICT(guild_id, user_id) 
      DO UPDATE SET reputation = reputation + ?
    `).run(guildId, userId, delta, delta);
  }

  getReputation(guildId, userId) {
    const row = this.db.prepare(
      'SELECT reputation FROM user_reputation WHERE guild_id = ? AND user_id = ?'
    ).get(guildId, userId);
    
    return row ? row.reputation : 100;
  }

  getLastReputationIncrement(guildId, userId) {
    const row = this.db.prepare(
      'SELECT last_increment FROM user_reputation WHERE guild_id = ? AND user_id = ?'
    ).get(guildId, userId);
    
    return row ? row.last_increment : 0;
  }

  setLastReputationIncrement(guildId, userId, timestamp) {
    this.db.prepare(`
      INSERT INTO user_reputation (guild_id, user_id, reputation, last_increment)
      VALUES (?, ?, 100, ?)
      ON CONFLICT(guild_id, user_id)
      DO UPDATE SET last_increment = ?
    `).run(guildId, userId, timestamp, timestamp);
  }

  close() {
    this.db.close();
  }
}

export default new DatabaseManager();
