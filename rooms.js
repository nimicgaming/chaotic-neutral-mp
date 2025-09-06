/**
 * rooms.js - Matchmaking + Room management + Event relay (MVP)
 *
 * This wraps your existing gameplay events so they are sent only to the players
 * in the same room. Start here, then evolve to server-authoritative rules.
 */
const crypto = require('crypto');

function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

function initMultiplayer(io) {
  // Sockets currently waiting for match (Quick Play)
  const queue = [];
  // roomId -> { id, sockets: Set<string>, createdAt, sides: Map<socketId,'p1'|'p2'>, code? }
  const rooms = new Map();
  // socketId -> roomId
  const inRoom = new Map();
  // room code -> roomId (for join-by-code)
  const codeMap = new Map();

  const RELAY_WHITELIST = [
    // Use your existing event names here; add more when needed
    'play_card',
    'move_unit',
    'use_primary',
    'use_special',
    'end_turn',
    'place_wall',
    'remove_wall',
    'update_status',
    'chat'
  ];

  io.on('connection', (socket) => {
    // Basic identity (swap to your auth/session later)
    const playerId = socket.id;

    socket.emit('hello', { playerId });

    // --- Matchmaking: Quick Play ---
    socket.on('join_queue', () => {
      // Avoid duplicates
      if (queue.includes(socket.id)) return;
      queue.push(socket.id);
      tryMatch();
    });

    socket.on('leave_queue', () => {
      const idx = queue.indexOf(socket.id);
      if (idx >= 0) queue.splice(idx, 1);
    });

    // --- Room Code Flow ---
    socket.on('create_room', (_payload = {}, cb) => {
      const roomId = crypto.randomBytes(8).toString('hex');
      const code = randomCode();
      const room = {
        id: roomId,
        sockets: new Set([socket.id]),
        createdAt: Date.now(),
        sides: new Map([[socket.id, 'p1']]),
        code
      };
      rooms.set(roomId, room);
      codeMap.set(code, roomId);
      inRoom.set(socket.id, roomId);
      socket.join(roomId);
      if (typeof cb === 'function') cb({ roomId, code, side: 'p1' });
      socket.emit('room_created', { roomId, code, side: 'p1' });
    });

    socket.on('join_room', (payload = {}, cb) => {
      const code = String(payload.code || '').trim().toUpperCase();
      const roomId = codeMap.get(code);
      if (!roomId) {
        const err = { code: 'ROOM_NOT_FOUND', message: 'Invalid or expired code' };
        if (typeof cb === 'function') cb({ ok: false, error: err });
        socket.emit('error', err);
        return;
      }
      const room = rooms.get(roomId);
      if (!room) {
        const err = { code: 'ROOM_GONE', message: 'Room no longer exists' };
        if (typeof cb === 'function') cb({ ok: false, error: err });
        socket.emit('error', err);
        return;
      }
      if (room.sockets.size >= 2) {
        const err = { code: 'ROOM_FULL', message: 'Room is already full' };
        if (typeof cb === 'function') cb({ ok: false, error: err });
        socket.emit('error', err);
        return;
      }
      room.sockets.add(socket.id);
      const side = room.sides.has([...room.sides.keys()][0]) ? 'p2' : 'p1';
      room.sides.set(socket.id, side);
      inRoom.set(socket.id, roomId);
      socket.join(roomId);

      // Notify both players that match is ready
      io.to(roomId).emit('match_found', { roomId, sides: Object.fromEntries(room.sides) });
      if (typeof cb === 'function') cb({ ok: true, roomId, side });
    });

    // --- Event Relay (MVP) ---
    for (const ev of RELAY_WHITELIST) {
      socket.on(ev, (payload = {}) => {
        const roomId = inRoom.get(socket.id);
        if (!roomId) return; // ignore if not in room
        // Re-emit only to this room; include 'from' for disambiguation
        io.to(roomId).emit(ev, { ...payload, from: socket.id });
      });
    }

    // --- Disconnect Handling ---
    socket.on('disconnect', () => {
      // Remove from queue if present
      const qi = queue.indexOf(socket.id);
      if (qi >= 0) queue.splice(qi, 1);

      const roomId = inRoom.get(socket.id);
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;

      room.sockets.delete(socket.id);
      inRoom.delete(socket.id);

      // Inform remaining player
      io.to(roomId).emit('opponent_left', { playerId: socket.id });

      if (room.sockets.size === 0) {
        // Clean up empty room
        rooms.delete(roomId);
        if (room.code) codeMap.delete(room.code);
      }
    });

    function tryMatch() {
      while (queue.length >= 2) {
        const a = queue.shift();
        const b = queue.shift();
        const roomId = crypto.randomBytes(8).toString('hex');
        const room = {
          id: roomId,
          sockets: new Set([a, b]),
          createdAt: Date.now(),
          sides: new Map([[a, 'p1'], [b, 'p2']])
        };
        rooms.set(roomId, room);
        inRoom.set(a, roomId);
        inRoom.set(b, roomId);
        io.sockets.sockets.get(a)?.join(roomId);
        io.sockets.sockets.get(b)?.join(roomId);
        io.to(a).emit('match_found', { roomId, side: 'p1' });
        io.to(b).emit('match_found', { roomId, side: 'p2' });
      }
    }
  });
}

module.exports = { initMultiplayer };
