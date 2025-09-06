# Chaotic Neutral — Render-ready quickplay starter (flat files)

This is a super-minimal Express + Socket.IO starter designed to work with a **flat** file layout
(no `/public` or `/client` folders). Place your `index.html`, `client.js`, and other assets in the root next
to `server.js` and deploy.

## Local dev

```bash
npm install
npm start
```

Then open http://localhost:3000

## Deploy to Render (Free)

1. Push this folder to a GitHub repo.
2. Render → New → Web Service → Connect repo
3. Build Command: `npm install`
   Start Command: `node server.js`
4. Instance type: Free
5. Render will set `PORT` automatically.

## Notes

- Everyone who opens your URL is auto-joined into the same "quickplay" room.
- The server relays generic `game:event` and also common named events like `move`, `usePrimary`, `useSpecial`, etc.
  You can keep your existing client emits and they'll be mirrored to other players.
- If you previously had `/public` or `/client`, you can simply move those files to the root.
