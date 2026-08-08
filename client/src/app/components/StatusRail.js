import Link from "next/link";

const STATUS = {
  connecting: { text: "Connecting", tone: "text-marigold" },
  reconnecting: { text: "Reconnecting", tone: "text-marigold" },
  connected: { text: "Live", tone: "text-chalk-dim" },
  idle: { text: "Offline", tone: "text-chalk-dim" },
};

export default function StatusRail({ status, round, totalRounds, roomId }) {
  const s = STATUS[status] ?? STATUS.idle;
  const pending = status === "connecting" || status === "reconnecting";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-line/70 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link
          href="/"
          className="font-display text-sm font-extrabold tracking-tight text-chalk"
        >
          Teen&nbsp;Do&nbsp;Paanch
        </Link>

        <div className="flex items-center gap-3 text-xs">
          {roomId && (
            <span className="hidden tabular-nums text-chalk-dim sm:inline">
              Room <span className="text-chalk">{roomId}</span>
            </span>
          )}
          {round > 0 && (
            <span className="tabular-nums text-chalk-dim">
              Round <span className="text-chalk">{round}</span>/{totalRounds}
            </span>
          )}
          <Link
            href="/how-to-play"
            className="text-chalk-dim underline decoration-brass/50 underline-offset-4 hover:text-chalk"
          >
            Rules
          </Link>
          <span className={`flex items-center gap-1.5 ${s.tone}`}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                pending ? "animate-pulse bg-marigold" : "bg-brass"
              }`}
            />
            {s.text}
          </span>
        </div>
      </div>
    </header>
  );
}
