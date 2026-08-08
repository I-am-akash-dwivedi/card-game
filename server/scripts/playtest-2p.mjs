/**
 * End-to-end playtest: drives two real WebSocket clients through a full match
 * against the local Worker and asserts the invariants that matter.
 */
const HOST = process.env.GAME_HOST || "ws://127.0.0.1:8787";
const ROOM = "playtest-" + Math.random().toString(36).slice(2, 8);

const failures = [];
function check(cond, label) {
  if (!cond) failures.push(label);
}

class Client {
  constructor(name) {
    this.name = name;
    this.playerId = null;
    this.state = null;
    this.events = [];
    this.ws = new WebSocket(`${HOST}/parties/game-room/${ROOM}`);
    this.ready = new Promise((r) => (this._ready = r));
    this.ws.addEventListener("open", () => this._ready());
    this.ws.addEventListener("message", (e) => this.onMessage(JSON.parse(e.data)));
  }
  onMessage(msg) {
    if (msg.t === "welcome" && msg.playerId) this.playerId = msg.playerId;
    if (msg.t === "state") {
      this.state = msg.state;
      // INVARIANT: a snapshot must never contain another player's cards.
      const leaked = JSON.stringify(msg.state.players).includes('"suit"');
      check(!leaked, `${this.name}: opponent hand leaked in players[]`);

      // INVARIANT: a trick still being played must carry no previous result,
      // or the client sweeps the incoming card straight out of view.
      const s = msg.state;
      const midTrick = s.trick.length > 0 && s.trick.length < s.players.length;
      check(
        !(midTrick && s.lastTrick),
        `${this.name}: stale lastTrick present mid-trick (${s.trick.length}/${s.players.length})`,
      );
    }
    if (msg.t === "event") this.events.push(msg.event);
  }
  send(o) { this.ws.send(JSON.stringify(o)); }
  close() { this.ws.close(); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, label, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fn()) return true;
    await sleep(40);
  }
  failures.push(`timeout waiting for: ${label}`);
  return false;
}

const a = new Client("Alice");
const b = new Client("Bob");
await Promise.all([a.ready, b.ready]);

a.send({ t: "join", name: "Alice" });
await until(() => a.playerId, "Alice joins");
b.send({ t: "join", name: "Bob" });
await until(() => b.playerId, "Bob joins");
await until(() => a.state?.players.length === 2, "both seated");

console.log(`room=${ROOM}  Alice=${a.playerId.slice(0,8)}  Bob=${b.playerId.slice(0,8)}`);

// --- authority checks -------------------------------------------------------
b.send({ t: "start" });
await sleep(300);
check(
  b.events.some((e) => e.kind === "error" && /host/i.test(e.message)),
  "non-host was allowed to start",
);
check(a.state.phase === "lobby", "phase advanced on an illegal start");

a.send({ t: "start" });
// Wait for BOTH snapshots. Over a real RTT one client's state lands well
// before the other's, so asserting on b right after waiting on a is a race.
await until(
  () => a.state?.phase === "trump" && b.state?.phase === "trump",
  "deal + trump phase on both clients",
);

check(a.state.you.hand.length === 15, `Alice dealt ${a.state.you.hand.length}, expected 15`);
check(b.state.you.hand.length === 15, `Bob dealt ${b.state.you.hand.length}, expected 15`);
check(a.state.players.find(p => p.id === b.playerId).handCount === 15, "opponent handCount wrong");
const allIds = [...a.state.you.hand, ...b.state.you.hand].map((c) => c.id);
check(new Set(allIds).size === 30, "duplicate cards dealt across hands");
check(a.state.you.hand[0].toMake === undefined, "hand carries server-internal fields");

const chooser = a.state.trumpChooserId;
check(chooser === a.playerId, "host did not get the first trump call");

// Non-chooser must be refused.
b.send({ t: "trump", suit: "♠" });
await sleep(250);
check(b.events.some((e) => e.kind === "error" && /your call/i.test(e.message)), "non-chooser set trump");

a.send({ t: "trump", suit: "♠" });
await until(() => a.state?.phase === "playing", "playing phase");
check(a.state.trumpSuit === "♠", "trump not recorded");
check(a.state.activePlayerId === chooser, "trump chooser does not lead");

// --- illegal play checks ----------------------------------------------------
const idle = a.state.activePlayerId === a.playerId ? b : a;
const idleBefore = idle.state.you.hand.length;
idle.send({ t: "play", cardId: idle.state.you.hand[0].id });
await sleep(250);
check(idle.events.some((e) => e.kind === "error" && /your turn/i.test(e.message)), "out-of-turn play allowed");
check(idle.state.you.hand.length === idleBefore, "out-of-turn play mutated hand");

