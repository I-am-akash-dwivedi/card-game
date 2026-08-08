"use client";

import { useEffect, useRef, useState } from "react";

const REACTIONS = ["😄", "😂", "🥳", "😱", "👏", "👀", "🫣", "😭"];

export default function Chat({ messages, youId, onSend }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [seen, setSeen] = useState(0);
  const scrollRef = useRef(null);

  const unread = Math.max(0, messages.length - seen);

  useEffect(() => {
    if (open) setSeen(messages.length);
  }, [open, messages.length]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  const submit = (text) => {
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setDraft("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="panel anim-rise flex h-[22rem] w-[min(21rem,calc(100vw-2rem))] flex-col p-3">
          <div
            ref={scrollRef}
            className="flex-1 space-y-1.5 overflow-y-auto pr-1"
          >
            {messages.length === 0 ? (
              <p className="pt-10 text-center text-sm text-chalk-dim">
                Say something to the table.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.playerId === youId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                  >
                    <span className="px-1 text-[10px] uppercase tracking-wider text-chalk-dim">
                      {mine ? "you" : m.name}
                    </span>
                    <span
                      className={`max-w-[85%] break-words rounded-lg px-3 py-1.5 text-sm ${
                        mine
                          ? "bg-marigold text-ink"
                          : "border border-ink-line bg-ink/70 text-chalk"
                      }`}
                    >
                      {m.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-0.5">
            {REACTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => submit(r)}
                className="rounded px-1.5 py-0.5 text-lg transition-transform hover:scale-125"
                aria-label={`Send ${r}`}
              >
                {r}
              </button>
            ))}
          </div>

          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={280}
              placeholder="Message"
              aria-label="Message the table"
              className="min-w-0 flex-1 rounded-lg border border-ink-line bg-ink/70 px-3 py-2 text-sm text-chalk placeholder:text-chalk-dim/60 focus:border-marigold focus:outline-none"
            />
            <button type="submit" className="btn btn-primary px-3.5 text-sm">
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost relative bg-ink-raised px-4 py-2 text-sm"
        aria-expanded={open}
      >
        {open ? "Close chat" : "Chat"}
        {!open && unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-madder px-1 text-[11px] font-bold tabular-nums text-chalk">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
