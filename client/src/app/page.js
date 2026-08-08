"use client";

import { useEffect, useMemo, useState } from "react";

import Chat from "./components/Chat";
import Hand from "./components/Hand";
import Lobby from "./components/Lobby";
import MatchEnd from "./components/MatchEnd";
import Seat from "./components/Seat";
import StatusRail from "./components/StatusRail";
import Toasts from "./components/Toasts";
import Trick from "./components/Trick";
import TrumpPicker from "./components/TrumpPicker";
import TrumpStamp from "./components/TrumpStamp";
import WaitingRoom from "./components/WaitingRoom";
import { makeRoomCode, seatKey, useGame } from "./lib/useGame";

const NAME_KEY = "tdp:name";

export default function Home() {
  const [session, setSession] = useState(null); // { name, roomId }
  const [storedName, setStoredName] = useState("");
  const [prefilledRoom, setPrefilledRoom] = useState("");

  // Invite links arrive as /?room=CODE. Read once on mount rather than through
  // useSearchParams, which would force this whole tree into a Suspense boundary.
  useEffect(() => {
    const name = localStorage.getItem(NAME_KEY) ?? "";
    setStoredName(name);

    const room = new URLSearchParams(window.location.search).get("room");
    if (!room) return;
    const code = room.toUpperCase();
    setPrefilledRoom(code);

    // A stored seat means this browser was already playing here, so a refresh
    // should drop straight back in. A bare invite link still asks for a name.
    if (name && localStorage.getItem(seatKey(code))) {
      setSession({ name, roomId: code });
    }
  }, []);

  const enter = (name, roomId) => {
    localStorage.setItem(NAME_KEY, name);
    setSession({ name, roomId });
    window.history.replaceState({}, "", `/?room=${roomId}`);
  };

  const { status, state, messages, toasts, dismissToast, actions } = useGame({
    roomId: session?.roomId,
    name: session?.name,
    enabled: Boolean(session),
  });

  const playerName = useMemo(() => {
    const byId = new Map((state?.players ?? []).map((p) => [p.id, p.name]));
    return (id) => byId.get(id) ?? "—";
  }, [state?.players]);

  if (!session) {
    return (
      <>
        <StatusRail status="idle" round={0} />
        <Lobby
          initialName={storedName}
          initialCode={prefilledRoom}
          onCreate={(name) => enter(name, makeRoomCode())}
          onJoin={(name, code) => enter(name, code)}
        />
        <Toasts toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <StatusRail
        status={status}
        round={state?.round ?? 0}
        totalRounds={state?.totalRounds ?? 6}
        roomId={session.roomId}
      />

      {!state ? (
        <main className="flex min-h-[60vh] items-center justify-center px-5">
          <p className="text-sm text-chalk-dim">
            {status === "reconnecting"
              ? "Connection dropped. Getting you back to the table…"
              : "Taking your seat…"}
          </p>
        </main>
      ) : state.phase === "lobby" ? (
        <WaitingRoom state={state} onStart={actions.start} />
      ) : (
        <Table
          state={state}
          playerName={playerName}
          onPlay={actions.playCard}
          onChooseTrump={actions.chooseTrump}
        />
      )}

      {state && state.phase !== "lobby" && (
        <Chat messages={messages} youId={state.you.id} onSend={actions.sendChat} />
      )}

      {state?.phase === "matchEnd" && (
        <MatchEnd state={state} onRematch={actions.rematch} />
      )}

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function Table({ state, playerName, onPlay, onChooseTrump }) {
  const you = state.players.find((p) => p.id === state.you.id);
  const opponents = state.players.filter((p) => p.id !== state.you.id);
  const yourTurn = state.activePlayerId === state.you.id;
  const youChooseTrump =
    state.phase === "trump" && state.trumpChooserId === state.you.id;

  const hint = (() => {
    if (state.phase === "trump") {
      return youChooseTrump
        ? "Pick the suit that will beat everything this round."
        : `Waiting for ${playerName(state.trumpChooserId)} to call trump.`;
    }
    if (yourTurn) return "Your lead — choose a card.";
    return `Waiting for ${playerName(state.activePlayerId)}.`;
  })();

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.25rem)] max-w-6xl flex-col px-4 pb-3 pt-4">
      <div className="flex flex-wrap items-start justify-center gap-3">
        {opponents.map((p) => (
          <Seat
            key={p.id}
            player={p}
            isActive={state.activePlayerId === p.id}
            isTrumpChooser={state.phase === "trump" && state.trumpChooserId === p.id}
          />
        ))}
      </div>

      {/* Centre of the table takes whatever height is left over, so the hand
          always sits on the bottom edge regardless of viewport. */}
      <div className="relative flex flex-1 items-center justify-center py-4">
        {state.trumpSuit && (
          <div className="pointer-events-none absolute right-0 top-0 opacity-95">
            <TrumpStamp
              suit={state.trumpSuit}
              size={72}
              key={`${state.round}-${state.trumpSuit}`}
            />
          </div>
        )}

        {youChooseTrump ? (
          <TrumpPicker onChoose={onChooseTrump} hand={state.you.hand} />
        ) : (
          <Trick
            trick={state.trick}
            lastTrick={state.lastTrick}
            youId={state.you.id}
            playerName={playerName}
            hint={hint}
          />
        )}
      </div>

      <div className="mt-auto">
        <div className="mb-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          <span className="font-display font-bold tracking-tight">
            {state.you.name}
          </span>
          <span className="tabular-nums text-chalk-dim">
            <span className="text-chalk">{you.made}</span> of {you.toMake} tricks
          </span>
          <span
            className={`tabular-nums ${
              you.backlog > 0
                ? "text-marigold"
                : you.backlog < 0
                  ? "text-madder"
                  : "text-chalk-dim"
            }`}
          >
            {you.backlog > 0 ? "+" : ""}
            {you.backlog}
          </span>
          {yourTurn && state.phase === "playing" && (
            <span className="font-display font-bold text-marigold">your turn</span>
          )}
        </div>

        <Hand
          hand={state.you.hand}
          legalCardIds={state.you.legalCardIds}
          yourTurn={yourTurn && state.phase === "playing"}
          onPlay={onPlay}
          dealKey={state.round}
        />
      </div>
    </main>
  );
}
