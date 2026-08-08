import { CardFace } from "./Card";

/**
 * The centre of the table. Cards land as they are played, then sweep toward
 * whoever took the trick once the server resolves it.
 */
export default function Trick({ trick, lastTrick, youId, playerName, hint }) {
  // Only sweep when `lastTrick` actually describes the cards on the table.
  // A stale result must never animate an incoming card out of view.
  const sweeping =
    Boolean(lastTrick) && lastTrick.cards.length === trick.length;
  const sweptToYou = lastTrick?.winnerId === youId;

  return (
    <div className="flex min-h-[8.5rem] flex-col items-center justify-center gap-3 sm:min-h-[11rem]">
      {trick.length === 0 ? (
        <p className="max-w-[22rem] text-center text-sm text-chalk-dim">{hint}</p>
      ) : (
        <>
          <div className="flex items-start justify-center gap-2 sm:gap-3">
            {trick.map((played, i) => (
              <div
                key={played.card.id}
                className={`w-[3.6rem] sm:w-[4.4rem] ${sweeping ? "anim-sweep" : "anim-land"}`}
                style={{
                  "--land-tilt": `${(i - (trick.length - 1) / 2) * 5}deg`,
                  "--sweep-y": sweptToYou ? "84px" : "-84px",
                  "--sweep-x": `${(i - (trick.length - 1) / 2) * -18}px`,
                  animationDelay: sweeping ? `${i * 40}ms` : undefined,
                }}
              >
                <CardFace card={played.card} />
                <p className="mt-1.5 truncate text-center text-[10px] uppercase tracking-wider text-chalk-dim">
                  {playerName(played.playerId)}
                </p>
              </div>
            ))}
          </div>

          {lastTrick && (
            <p className="anim-rise font-display text-sm font-bold text-marigold">
              {sweptToYou ? "You take it" : `${lastTrick.winnerName} takes it`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
