/** Auto-playing opponent so the table UI can be exercised in a real browser. */
const HOST = process.env.GAME_HOST || "ws://127.0.0.1:8787";
const room = process.argv[2];
const name = process.argv[3] ?? "Bot";
const ws = new WebSocket(`${HOST}/parties/game-room/${room}`);

let me = null;
ws.addEventListener("open", () => ws.send(JSON.stringify({ t: "join", name })));

ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.t === "welcome" && msg.playerId) me = msg.playerId;
  if (msg.t !== "state") return;
  const s = msg.state;
  me = s.you.id;

  if (s.phase === "trump" && s.trumpChooserId === me) {
    // Call the suit we are longest in.
    const counts = {};
    for (const c of s.you.hand) counts[c.suit] = (counts[c.suit] ?? 0) + 1;
    const suit = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    setTimeout(() => ws.send(JSON.stringify({ t: "trump", suit })), 900);
  }

  if (s.phase === "playing" && s.activePlayerId === me && s.you.legalCardIds.length) {
    const pick = s.you.legalCardIds[Math.floor(Math.random() * s.you.legalCardIds.length)];
    setTimeout(() => ws.send(JSON.stringify({ t: "play", cardId: pick })), 1100);
  }
});

ws.addEventListener("close", () => process.exit(0));
setTimeout(() => process.exit(0), 600000);
