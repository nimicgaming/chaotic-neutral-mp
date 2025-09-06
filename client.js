// Basic client that connects to the server and relays events
const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");

function log(msg, payload) {
  const pre = document.createElement("pre");
  pre.textContent = (new Date()).toLocaleTimeString() + "  " + msg + (payload ? ("\n" + JSON.stringify(payload, null, 2)) : "");
  logEl.prepend(pre);
}

const socket = io();

socket.on("connect", () => {
  statusEl.textContent = "Connected ✓  (" + socket.id + ")";
  log("connected", { id: socket.id });
});

socket.on("disconnect", () => {
  statusEl.textContent = "Disconnected ✕";
  log("disconnected");
});

socket.on("room:player_count", ({ count }) => {
  const text = `Players in quickplay: ${count}`;
  document.title = `Chaotic Neutral — ${count} online`;
  log(text);
});

// Generic relay
socket.on("game:event", (payload) => {
  log("game:event", payload);
});

// Named events commonly used in your project (relayed 1:1 by server)
const knownEvents = ["move", "attack", "endTurn", "playCard", "placeWall", "usePrimary", "useSpecial", "syncState", "chat", "ping"];
for (const evt of knownEvents) {
  socket.on(evt, (data) => log(evt, data));
}

// Demo buttons
document.getElementById("btnPing").onclick = () => {
  const payload = { t: Date.now(), from: socket.id };
  socket.emit("ping", payload);
  log("emit ping →", payload);
};
document.getElementById("btnTestMove").onclick = () => {
  const payload = { piece: "p1_tank", to: "D4" };
  socket.emit("move", payload);
  log("emit move →", payload);
};
document.getElementById("btnTestPrimary").onclick = () => {
  const payload = { actor: "Aimbot", target: "Voodoo", amount: 5 };
  socket.emit("usePrimary", payload);
  log("emit usePrimary →", payload);
};
document.getElementById("btnTestSpecial").onclick = () => {
  const payload = { actor: "DeathBlossom", effect: "Healing Blossom", heal: 2 };
  socket.emit("useSpecial", payload);
  log("emit useSpecial →", payload);
};
