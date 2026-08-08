export default function MatchEnd({ state, onRematch }) {
  const [champion] = state.standings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 px-5 backdrop-blur-sm">
      <div className="panel anim-rise w-full max-w-md p-6 sm:p-8">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-brass">
          After {state.totalRounds} rounds
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
          {champion.playerId === state.you.id ? "You win" : `${champion.name} wins`}
        </h2>
        <p className="mt-1.5 text-sm text-chalk-dim">
          Most tricks won above target across the match.
        </p>

        <ol className="mt-5 space-y-2">
          {state.standings.map((s, i) => (
            <li
              key={s.playerId}
              className="flex items-center gap-3 rounded-lg border border-ink-line bg-ink/50 px-3.5 py-2.5"
            >
              <span className="font-display text-sm font-bold tabular-nums text-chalk-dim">
                {i + 1}
              </span>
              <span className="font-display text-sm font-bold">{s.name}</span>
              <span
                className={`ml-auto font-display text-lg font-extrabold tabular-nums ${
                  s.backlog > 0
                    ? "text-marigold"
                    : s.backlog < 0
                      ? "text-madder"
                      : "text-chalk-dim"
                }`}
              >
                {s.backlog > 0 ? "+" : ""}
                {s.backlog}
              </span>
            </li>
          ))}
        </ol>

        {state.you.isHost ? (
          <button
            type="button"
            onClick={onRematch}
            className="btn btn-primary mt-6 w-full py-3"
          >
            Deal again
          </button>
        ) : (
          <p className="mt-6 text-center text-sm text-chalk-dim">
            Waiting for the host to deal again.
          </p>
        )}
      </div>
    </div>
  );
}
