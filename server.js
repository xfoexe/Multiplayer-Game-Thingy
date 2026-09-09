const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = Number(process.env.PORT || 8080);
const HOST = '0.0.0.0';

// This MUST match the HTML filename in the GitHub repo.
const GAME_FILE = path.join(__dirname, 'Vivarium_6.20_multiplayer.html');

const players = new Map();
let nextId = 1;

function broadcast(obj, exceptId) {
  const text = JSON.stringify(obj);

  for (const [id, ws] of players) {
    if (id !== exceptId && ws.readyState === WebSocket.OPEN) {
      ws.send(text);
    }
  }
}

function cleanName(value, fallback) {
  const name = String(value || '').trim();
  return (name || fallback).slice(0, 24);
}

const server = http.createServer((req, res) => {

  if (
    req.url === '/' ||
    req.url === '/game' ||
    req.url === '/Vivarium_6.20_multiplayer.html'
  ) {

    if (!fs.existsSync(GAME_FILE)) {
      console.error('Game file not found:', GAME_FILE);

      res.writeHead(500, {
        'Content-Type': 'text/plain; charset=utf-8'
      });

      res.end(
        'Could not find Vivarium_6.20_multiplayer.html'
      );

      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8'
    });

    const stream = fs.createReadStream(GAME_FILE);

    stream.on('error', err => {
      console.error('Could not read game file:', err);

      if (!res.headersSent) {
        res.writeHead(500);
      }

      res.end('Could not read game file.');
    });

    stream.pipe(res);

    return;
  }

  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8'
  });

  res.end('Not found');
});

const wss = new WebSocket.Server({
  server,
  path: '/ws'
});

wss.on('connection', ws => {

  const id = String(nextId++);

  players.set(id, ws);

  let name = 'Player ' + id;

  let latest = {
    type: 'presence',
    id,
    name,
    mode: 'lab',
    creatureCount: 0
  };

  ws._latest = latest;

  // Tell the newly connected player about everyone already online.
  ws.send(JSON.stringify({
    type: 'welcome',
    id,

    players: [...players.entries()]
      .filter(([pid]) => pid !== id)
      .map(([, pws]) => pws._latest)
      .filter(Boolean)
      .map(x => ({ ...x }))
  }));

  ws.on('message', raw => {

    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch (_) {
      return;
    }

    // -------------------------
    // PLAYER HELLO
    // -------------------------

    if (msg.type === 'hello') {

      name = cleanName(msg.name, name);

      latest = {
        type: 'presence',
        id,
        name,
        mode: msg.mode === 'free' ? 'free' : 'lab',
        creatureCount:
          Math.max(0, Number(msg.creatureCount) || 0)
      };

      ws._latest = latest;

      broadcast(latest, id);

      return;
    }

    // -------------------------
    // LAB / FREE ROAM PRESENCE
    // -------------------------

    if (msg.type === 'presence') {

      const mode =
        msg.mode === 'free' ? 'free' : 'lab';

      const creatureCount =
        Math.max(0, Number(msg.creatureCount) || 0);

      // Preserve the latest creature state while changing
      // only the player's current mode/count.
      latest =
        latest.type === 'state'
          ? {
              ...latest,
              name,
              mode,
              creatureCount
            }
          : {
              type: 'presence',
              id,
              name,
              mode,
              creatureCount
            };

      ws._latest = latest;

      broadcast(latest, id);

      return;
    }

    // -------------------------
    // CONTROLLED CREATURE STATE
    // -------------------------

    if (msg.type === 'state') {

      latest = {
        type: 'state',

        id,

        name,

        mode: 'free',

        creatureName:
          cleanName(
            msg.creatureName,
            'Creature'
          ),

        creatureCount:
          Math.max(
            0,
            Number(msg.creatureCount) || 0
          ),

        x:
          Number(msg.x) || 0,

        z:
          Number(msg.z) || 0,

        heading:
          Number(msg.heading) || 0,

        jumpY:
          Number(msg.jumpY) || 0,

        genome:
          msg.genome || null
      };

      ws._latest = latest;

      broadcast(latest, id);

      return;
    }

    // -------------------------
    // POOP
    // -------------------------

    if (msg.type === 'poop') {

      broadcast(
        {
          type: 'poop',

          id,

          x:
            Number(msg.x) || 0,

          z:
            Number(msg.z) || 0
        },
        id
      );

      return;
    }

    // -------------------------
    // CLIENT KEEPALIVE
    // -------------------------

    if (msg.type === 'ping') {

      if (ws.readyState === WebSocket.OPEN) {

        ws.send(
          JSON.stringify({
            type: 'pong'
          })
        );

      }

      return;
    }

  });

  // -------------------------
  // PLAYER DISCONNECT
  // -------------------------

  ws.on('close', () => {

    players.delete(id);

    broadcast(
      {
        type: 'leave',
        id
      }
    );

  });

});

// Server-side WebSocket heartbeat.
const heartbeat = setInterval(() => {

  for (const ws of wss.clients) {

    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }

  }

}, 30000);

server.on('close', () => {
  clearInterval(heartbeat);
});

server.listen(PORT, HOST, () => {

  console.log(
    'Vivarium multiplayer server running on port ' +
    PORT
  );

  console.log(
    'Game file: ' + GAME_FILE
  );

});    try {
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
