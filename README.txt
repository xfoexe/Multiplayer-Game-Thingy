VIVARIUM MULTIPLAYER TEST
==========================

This is a very small LAN multiplayer prototype.

1. Install Node.js 18+ on a computer.
2. Put the included Vivarium_6.18_multiplayer.html beside server.js.
3. In this folder run:
       npm install
       node server.js
4. On the host computer open:
       http://localhost:8080
5. On the tablet/second device, while on the same Wi-Fi, open:
       http://HOST-COMPUTER-LAN-IP:8080
   Example: http://192.168.1.20:8080
6. Tap Online on each device and enter a player name.

What this prototype syncs:
- the creature currently being controlled
- position
- heading
- jump height
- its genome, so the other player can see the same creature

This is deliberately NOT a production server yet. There is no login,
database, anti-cheat, persistence, matchmaking, or internet relay.
It is just enough to prove that two devices can share the Vivarium world.
