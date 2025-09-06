# Chaotic Neutral — flat deploy with rooms

Minimal Express + Socket.IO setup with a **flat** layout (no /public folder). Defaults to joining
a global **quickplay** room. Add `?room=NAME` to the URL to join a private/shared room.

## Run locally

```bash
npm install
npm start
```

Then open http://localhost:3000

## Deploy (Render Free)

- Build: `npm install`
- Start: `node server.js`
- Instance type: Free
- Render sets the `PORT` env var automatically.

## Client usage in your existing game

Keep your current `socket.emit("move" | "usePrimary" | "useSpecial" | "playCard" | "placeWall" | "syncState" | "chat", data)`
calls — the server relays them to other clients in the same room.
