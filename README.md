# Teen Do Paanch

The trick-taking card game **3-2-5** (*teen do paanch*), and its two-player
variant **7-8**, playable online with friends.

- `client/` — Next.js 15 app (deploy anywhere; Vercel works)
- `server/` — Cloudflare Worker + Durable Object, one object per game room

## How it fits together

The server is **authoritative**. It owns the deck, deals the hands, decides
which cards are legal, resolves every trick, and rotates the targets between
rounds. Each player's snapshot contains only their own cards — opponents are
represented by a card count, so a hand cannot be read out of the browser.

One Durable Object per room holds that state, with WebSocket Hibernation
enabled: an idle table drops out of memory without dropping its connections, so
a room where everyone is thinking costs nothing to keep open.

## Running locally

Requires **Node 22** (`nvm use` in `server/`).

```bash
# terminal 1 — the game server on :8787
cd server && npm install && npm run dev

# terminal 2 — the client on :3000
cd client && npm install && npm run dev
```

`client/.env.local` already points at `127.0.0.1:8787`.

## Deploying

**Server** (once per machine: `npx wrangler login`)

```bash
cd server && npm run deploy
```

Currently deployed at `card-game-server.card-game-server.workers.dev`.
`npm run tail` streams live logs from it.

**Client** — set `NEXT_PUBLIC_PARTY_HOST` to that host (no protocol) in your
hosting provider's environment, then deploy `client/` as a normal Next.js app.

```
NEXT_PUBLIC_PARTY_HOST=card-game-server.card-game-server.workers.dev
```

`client/.env.local` points at `127.0.0.1:8787` for local development and is
not committed, so it will not override the deployed host in production.

## Tests

Two headless playtests drive real WebSocket clients through a full match and
assert the invariants that matter — hand isolation, turn order, follow-suit,
host-only actions, round rotation, match end, and reconnect.

```bash
cd server
npm run playtest        # against localhost:8787 (wrangler dev must be running)
npm run playtest:prod   # against the deployed Worker
```

`scripts/bot.mjs <ROOM> <NAME>` joins a room and plays legal cards on its own,
so you can exercise the UI without a second person:

```bash
node scripts/bot.mjs 2FB2R Priya
```

Each client acts only on its own snapshot — driving several seats from one
player's view races once there is real network latency between them.

## Cost

Both halves run inside free tiers. The Workers free plan allows SQLite-backed
Durable Objects, which is what `wrangler.jsonc` declares via
`new_sqlite_classes` — using `new_classes` instead would silently move you to
the paid-only storage backend.

## Rules

Three players hold targets of 5, 2 and 3 tricks; two players hold 8 and 7.
Finish above your target and the surplus banks, below and the shortfall is
deducted. The largest target calls trump and leads. Targets rotate each round,
and the highest total after six rounds wins. Full rules live at `/how-to-play`.
