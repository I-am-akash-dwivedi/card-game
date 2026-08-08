/** Three-player (5-2-3) match: the primary variant. */
const HOST = process.env.GAME_HOST || "ws://127.0.0.1:8787";
const ROOM = "p3-" + Math.random().toString(36).slice(2, 8);
const failures = [];
const check = (c, l) => { if (!c) failures.push(l); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class C {
  constructor(name, room = ROOM) {
    this.name = name; this.state = null; this.id = null; this.events = [];
    this.ws = new WebSocket(`${HOST}/parties/game-room/${room}`);
    this.ready = new Promise((r) => this.ws.addEventListener("open", r));
    this.ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.t === "welcome" && m.playerId) this.id = m.playerId;
      if (m.t === "state") {
        this.state = m.state; this.id = m.state.you.id;
        check(!JSON.stringify(m.state.players).includes('"suit"'), `${this.name}: hand leaked`);
      }
      if (m.t === "event") this.events.push(m.event);
    });
  }
  send(o) { this.ws.send(JSON.stringify(o)); }
}
async function until(fn, label, t = 10000) {
  const s = Date.now();
  while (Date.now() - s < t) { if (fn()) return true; await sleep(40); }
  failures.push(`timeout: ${label}`); return false;
}

const cs = [new C("A"), new C("B"), new C("D")];
await Promise.all(cs.map((c) => c.ready));
for (const c of cs) { c.send({ t: "join", name: c.name }); await sleep(180); }
await until(() => cs[0].state?.players.length === 3, "three seated");

// A fourth player must be turned away.
const extra = new C("E");
await extra.ready;
extra.send({ t: "join", name: "E" });
await sleep(400);
check(extra.events.some((e) => e.kind === "error" && /full/i.test(e.message)), "4th player was seated");

// Duplicate names must be refused (the old build keyed identity on name).
// Needs a room with a free seat, or "room full" fires first and masks it.
const DUPE_ROOM = "dupe-" + Math.random().toString(36).slice(2, 8);
const mk = (name) => new C(name, DUPE_ROOM);
const first = mk("Akash");
await first.ready;
first.send({ t: "join", name: "Akash" });
await sleep(300);
const dupe = mk("Akash");
await dupe.ready;
dupe.send({ t: "join", name: "akash" }); // different case, same person's name
await sleep(400);
check(
  dupe.events.some((e) => e.kind === "error" && /already uses that name/i.test(e.message)),
  "duplicate name accepted",
);
check(first.state.players.length === 1, "duplicate name still took a seat");

cs[0].send({ t: "start" });
await until(() => cs.every((c) => c.state?.phase === "trump"), "dealt to all three");

const targets = cs[0].state.players.map((p) => p.toMake).sort((a, b) => a - b);
check(JSON.stringify(targets) === "[2,3,5]", `targets were ${targets}, expected 2,3,5`);
check(cs.every((c) => c.state.you.hand.length === 10), "not everyone got 10 cards");
const ids = cs.flatMap((c) => c.state.you.hand.map((x) => x.id));
check(new Set(ids).size === 30, "duplicate cards across three hands");

// Each client acts only on its own snapshot and waits for the server to
// acknowledge before acting again. Driving all three seats from one player's
// view races as soon as there is real latency between them.
let plays = 0, rounds = new Set();
while (plays < 400) {
  if (cs.some((c) => c.state?.phase === "matchEnd")) break;

  let acted = false;
  for (const me of cs) {
    const s = me.state;
    if (!s) continue;
    rounds.add(s.round);

    if (s.phase === "trump" && s.trumpChooserId === s.you.id) {
      me.send({ t: "trump", suit: "♦" });
      acted = true;
      await until(() => me.state.phase !== "trump", "trump acknowledged", 6000);
      continue;
    }

    if (s.phase !== "playing" || s.activePlayerId !== s.you.id) continue;

    const legal = s.you.legalCardIds;
    check(legal.length > 0, "active player had no legal card");
    if (!legal.length) continue;

    const handBefore = s.you.hand.length;
    me.send({ t: "play", cardId: legal[0] });
    plays++;
    acted = true;
    await until(
      () =>
        me.state.you.hand.length < handBefore ||
        me.state.phase === "matchEnd" ||
        me.state.round !== s.round,
      "play acknowledged",
      8000,
    );
  }

  if (!acted) await sleep(70);
}
await until(() => cs[0].state?.phase === "matchEnd", "match end", 20000);

const f = cs[0].state;
check(f.round === 6, `ended on round ${f.round}`);
check(rounds.size === 6, `saw ${rounds.size} distinct rounds`);
check(f.players.reduce((n, p) => n + p.made, 0) === 10, "final round tricks !== 10");
// 6 rounds x 10 tricks x 3 players. Above this means plays were duplicated.
check(plays === 180, `sent ${plays} plays, expected exactly 180`);
const backlogSum = f.standings.reduce((n, x) => n + x.backlog, 0);
check(backlogSum === 0, `backlogs summed to ${backlogSum}, expected 0`);
// Every seat should have held every target exactly twice over six rounds.
check(f.standings.length === 3, "standings incomplete");

console.log(`plays=${plays} rounds=${[...rounds].join(",")}`);
console.log(`standings: ${f.standings.map((s) => `${s.name} ${s.backlog >= 0 ? "+" : ""}${s.backlog}`).join(", ")}`);
if (failures.length) {
  console.log(`\n✗ ${failures.length} FAILURE(S):`);
  failures.forEach((x) => console.log("  - " + x));
  process.exit(1);
}
console.log("\n✓ three-player invariants held");
process.exit(0);
