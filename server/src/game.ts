/**
 * Pure game rules for 3-2-5 / 7-8. No I/O, no Durable Object concerns —
 * everything here is a plain function over plain data so it stays testable.
 */

import type { Card, PlayedCard, Rank, Suit } from "./protocol";

export const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
export const SUIT_NAMES: Record<Suit, string> = {
  "♠": "Spades",
  "♥": "Hearts",
  "♦": "Diamonds",
  "♣": "Clubs",
};

const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];

const RANK_VALUE: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14,
};

export function cardValue(card: Card): number {
  return RANK_VALUE[String(card.rank)];
}

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}${rank}`, suit, rank });
    }
  }
  return deck;
}

/** Fisher-Yates using the Workers crypto RNG rather than Math.random. */
export function shuffle<T>(input: T[]): T[] {
  const deck = [...input];
  const rand = new Uint32Array(deck.length);
  crypto.getRandomValues(rand);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rand[i] % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Tricks each seat must win, in seat order. Seat 0 always draws the largest
 * target, which is also what makes seat 0 the first trump chooser.
 */
export function handsToMake(playerCount: number): number[] {
  if (playerCount === 2) return [8, 7];
  if (playerCount === 3) return [5, 2, 3];
  throw new Error(`Unsupported player count: ${playerCount}`);
}

/**
 * Deal in chunks, matching the traditional deal: every player receives the
 * first chunk size, then the second, and so on. Total dealt is always 30.
 */
export function deal(deck: Card[], playerCount: number): Card[][] {
  const chunks = handsToMake(playerCount);
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let cursor = 0;
  for (const chunk of chunks) {
    for (let seat = 0; seat < playerCount; seat++) {
      hands[seat].push(...deck.slice(cursor, cursor + chunk));
      cursor += chunk;
    }
  }
  return hands.map(sortHand);
}

/** Group by suit, ascending by value within each suit — a readable hand. */
export function sortHand(cards: Card[]): Card[] {
  const order = new Map(SUITS.map((s, i) => [s, i]));
  return [...cards].sort((a, b) => {
    const suitDelta = order.get(a.suit)! - order.get(b.suit)!;
    return suitDelta !== 0 ? suitDelta : cardValue(a) - cardValue(b);
  });
}

/**
 * Highest trump wins; with no trump played, the highest card of the lead suit
 * wins. Cards of neither suit can never win.
 */
export function resolveTrick(
  trick: PlayedCard[],
  trumpSuit: Suit | null,
): PlayedCard {
  if (trick.length === 0) throw new Error("Cannot resolve an empty trick");
  const leadSuit = trick[0].card.suit;
  const trumps = trumpSuit
    ? trick.filter((p) => p.card.suit === trumpSuit)
    : [];
  const contenders = trumps.length > 0
    ? trumps
    : trick.filter((p) => p.card.suit === leadSuit);

  return contenders.reduce((best, p) =>
    cardValue(p.card) > cardValue(best.card) ? p : best,
  );
}

/**
 * Follow suit when able; otherwise anything goes (including trumping in).
 * Returned to the client so it never has to re-implement this rule.
 */
export function legalCards(hand: Card[], leadSuit: Suit | null): Card[] {
  if (!leadSuit) return hand;
  const following = hand.filter((c) => c.suit === leadSuit);
  return following.length > 0 ? following : hand;
}

/**
 * Rotate targets between rounds: 8→7→8 for two players,
 * 5→2→3→5 for three. Mirrors the how-to-play description.
 */
export function rotateTarget(current: number, playerCount: number): number {
  const targets = handsToMake(playerCount);
  const index = targets.indexOf(current);
  if (index === -1) return targets[0];
  return targets[(index + 1) % targets.length];
}
