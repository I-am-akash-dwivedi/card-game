import { CardFace, cardLabel } from "./Card";

export default function Hand({ hand, legalCardIds, yourTurn, onPlay, dealKey }) {
  const legal = new Set(legalCardIds);

  return (
    // Remounting on each deal replays the stagger; within a round the cards
    // keep their identity so nothing re-animates on an unrelated update.
    <div className="hand" key={dealKey}>
      {hand.map((card, i) => {
        const playable = yourTurn && legal.has(card.id);
        const blocked = yourTurn && !playable;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => playable && onPlay(card.id)}
            disabled={!playable}
            style={{ "--i": i, "--n": hand.length }}
            className={`hand-card anim-deal rounded-[10px] ${
              playable ? "hand-card-playable" : ""
            } ${blocked ? "hand-card-blocked" : ""}`}
            aria-label={
              blocked
                ? `${cardLabel(card)} — cannot be played, you must follow suit`
                : cardLabel(card)
            }
          >
            <CardFace card={card} />
          </button>
        );
      })}
    </div>
  );
}
