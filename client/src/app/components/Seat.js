import { CardBackStack } from "./Card";

/** One opponent around the table. Never renders card faces — only counts. */
export default function Seat({ player, isActive, isTrumpChooser }) {
  const delta = player.made - player.toMake;

  return (
    <div
      className={`panel min-w-[9.5rem] px-3.5 py-2.5 ${isActive ? "anim-turn" : ""}`}
      style={isActive ? { borderColor: "rgba(242,169,59,.55)" } : undefined}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-sm font-bold tracking-tight">
          {player.name}
        </span>
        {!player.connected && (
          <span className="text-[10px] uppercase tracking-wider text-madder">
            away
          </span>
        )}
        {player.connected && isTrumpChooser && (
          <span className="text-[10px] uppercase tracking-wider text-marigold">
            calls
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs tabular-nums text-chalk-dim">
        <span>
          <span className="text-chalk">{player.made}</span> of {player.toMake}
        </span>
        <span className="text-ink-line">|</span>
        <span
          className={
            player.backlog > 0
              ? "text-marigold"
              : player.backlog < 0
                ? "text-madder"
                : ""
          }
        >
          {player.backlog > 0 ? "+" : ""}
          {player.backlog}
        </span>
      </div>

      <CardBackStack count={player.handCount} className="mt-2" />

      {delta >= 0 && player.toMake > 0 && (
        <div className="mt-1.5 text-[10px] uppercase tracking-wider text-marigold">
          target met
        </div>
      )}
    </div>
  );
}
