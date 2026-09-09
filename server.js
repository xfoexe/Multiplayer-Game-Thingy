const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const HTML = path.join(__dirname, "Vivarium_6.19_multiplayer.html");

const players = new Map();
let nextId = 1;

function broadcast(obj, except) {
  const text = JSON.stringify(obj);
  for (const [id, ws] of players) {
    if (id !== except && ws.readyState === WebSocket.OPEN) ws.send(text);
  }
}

function cleanName(value, fallback) {
  return String(value || fallback).slice(0, 24);
}

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/Vivarium_6.19_multiplayer.html") {
    fs.createReadStream(HTML).on("error", () => {
      res.writeHead(500);
      res.end("Could not read game file.");
    }).pipe(res);
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocket.Server({ server, path: "/ws" });

wss.on("connection", ws => {
  const id = String(nextId++);
  players.set(id, ws);

  let name = "Player " + id;

  // A player starts in the lab. Their lab creatures are deliberately
  // not shared with other players.
  let latest = {
    type: "presence",
    id,
    name,
    mode: "lab"
  };
  ws._latest = latest;

  ws.send(JSON.stringify({
    type: "welcome",
    id,
    players: [...players.entries()]
      .filter(([pid]) => pid !== id)
      .map(([, pws]) => pws._latest)
      .filter(Boolean)
      .map(x => ({ ...x }))
  }));

  ws.on("message", raw => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (_) {
      return;
    }

    if (msg.type === "hello") {
      name = cleanName(msg.name, name);
      latest = {
        type: "presence",
        id,
        name,
        mode: msg.mode === "free" ? "free" : "lab"
      };
      ws._latest = latest;
      broadcast(latest, id);
      return;
    }

    if (msg.type === "presence") {
      latest = {
        type: "presence",
        id,
        name,
        mode: msg.mode === "free" ? "free" : "lab"
      };
      ws._latest = latest;
      broadcast(latest, id);
      return;
    }

    if (msg.type === "state") {
      latest = {
        type: "state",
        id,
        name,
        mode: "free",
        creatureName: cleanName(msg.creatureName, "Creature"),
        x: Number(msg.x) || 0,
        z: Number(msg.z) || 0,
        heading: Number(msg.heading) || 0,
        jumpY: Number(msg.jumpY) || 0,
        genome: msg.genome || null
      };
      ws._latest = latest;
      broadcast(latest, id);
    }
  });

  ws.on("close", () => {
    players.delete(id);
    broadcast({ type: "leave", id });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Vivarium multiplayer server: http://localhost:${PORT}`);
  console.log(`LAN: http://<this-computer-ip>:${PORT}`);
});
