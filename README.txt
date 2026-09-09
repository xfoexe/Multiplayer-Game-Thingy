VIVARIUM III 6.19 MULTIPLAYER
==============================

This version adds:

- Public WebSocket multiplayer presence.
- Remote players become visible when they enter Free roam and control a creature.
- A tiny world name tag shows:
    creature name
    player name
- An online player list.
- Lab creatures are NOT shared with other players.
- When a player returns to the lab, their remote creature disappears.
- The Render deployment can use the same-origin wss:// WebSocket endpoint.

FILES
-----
Vivarium_6.19_multiplayer.html
server.js
package.json

RENDER
------
Build command:
    npm install

Start command:
    node server.js

The server uses Render's PORT environment variable automatically.

LOCAL
-----
npm install
node server.js

Then open:
    http://localhost:8080

IMPORTANT
---------
The browser game and server must be deployed together.
