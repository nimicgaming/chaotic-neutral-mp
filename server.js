import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Serve all files from the project root (flat structure, no /public needed)
app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Simple quickplay: everyone joins the same room automatically
const ROOM = "quickplay";

io.on("connection", (socket) => {
  console.log("⚡ client connected", socket.id);
  socket.join(ROOM);

  // Tell newcomers how many are online in the room
  const room = io.sockets.adapter.rooms.get(ROOM);
  const count = room ? room.size : 1;
  io.to(ROOM).emit("room:player_count", { count });

  // Generic relay for any gameplay messages
  socket.on("game:event", (payload) => {
    // Broadcast to everyone else in the room
    socket.to(ROOM).emit("game:event", payload);
  });

  // Optional: named events you may already be using — they will be relayed 1:1
  const relayEvents = [
    "move", "attack", "endTurn", "playCard", "placeWall",
    "usePrimary", "useSpecial", "syncState", "chat", "ping"
  ];
  for (const evt of relayEvents) {
    socket.on(evt, (data) => {
      socket.to(ROOM).emit(evt, data);
    });
  }

  socket.on("disconnect", () => {
    const roomNow = io.sockets.adapter.rooms.get(ROOM);
    const newCount = roomNow ? roomNow.size : 0;
    io.to(ROOM).emit("room:player_count", { count: newCount });
    console.log("👋 client disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
