// Simple client that auto-joins "quickplay" unless a ?room=NAME is provided.
const params = new URLSearchParams(location.search);
const room = params.get("room") || "quickplay";

const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");
const roomEl = document.getElementById("room");

function log(msg, payload) {
  const pre = document.createElement("pre");
  pre.textContent = (new Date()).toLocaleTimeString() + "  " + msg + (payload ? ("\n" + JSON.stringify(payload, null, 2)) : "");
  logEl.prepend(pre);
}

// Pass room in handshake query
const socket = io({ query: { room } });

socket.on("connect", () => {
  statusEl.textContent = "Connected ✓  (" + socket.id + ")";
  roomEl.textContent = room;
  document.title = "Chaotic Neutral — " + room;
  log("connected", { id: socket.id, room });
});

socket.on("disconnect", () => {
  statusEl.textContent = "Disconnected ✕";
  log("disconnected");
});

socket.on("room:player_count", ({ room, count }) => {
  log(`players in ${room}: ${count}`);
});

// Generic relay
socket.on("game:event", (payload) => log("game:event", payload));

// Named events (relayed 1:1 by server)
const knownEvents = ["move","attack","endTurn","playCard","placeWall","usePrimary","useSpecial","syncState","chat","ping"];
for (const evt of knownEvents) {
  socket.on(evt, (data) => log(evt, data));
}

// Demo buttons
document.getElementById("btnPing").onclick = () => {
  const payload = { t: Date.now(), from: socket.id };
  socket.emit("ping", payload);
  log("emit ping →", payload);
};
document.getElementById("btnMove").onclick = () => {
  const payload = { piece: "p1_tank", to: "D4" };
  socket.emit("move", payload);
  log("emit move →", payload);
};
document.getElementById("btnPrimary").onclick = () => {
  const payload = { actor: "Aimbot", target: "Voodoo", amount: 5 };
  socket.emit("usePrimary", payload);
  log("emit usePrimary →", payload);
};
document.getElementById("btnSpecial").onclick = () => {
  const payload = { actor: "DeathBlossom", effect: "Healing Blossom", heal: 2 };
  socket.emit("useSpecial", payload);
  log("emit useSpecial →", payload);
};
