/**
 * Chaotic Neutral - Minimal Multiplayer MVP
 * - Express static server (./public)
 * - Socket.IO matchmaking (Quick Play + Join by Code)
 * - Room-scoped event relaying (server re-broadcasts only to room)
 *
 * Integrate by emitting the same gameplay events you already use,
 * but now they are scoped to your room instead of global.
 *
 * Run: npm i && npm run dev
 */

const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { initMultiplayer } = require('./rooms');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

// Attach multiplayer (matchmaking + rooms + relays)
initMultiplayer(io);

app.get('/healthz', (_req, res) => res.json({ ok: true, ts: Date.now() }));

server.listen(PORT, () => {
  console.log(`[MP] Server listening on http://localhost:${PORT}`);
});
