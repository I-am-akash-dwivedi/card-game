const TONE = {
  good: "border-marigold/50 text-marigold",
  bad: "border-madder/60 text-madder",
  info: "border-ink-line text-chalk",
};

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`anim-rise pointer-events-auto max-w-sm rounded-lg border bg-ink-raised/95 px-3.5 py-2 text-sm shadow-lifted backdrop-blur ${TONE[toast.tone]}`}
        >
          {toast.text}
        </button>
      ))}
    </div>
  );
}
