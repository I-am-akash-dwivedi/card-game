import { isRed, SUIT_NAMES } from "./Card";

const SUITS = ["♠", "♥", "♦", "♣"];

export default function TrumpPicker({ onChoose, hand }) {
  // Count what you hold in each suit — the one decision aid the table gives you.
  const counts = hand.reduce((acc, card) => {
    acc[card.suit] = (acc[card.suit] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="anim-rise panel mx-auto max-w-lg p-5">
      <h2 className="text-center font-display text-lg font-bold tracking-tight">
        Call the trump
      </h2>
      <p className="mt-1 text-center text-sm text-chalk-dim">
        It beats every other suit this round — and you lead the first trick.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {SUITS.map((suit) => (
          <button
            key={suit}
            type="button"
            onClick={() => onChoose(suit)}
            className={`btn flex flex-col items-center gap-0.5 border border-ink-line bg-ink/60 py-3 hover:border-marigold ${
              isRed(suit) ? "text-madder" : "text-chalk"
            }`}
            aria-label={`Call ${SUIT_NAMES[suit]} as trump — you hold ${counts[suit] ?? 0}`}
          >
            <span className="text-3xl leading-none">{suit}</span>
            <span className="text-[10px] uppercase tracking-wider text-chalk-dim">
              you hold {counts[suit] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
