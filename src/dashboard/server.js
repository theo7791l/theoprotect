import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// WebSocket pour les mises à jour en temps réel
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  console.log('[Dashboard] Client connected');
  
  // Envoyer les stats initiales
  ws.send(JSON.stringify({
    type: 'initial',
    data: getDashboardData()
  }));
  
  ws.on('close', () => {
    console.log('[Dashboard] Client disconnected');
  });
});

// API Routes
app.get('/api/stats', (req, res) => {
  try {
    const data = getDashboardData();
    res.json(data);
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = db.getRecentLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error('[Dashboard] Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/guilds', (req, res) => {
  try {
    const guilds = db.getAllGuilds();
    res.json(guilds);
  } catch (error) {
    console.error('[Dashboard] Error fetching guilds:', error);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

app.post('/api/settings/:guildId', (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    db.updateGuildSettings(guildId, settings);
    
    // Broadcast update to all connected clients
    broadcastUpdate('settings_updated', { guildId, settings });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Dashboard] Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log('');
  console.log('═════════════════════════════════════════════');
  console.log('🌐 TheoProtect Dashboard');
  console.log(`📊 http://localhost:${PORT}`);
  console.log('═════════════════════════════════════════════');
  console.log('');
});

// Upgrade HTTP to WebSocket
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Helper functions
function getDashboardData() {
  const stats = db.getGlobalStats();
  const recentLogs = db.getRecentLogs(20);
  const guilds = db.getAllGuilds();
  
  return {
    stats,
    recentLogs,
    guilds,
    timestamp: Date.now()
  };
}

function broadcastUpdate(type, data) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Export pour utilisation dans le bot
export { broadcastUpdate };
export default server;
