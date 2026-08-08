import {
  Server,
  routePartykitRequest,
  type Connection,
  type WSMessage,
} from "partyserver";

import {
  deal,
  handsToMake,
  legalCards,
  newDeck,
  resolveTrick,
  rotateTarget,
  shuffle,
} from "./game";

import type {
  Card,
  ChatMessage,
  ClientMessage,
  ClientState,
  GameEvent,
  Phase,
  PlayedCard,
  PublicPlayer,
  ServerMessage,
  Suit,
  TrickResult,
} from "./protocol";

const MAX_PLAYERS = 3;
const MIN_PLAYERS = 2;
const MAX_NAME_LENGTH = 20;
const MAX_CHAT_LENGTH = 280;
const CHAT_HISTORY = 60;
/** Multiple of both supported player counts, so every seat plays every target equally. */
const TOTAL_ROUNDS = 6;
/** How long a completed trick stays face-up before it is swept away. */
const TRICK_LINGER_MS = 1800;

interface Player {
  id: string;
  name: string;
  connected: boolean;
  hand: Card[];
  toMake: number;
  made: number;
  backlog: number;
}

interface GameState {
  phase: Phase;
  round: number;
  hostId: string | null;
  players: Player[];
  trumpSuit: Suit | null;
  trumpChooserId: string | null;
  activePlayerId: string | null;
  trick: PlayedCard[];
  lastTrick: TrickResult | null;
  messages: ChatMessage[];
}

function initialState(): GameState {
  return {
    phase: "lobby",
    round: 0,
    hostId: null,
    players: [],
    trumpSuit: null,
    trumpChooserId: null,
    activePlayerId: null,
    trick: [],
    lastTrick: null,
    messages: [],
  };
}

export class GameRoom extends Server<Env> {
  /**
   * Hibernation lets the room drop out of memory while sockets stay open, so an
   * idle game costs nothing. Everything durable therefore lives in storage, not
   * on `this` — see `onStart`.
   */
  static options = { hibernate: true };

  private game: GameState = initialState();

  async onStart() {
    this.game =
      (await this.ctx.storage.get<GameState>("game")) ?? initialState();
  }

  private async save() {
    await this.ctx.storage.put("game", this.game);
  }

  // ---------------------------------------------------------------- lifecycle

  async onConnect(connection: Connection) {
    // The socket carries no identity until the client sends `join`. Reconnecting
    // clients replay their stored playerId there to reclaim their seat.
    connection.send(
      JSON.stringify({ t: "welcome", playerId: "" } satisfies ServerMessage),
    );
  }

