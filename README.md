# Chaotic Neutral — Multiplayer MVP (Socket.IO)

### What this gives you right now
- **Quick Play** queue (auto-match 2 players)
- **Create Room / Join by Code**
- **Room-scoped event relaying** for your existing gameplay events
- Minimal demo client to verify everything works

> This is a **broadcast MVP**: the server relays whitelisted gameplay events
> only within each room. It gets you online *as-is* without moving all rules to
> the server yet. You can progressively migrate to server-authoritative logic.

---

## Run locally

```bash
cd chaotic-neutral-mp
npm i
npm run dev
# open http://localhost:3000 in two browser windows
```

Click **Quick Play** in both windows to get matched. Press **Send Demo Move**
or send **Chat** to see per-room messages.

---

## Integrate with your game

1. **Start this server** alongside your current project (or merge `server.js` and `rooms.js` into yours).
2. On the **client**, connect once:
   ```js
   const socket = io('http://localhost:3000'); // adjust if hosted
   ```
3. **Matchmaking** (choose one):
   - Quick Play: `socket.emit('join_queue')` and wait for `match_found`
   - Code Flow: `socket.emit('create_room')` → share code → other client `socket.emit('join_room', { code })`
4. After `match_found`, emit your **existing gameplay events** but now they are room-scoped. For example:
   ```js
   socket.emit('move_unit', { unitId, to });
   socket.emit('play_card', { cardId, targets });
   socket.emit('use_primary', { actorId, targetId });
   socket.emit('use_special', { actorId, data });
   socket.emit('end_turn', {});
   ```
   On the other side, listen for the same events:
   ```js
   socket.on('move_unit', (payload) => { /* update UI */ });
   ```

### Whitelisted events (edit in `rooms.js`)
```
play_card, move_unit, use_primary, use_special, end_turn, place_wall, remove_wall, update_status, chat
```

Add/remove event names to match your code. The server will relay only these events within a room.

---

## Next steps (optional, when ready)
- Add a **seeded RNG** and move dice rolls server-side.
- Swap broadcast relays for a **rules engine** that validates actions, then emits patches.
- Add **reconnect tokens** and persistence.

---

## Deploying
- Render/Railway/Fly.io work out of the box.
- Ensure your reverse proxy supports **WebSockets** and **sticky sessions** when you scale to multiple instances.
