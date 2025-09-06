// Minimal room helper for Socket.IO
// - Default room is "quickplay"
// - Optionally allow a custom room via socket.handshake.query.room
export function pickRoomFromQuery(socket) {
  const qp = "quickplay";
  const q = socket.handshake?.query || {};
  let room = (typeof q.room === "string" && q.room.trim()) ? q.room.trim() : qp;
  // sanitize to simple slug
  room = room.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || qp;
  return room;
}

export function getRoomCount(io, room) {
  const r = io.sockets.adapter.rooms.get(room);
  return r ? r.size : 0;
}
