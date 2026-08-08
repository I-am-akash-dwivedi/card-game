"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Landing screen. The hero is the game's own arithmetic — the targets that
 * give it its name and drive every round — rather than a generic headline.
 */
export default function Lobby({ initialName, initialCode, onCreate, onJoin }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // Both arrive after mount (localStorage / query string), so adopt them once
  // without clobbering anything the player has already typed.
  useEffect(() => {
    if (initialName) setName((v) => v || initialName);
  }, [initialName]);

  useEffect(() => {
    if (initialCode) setCode((v) => v || initialCode);
  }, [initialCode]);

  const requireName = () => {
    if (name.trim()) return true;
    setError("Enter a name so the table knows who you are.");
    return false;
  };

  const create = (e) => {
    e.preventDefault();
    if (requireName()) onCreate(name.trim());
  };

  const join = (e) => {
    e.preventDefault();
    if (!requireName()) return;
    if (!code.trim()) return setError("Enter the code your host shared.");
    onJoin(name.trim(), code.trim().toUpperCase());
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.25rem)] max-w-5xl flex-col justify-center px-5 py-10">
      <div className="anim-rise">
        <p className="font-display text-xs uppercase tracking-[0.32em] text-brass">
          Trick-taking · 2 to 3 players
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
          Teen Do Paanch
        </h1>

        <div className="mt-7 flex items-end gap-2.5 sm:gap-4">
          {[5, 2, 3].map((n, i) => (
            <div
              key={n}
              className="anim-rise flex h-[4.5rem] w-[3.4rem] items-center justify-center rounded-xl border border-brass/40 bg-ink-raised/70 font-display text-4xl font-extrabold text-marigold sm:h-24 sm:w-20 sm:text-5xl"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              {n}
            </div>
          ))}
          <p className="mb-1 max-w-[15rem] text-sm leading-snug text-chalk-dim">
            Win <span className="text-chalk">exactly</span> your number of tricks.
            Next round the numbers move on.
          </p>
        </div>

        <p className="mt-4 text-sm text-chalk-dim">
          Two at the table? You play the <span className="text-chalk">8-7</span>{" "}
          variant instead.{" "}
          <Link
            href="/how-to-play"
            className="text-marigold underline decoration-marigold/40 underline-offset-4"
          >
            Read the rules
          </Link>
        </p>
      </div>

      <div className="rule-brass my-9" />

      <div className="anim-rise grid gap-5 sm:grid-cols-2" style={{ animationDelay: "220ms" }}>
        <form onSubmit={create} className="panel p-5">
          <label
            htmlFor="player-name"
            className="font-display text-sm font-bold tracking-tight"
          >
            Your name
          </label>
          <input
            id="player-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            maxLength={20}
            placeholder="e.g. Akash"
            autoComplete="nickname"
            className="mt-2 w-full rounded-lg border border-ink-line bg-ink/70 px-3.5 py-2.5 text-chalk placeholder:text-chalk-dim/60 focus:border-marigold focus:outline-none"
          />
          <button type="submit" className="btn btn-primary mt-3.5 w-full py-2.5">
            Deal a new table
          </button>
          <p className="mt-2 text-xs text-chalk-dim">
            You get a code to share. Nothing to install.
          </p>
        </form>

        <form onSubmit={join} className="panel p-5">
          <label
            htmlFor="room-code"
            className="font-display text-sm font-bold tracking-tight"
          >
            Join a table
          </label>
          <input
            id="room-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            maxLength={8}
            placeholder="ROOM CODE"
            autoCapitalize="characters"
            spellCheck={false}
            className="mt-2 w-full rounded-lg border border-ink-line bg-ink/70 px-3.5 py-2.5 font-display text-lg tracking-[0.3em] text-chalk placeholder:text-sm placeholder:tracking-normal placeholder:text-chalk-dim/60 focus:border-marigold focus:outline-none"
          />
          <button type="submit" className="btn btn-ghost mt-3.5 w-full py-2.5">
            Take a seat
          </button>
          <p className="mt-2 text-xs text-chalk-dim">
            Ask your host for the five-character code.
          </p>
        </form>
      </div>

      {error && (
        <p className="anim-rise mt-4 text-sm text-madder" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