  async onMessage(connection: Connection, raw: WSMessage) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return this.sendError(connection, "Malformed message.");
    }

    try {
      switch (msg.t) {
        case "join":
          return await this.handleJoin(connection, msg.name, msg.playerId);
        case "start":
          return await this.handleStart(connection);
        case "trump":
          return await this.handleTrump(connection, msg.suit);
        case "play":
          return await this.handlePlay(connection, msg.cardId);
        case "chat":
          return await this.handleChat(connection, msg.text);
        case "rematch":
          return await this.handleRematch(connection);
        default:
          return this.sendError(connection, "Unknown message type.");
      }
    } catch (error) {
      console.error("onMessage failed", error);
      this.sendError(connection, "Something went wrong handling that action.");
    }
  }

  async onClose(connection: Connection) {
    const playerId = this.playerIdFor(connection);
    const player = playerId ? this.findPlayer(playerId) : null;
    if (!player) return;

    player.connected = false;

    // Before the game starts a seat has no value, so free it up. Mid-game the
    // seat is held open so the player can reconnect into it.
    if (this.game.phase === "lobby") {
      this.game.players = this.game.players.filter((p) => p.id !== player.id);
      if (this.game.hostId === player.id) {
        this.game.hostId = this.game.players[0]?.id ?? null;
      }
    }

    await this.save();
    this.broadcastEvent({ kind: "playerLeft", name: player.name });
    this.broadcastState();
  }

  // ------------------------------------------------------------------ actions

  private async handleJoin(
    connection: Connection,
    rawName: string,
    existingId?: string,
  ) {
    const name = String(rawName ?? "").trim().slice(0, MAX_NAME_LENGTH);
    if (!name) return this.sendError(connection, "Name cannot be empty.");

    // Reconnect by seat id — the reliable path, since the id is opaque.
    // Falling back to an exact name match on a seat that is currently
    // disconnected keeps a game recoverable when a player loses their stored id
    // (cleared storage, new device). It can only ever reclaim an empty chair,
    // so it cannot be used to displace someone who is still playing.
    const existing =
      (existingId ? this.findPlayer(existingId) : null) ??
      this.game.players.find(
        (p) => !p.connected && p.name.toLowerCase() === name.toLowerCase(),
      );

    if (existing) {
      existing.connected = true;
      existing.name = name;
      connection.setState({ playerId: existing.id });
      connection.send(
        JSON.stringify({
          t: "welcome",
          playerId: existing.id,
        } satisfies ServerMessage),
      );
      await this.save();
      this.broadcastEvent({ kind: "playerRejoined", name: existing.name });
      this.broadcastState();
      return;
    }

    if (this.game.phase !== "lobby") {
      return this.sendError(connection, "That game is already in progress.");
    }
    if (this.game.players.length >= MAX_PLAYERS) {
      return this.sendError(connection, "This room is full (3 players max).");
    }
    if (this.game.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return this.sendError(connection, "Someone in this room already uses that name.");
    }

    const player: Player = {
      id: crypto.randomUUID(),
      name,
      connected: true,
      hand: [],
      toMake: 0,
      made: 0,
      backlog: 0,
    };
    this.game.players.push(player);
    this.game.hostId ??= player.id;

    connection.setState({ playerId: player.id });
    connection.send(
      JSON.stringify({ t: "welcome", playerId: player.id } satisfies ServerMessage),
    );

    await this.save();
    this.broadcastEvent({ kind: "playerJoined", name: player.name });
    this.broadcastState();
  }

  private async handleStart(connection: Connection) {
    const player = this.requirePlayer(connection);
    if (!player) return;
    if (player.id !== this.game.hostId) {
      return this.sendError(connection, "Only the host can start the game.");
    }
    if (this.game.phase !== "lobby") {
      return this.sendError(connection, "The game has already started.");
    }
    if (this.game.players.length < MIN_PLAYERS) {
      return this.sendError(connection, "You need at least 2 players to start.");
    }

    const targets = handsToMake(this.game.players.length);
    this.game.players.forEach((p, seat) => {
      p.toMake = targets[seat];
      p.made = 0;
      p.backlog = 0;
    });

    this.game.round = 1;
    this.beginRound();
    await this.save();
    this.broadcastState();
  }

  private async handleTrump(connection: Connection, suit: Suit) {
    const player = this.requirePlayer(connection);
    if (!player) return;
    if (this.game.phase !== "trump") {
      return this.sendError(connection, "Trump is not being chosen right now.");
    }
    if (player.id !== this.game.trumpChooserId) {
      return this.sendError(connection, "It is not your call.");
    }
    if (!["♠", "♥", "♦", "♣"].includes(suit)) {
      return this.sendError(connection, "That is not a suit.");
    }

    this.game.trumpSuit = suit;
    this.game.phase = "playing";
    // Whoever named trump leads the first trick.
    this.game.activePlayerId = this.game.trumpChooserId;

    await this.save();
    this.broadcastEvent({ kind: "trumpChosen", suit, byName: player.name });
    this.broadcastState();
  }

  private async handlePlay(connection: Connection, cardId: string) {
    const player = this.requirePlayer(connection);
    if (!player) return;
    if (this.game.phase !== "playing") {
      return this.sendError(connection, "You cannot play a card right now.");
    }
    if (player.id !== this.game.activePlayerId) {
      return this.sendError(connection, "It is not your turn.");
    }

    const card = player.hand.find((c) => c.id === cardId);
    if (!card) return this.sendError(connection, "You do not hold that card.");

    const leadSuit = this.game.trick[0]?.card.suit ?? null;
    if (!legalCards(player.hand, leadSuit).some((c) => c.id === cardId)) {
      return this.sendError(connection, `You must follow ${leadSuit}.`);
    }

    // Opening a new trick retires the previous one's result. Without this the
    // client would still see `lastTrick` set and sweep the incoming card away.
    if (this.game.trick.length === 0) this.game.lastTrick = null;

    player.hand = player.hand.filter((c) => c.id !== cardId);
    this.game.trick.push({ playerId: player.id, card });

    if (this.game.trick.length < this.game.players.length) {
      this.game.activePlayerId = this.seatAfter(player.id);
      await this.save();
      this.broadcastState();
      return;
    }

    // Trick complete. Score it, then leave it face-up briefly — the alarm below
    // sweeps it so clients have a window to animate the win.
    const winning = resolveTrick(this.game.trick, this.game.trumpSuit);
    const winner = this.findPlayer(winning.playerId)!;
    winner.made += 1;

    this.game.lastTrick = {
      winnerId: winner.id,
      winnerName: winner.name,
      cards: [...this.game.trick],
    };
    this.game.activePlayerId = null; // nobody may act while the trick is shown

    await this.save();
    this.broadcastEvent({
      kind: "trickWon",
      winnerId: winner.id,
      winnerName: winner.name,
    });
    this.broadcastState();

    await this.ctx.storage.setAlarm(Date.now() + TRICK_LINGER_MS);
  }

  /** Fires once a completed trick has been on screen long enough. */
  async onAlarm() {
    if (!this.game.lastTrick) return;

    const winnerId = this.game.lastTrick.winnerId;
    this.game.trick = [];

    const handsEmpty = this.game.players.every((p) => p.hand.length === 0);
    if (!handsEmpty) {
      this.game.activePlayerId = winnerId; // winner leads the next trick
      await this.save();
      this.broadcastState();
      return;
    }

    await this.endRound();
  }

  private async endRound() {
    const playerCount = this.game.players.length;
    for (const p of this.game.players) {
      p.backlog += p.made - p.toMake;
    }

    this.broadcastEvent({ kind: "roundOver", round: this.game.round });

    if (this.game.round >= TOTAL_ROUNDS) {
      this.game.phase = "matchEnd";
      this.game.activePlayerId = null;
      this.game.trumpChooserId = null;
      const champion = [...this.game.players].sort((a, b) => b.backlog - a.backlog)[0];
      await this.save();
      this.broadcastEvent({ kind: "matchOver", winnerName: champion.name });
      this.broadcastState();
      return;
    }

    for (const p of this.game.players) {
      p.made = 0;
      p.toMake = rotateTarget(p.toMake, playerCount);
    }

    this.game.round += 1;
    this.beginRound();
    await this.save();
    this.broadcastState();
  }

  /** Deal a fresh round and hand the trump call to the largest target. */
  private beginRound() {
    const playerCount = this.game.players.length;
    const hands = deal(shuffle(newDeck()), playerCount);
    this.game.players.forEach((p, seat) => {
      p.hand = hands[seat];
      p.made = 0;
    });

    const chooser = [...this.game.players].sort((a, b) => b.toMake - a.toMake)[0];
    this.game.phase = "trump";
    this.game.trumpSuit = null;
    this.game.trumpChooserId = chooser.id;
    this.game.activePlayerId = chooser.id;
    this.game.trick = [];
    this.game.lastTrick = null;
  }

  private async handleRematch(connection: Connection) {
    const player = this.requirePlayer(connection);
    if (!player) return;
    if (player.id !== this.game.hostId) {
      return this.sendError(connection, "Only the host can start a rematch.");
    }
    if (this.game.phase !== "matchEnd") {
      return this.sendError(connection, "The match is still going.");
    }

    const targets = handsToMake(this.game.players.length);
    this.game.players.forEach((p, seat) => {
      p.toMake = targets[seat];
      p.made = 0;
      p.backlog = 0;
    });
    this.game.round = 1;
    this.beginRound();
    await this.save();
    this.broadcastState();
  }

  private async handleChat(connection: Connection, text: string) {
    const player = this.requirePlayer(connection);
    if (!player) return;
    const body = String(text ?? "").trim().slice(0, MAX_CHAT_LENGTH);
    if (!body) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      playerId: player.id,
      name: player.name,
      text: body,
    };
    this.game.messages.push(message);
    if (this.game.messages.length > CHAT_HISTORY) {
      this.game.messages = this.game.messages.slice(-CHAT_HISTORY);
    }

    await this.save();
    this.broadcast(JSON.stringify({ t: "chat", message } satisfies ServerMessage));
  }

  // ------------------------------------------------------------------ helpers

  private playerIdFor(connection: Connection): string | null {
    const state = connection.state as { playerId?: string } | null;
    return state?.playerId ?? null;
  }

  private findPlayer(id: string): Player | null {
    return this.game.players.find((p) => p.id === id) ?? null;
  }

  private requirePlayer(connection: Connection): Player | null {
    const id = this.playerIdFor(connection);
    const player = id ? this.findPlayer(id) : null;
    if (!player) {
      this.sendError(connection, "You are not seated in this room.");
      return null;
    }
    return player;
  }

  private seatAfter(playerId: string): string {
    const seat = this.game.players.findIndex((p) => p.id === playerId);
    return this.game.players[(seat + 1) % this.game.players.length].id;
  }

  private sendError(connection: Connection, message: string) {
    connection.send(
      JSON.stringify({
        t: "event",
        event: { kind: "error", message },
      } satisfies ServerMessage),
    );
  }

  private broadcastEvent(event: GameEvent) {
    this.broadcast(JSON.stringify({ t: "event", event } satisfies ServerMessage));
  }

  /** Every player gets their own snapshot — hands are never cross-sent. */
  private broadcastState() {
    for (const connection of this.getConnections()) {
      const playerId = this.playerIdFor(connection);
      if (!playerId) continue;
      const state = this.stateFor(playerId);
      if (!state) continue;
      connection.send(
        JSON.stringify({ t: "state", state } satisfies ServerMessage),
      );
    }
  }

  private stateFor(playerId: string): ClientState | null {
    const me = this.findPlayer(playerId);
    if (!me) return null;

    const leadSuit = this.game.trick[0]?.card.suit ?? null;
    const myTurn =
      this.game.phase === "playing" && this.game.activePlayerId === me.id;

    const players: PublicPlayer[] = this.game.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      isHost: p.id === this.game.hostId,
      handCount: p.hand.length,
      toMake: p.toMake,
      made: p.made,
      backlog: p.backlog,
    }));

    return {
      roomId: this.name,
      phase: this.game.phase,
      round: this.game.round,
      totalRounds: TOTAL_ROUNDS,
      you: {
        id: me.id,
        name: me.name,
        hand: me.hand,
        isHost: me.id === this.game.hostId,
        legalCardIds: myTurn
          ? legalCards(me.hand, leadSuit).map((c) => c.id)
          : [],
      },
      players,
      trumpSuit: this.game.trumpSuit,
      trumpChooserId: this.game.trumpChooserId,
      activePlayerId: this.game.activePlayerId,
      trick: this.game.trick,
      leadSuit,
      lastTrick: this.game.lastTrick,
      messages: this.game.messages,
      standings:
        this.game.phase === "matchEnd"
          ? [...this.game.players]
              .sort((a, b) => b.backlog - a.backlog)
              .map((p) => ({ playerId: p.id, name: p.name, backlog: p.backlog }))
          : null,
    };
  }
}

interface Env {
  GameRoom: DurableObjectNamespace<GameRoom>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return Response.json({ status: "ok", service: "card-game-server" });
    }

    return (
      (await routePartykitRequest(request, env as never)) ??
      new Response("Not found", { status: 404 })
    );
  },
};