const active = idle === a ? b : a;
active.send({ t: "play", cardId: "♠A-not-real" });
await sleep(250);
check(active.events.some((e) => e.kind === "error" && /do not hold/i.test(e.message)), "phantom card accepted");

// --- play the match out -----------------------------------------------------
const byId = { [a.playerId]: a, [b.playerId]: b };
let plays = 0;
let followSuitEnforced = false;

// Each client acts ONLY on its own snapshot, exactly as the real client does.
// Driving both seats from one player's view races over a real network: that
// view goes stale between the read and the send, producing duplicate plays.
while (plays < 400) {
  if (a.state?.phase === "matchEnd" || b.state?.phase === "matchEnd") break;

  let acted = false;
  for (const me of [a, b]) {
    const s = me.state;
    if (!s) continue;

    if (s.phase === "trump" && s.trumpChooserId === s.you.id) {
      me.send({ t: "trump", suit: "♥" });
      acted = true;
      // Wait for our own snapshot to reflect it, or we re-send on the next lap.
      await until(() => me.state.phase !== "trump", "trump acknowledged", 6000);
      continue;
    }

    if (s.phase !== "playing" || s.activePlayerId !== s.you.id) continue;

    const legal = s.you.legalCardIds;
    // It is this player's turn by their own authoritative snapshot, so the
    // server must have given them something legal to play.
    check(legal.length > 0, "active player has no legal cards");
    if (!legal.length) continue;

    // Probe follow-suit: if some cards are illegal, confirm the server rejects one.
    if (!followSuitEnforced && legal.length < s.you.hand.length) {
      const illegal = s.you.hand.find((c) => !legal.includes(c.id));
      const before = me.events.length;
      me.send({ t: "play", cardId: illegal.id });
      await sleep(400);
      check(
        me.events.slice(before).some((e) => e.kind === "error" && /follow/i.test(e.message)),
        "server allowed a suit-following violation",
      );
      followSuitEnforced = true;
    }

    const handBefore = s.you.hand.length;
    me.send({ t: "play", cardId: legal[0] });
    plays++;
    acted = true;
    // Block until the server confirms the card left our hand. Sleeping a fixed
    // interval instead would re-send whenever the round trip outran it.
    await until(
      () =>
        me.state.you.hand.length < handBefore ||
        me.state.phase === "matchEnd" ||
        me.state.round !== s.round,
      "play acknowledged",
      8000,
    );
  }

  if (!acted) await sleep(80); // trick lingering, or waiting on a snapshot
}

await until(
  () => a.state?.phase === "matchEnd" && b.state?.phase === "matchEnd",
  "match end on both clients",
  20000,
);

const s = a.state;
check(s.round === 6, `match ended at round ${s.round}, expected 6`);
check(s.standings?.length === 2, "standings missing at matchEnd");
const totalMade = s.players.reduce((n, p) => n + p.made, 0);
check(totalMade === 15, `tricks in final round summed to ${totalMade}, expected 15`);
check(followSuitEnforced, "never exercised the follow-suit path");
// 6 rounds x 15 tricks x 2 players. Anything above means plays were duplicated.
check(plays === 180, `sent ${plays} plays, expected exactly 180`);
// Backlogs are zero-sum: every trick above one player's target is below another's.
const backlogSum = s.standings.reduce((n, x) => n + x.backlog, 0);
check(backlogSum === 0, `backlogs summed to ${backlogSum}, expected 0`);

// --- reconnect --------------------------------------------------------------
a.send({ t: "rematch" });
await until(() => a.state?.phase === "trump", "rematch dealt");
const handBefore = a.state.you.hand.map((c) => c.id).join(",");
const savedId = a.playerId;
a.close();
await sleep(400);

const a2 = new Client("Alice");
await a2.ready;
a2.send({ t: "join", name: "Alice", playerId: savedId });
await until(() => a2.state?.you?.hand?.length > 0, "reconnect restores hand");
check(a2.state.you.hand.map((c) => c.id).join(",") === handBefore, "hand changed across reconnect");
check(a2.state.players.length === 2, "seat lost on reconnect");

console.log(`\nplays=${plays}  rounds=${s.round}  followSuitEnforced=${followSuitEnforced}`);
console.log(`standings: ${s.standings.map((x) => `${x.name} ${x.backlog >= 0 ? "+" : ""}${x.backlog}`).join(", ")}`);

if (failures.length) {
  console.log(`\n✗ ${failures.length} FAILURE(S):`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("\n✓ all invariants held");
process.exit(0);
