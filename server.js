import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { pickRoomFromQuery, getRoomCount } from "./rooms.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Serve all files from project root (flat layout, no /public folder)
app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  const room = pickRoomFromQuery(socket);
  socket.join(room);
  console.log("⚡", socket.id, "joined", room);

  // Let everyone in room know the new count
  io.to(room).emit("room:player_count", { room, count: getRoomCount(io, room) });

  // Generic relay for any gameplay messages
  socket.on("game:event", (payload) => socket.to(room).emit("game:event", payload));

  // Common named events relayed 1:1
  const relayEvents = ["move","attack","endTurn","playCard","placeWall","usePrimary","useSpecial","syncState","chat","ping"];
  for (const evt of relayEvents) {
    socket.on(evt, (data) => socket.to(room).emit(evt, data));
  }

  socket.on("disconnect", () => {
    io.to(room).emit("room:player_count", { room, count: getRoomCount(io, room) });
    console.log("👋", socket.id, "left", room);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
