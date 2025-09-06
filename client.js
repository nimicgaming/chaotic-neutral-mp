// Simple demo client to exercise the server. Replace with your game code.
// In your app, import socket and emit the same events (play_card, move_unit, etc.)
// after you receive 'match_found' and get a roomId and side.

const socket = io();

const logEl = document.getElementById('log');
function log(...args) {
  const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  logEl.textContent += msg + "\n";
}

let myId = null;
let roomId = null;
let side = null;

socket.on('connect', () => log('[io] connected', socket.id));
socket.on('hello', ({ playerId }) => { myId = playerId; log('[hello]', playerId); });

socket.on('match_found', (payload) => {
  roomId = payload.roomId;
  side = payload.side || (payload.sides && payload.sides[socket.id]);
  log('[match_found]', payload);
  document.getElementById('dummy-move').disabled = false;
  document.getElementById('chatBtn').disabled = false;
});

socket.on('room_created', (payload) => {
  log('[room_created]', payload);
  document.getElementById('code').value = payload.code;
});

socket.on('opponent_left', (payload) => log('[opponent_left]', payload));

socket.on('chat', (payload) => log('[chat]', payload));
socket.on('move_unit', (payload) => log('[move_unit]', payload));
socket.on('play_card', (payload) => log('[play_card]', payload));

// UI
document.getElementById('quick').onclick = () => socket.emit('join_queue');
document.getElementById('create').onclick = () => socket.emit('create_room');
document.getElementById('join').onclick = () => {
  const code = document.getElementById('code').value.trim();
  if (code) socket.emit('join_room', { code });
};

document.getElementById('dummy-move').onclick = () => {
  // Example of a room-scoped gameplay event
  socket.emit('move_unit', { unitId: 'pawn1', to: 'D4', ts: Date.now() });
};

document.getElementById('chatBtn').onclick = () => {
  const text = document.getElementById('chatText').value;
  socket.emit('chat', { text, ts: Date.now() });
};
