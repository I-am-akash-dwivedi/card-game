export const SUIT_NAMES = {
  "♠": "Spades",
  "♥": "Hearts",
  "♦": "Diamonds",
  "♣": "Clubs",
};

export const isRed = (suit) => suit === "♥" || suit === "♦";

export function cardLabel(card) {
  return `${card.rank} of ${SUIT_NAMES[card.suit]}`;
}

export function CardFace({ card, className = "", style }) {
  return (
    <div
      className={`card-face ${isRed(card.suit) ? "card-red" : "card-black"} ${className}`}
      style={style}
    >
      <span className="card-corner">
        <span>{card.rank}</span>
        <span>{card.suit}</span>
      </span>
      <span className="card-pip">{card.suit}</span>
      <span className="card-corner card-corner-flipped">
        <span>{card.rank}</span>
        <span>{card.suit}</span>
      </span>
    </div>
  );
}

/** Fanned stack of backs standing in for an opponent's hidden hand. */
export function CardBackStack({ count, className = "" }) {
  const shown = Math.min(count, 6);
  return (
    <div
      className={`flex ${className}`}
      role="img"
      aria-label={`${count} cards in hand`}
    >
      {Array.from({ length: shown }, (_, i) => (
        <div
          key={i}
          className="card-back w-5 sm:w-6"
          style={{ marginLeft: i === 0 ? 0 : "-0.7rem" }}
        />
      ))}
      {count > shown && (
        <span className="ml-1.5 self-center text-[11px] tabular-nums text-chalk-dim">
          {count}
        </span>
      )}
    </div>
  );
}
