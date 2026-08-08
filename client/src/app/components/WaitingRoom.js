"use client";

import { useState } from "react";

export default function WaitingRoom({ state, onStart }) {
  const [copied, setCopied] = useState("");

  const copy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("");
    }
  };

  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/?room=${state.roomId}`;

  const canStart = state.you.isHost && state.players.length >= 2;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.25rem)] max-w-2xl flex-col justify-center px-5 py-10">
      <div className="panel anim-rise p-6 sm:p-8">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-brass">
          Table open
        </p>

        <button
          type="button"
          onClick={() => copy("code", state.roomId)}
          className="mt-3 block font-display text-5xl font-extrabold tracking-[0.18em] text-marigold transition-opacity hover:opacity-80 sm:text-6xl"
          aria-label={`Room code ${state.roomId.split("").join(" ")}. Copy.`}
        >
          {state.roomId}
        </button>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy("code", state.roomId)}
            className="btn btn-ghost px-3 py-1.5 text-xs"
          >
            {copied === "code" ? "Code copied" : "Copy code"}
          </button>
          <button
            type="button"
            onClick={() => copy("link", shareUrl)}
            className="btn btn-ghost px-3 py-1.5 text-xs"
          >
            {copied === "link" ? "Link copied" : "Copy invite link"}
          </button>
        </div>

        <div className="rule-brass my-6" />

        <h2 className="font-display text-sm font-bold tracking-tight">
          Seated ({state.players.length} of 3)
        </h2>
        <ul className="mt-3 space-y-2">
          {state.players.map((p) => (
            <li
              key={p.id}
              className="anim-rise flex items-center gap-2.5 rounded-lg border border-ink-line bg-ink/50 px-3.5 py-2.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
              <span className="font-display text-sm font-bold">{p.name}</span>
              {p.isHost && (
                <span className="text-[10px] uppercase tracking-wider text-brass">
                  host
                </span>
              )}
              {p.id === state.you.id && (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-chalk-dim">
                  you
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {state.you.isHost ? (
            <>
              <button
                type="button"
                onClick={onStart}
                disabled={!canStart}
                className="btn btn-primary w-full py-3"
              >
                Deal the first round
              </button>
              {!canStart && (
                <p className="mt-2 text-center text-xs text-chalk-dim">
                  One more player needed before you can deal.
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-sm text-chalk-dim">
              Waiting for the host to deal.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
