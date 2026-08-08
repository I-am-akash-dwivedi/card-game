/**
 * Wire protocol shared between the Worker and the Next.js client.
 *
 * The server is authoritative: clients send *intent* (`ClientMessage`) and
 * receive *snapshots* (`ServerMessage`). A client never computes game state.
 */

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | "J" | "Q" | "K" | "A";

export interface Card {
  /** Stable unique id within a deck, e.g. "♠A". Used for React keys + animation. */
  id: string;
  suit: Suit;
  rank: Rank;
}

export type Phase = "lobby" | "trump" | "playing" | "roundEnd" | "matchEnd";

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
}

/** What everyone is allowed to know about a player. Never includes their hand. */
export interface PublicPlayer {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
  /** Number of cards held — enough to render a fanned card-back stack. */
  handCount: number;
  toMake: number;
  made: number;
  backlog: number;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
}

export interface TrickResult {
  winnerId: string;
  winnerName: string;
  cards: PlayedCard[];
}

/** The personalised snapshot one specific player receives. */
export interface ClientState {
  roomId: string;
  phase: Phase;
  round: number;
  totalRounds: number;

  /** The recipient's own private data. */
  you: {
    id: string;
    name: string;
    hand: Card[];
    isHost: boolean;
    /** Card ids the recipient may legally play right now. Server-computed. */
    legalCardIds: string[];
  };

  players: PublicPlayer[];
  trumpSuit: Suit | null;
  /** Who picks trump this round (also leads the first trick). */
  trumpChooserId: string | null;
  activePlayerId: string | null;

  trick: PlayedCard[];
  leadSuit: Suit | null;
  /** Kept on screen briefly after a trick resolves so the win can be animated. */
  lastTrick: TrickResult | null;

  messages: ChatMessage[];
  /** Ranked standings, only populated at `matchEnd`. */
  standings: { playerId: string; name: string; backlog: number }[] | null;
}

export type ClientMessage =
  | { t: "join"; name: string; playerId?: string }
  | { t: "start" }
  | { t: "trump"; suit: Suit }
  | { t: "play"; cardId: string }
  | { t: "chat"; text: string }
  | { t: "rematch" };

export type GameEvent =
  | { kind: "playerJoined"; name: string }
  | { kind: "playerLeft"; name: string }
  | { kind: "playerRejoined"; name: string }
  | { kind: "trickWon"; winnerId: string; winnerName: string }
  | { kind: "roundOver"; round: number }
  | { kind: "matchOver"; winnerName: string }
  | { kind: "trumpChosen"; suit: Suit; byName: string }
  | { kind: "error"; message: string };

export type ServerMessage =
  | { t: "welcome"; playerId: string }
  | { t: "state"; state: ClientState }
  | { t: "event"; event: GameEvent }
  | { t: "chat"; message: ChatMessage };
