"use client";

import PartySocket from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";

const PARTY_HOST =
  process.env.NEXT_PUBLIC_PARTY_HOST || "127.0.0.1:8787";

/** Unambiguous alphabet — no O/0, I/1, so codes survive being read aloud. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeRoomCode(length = 5) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export const seatKey = (roomId) => `tdp:seat:${roomId}`;

/**
 * Owns the single connection to a room. The server is authoritative, so this
 * hook only ships intent upward and mirrors the snapshots that come back —
 * it never derives game state itself.
 */
export function useGame({ roomId, name, enabled }) {
  const [status, setStatus] = useState("idle");
  const [state, setState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);

  const socketRef = useRef(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  const pushToast = useCallback((tone, text) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-3), { id, tone, text }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      tone === "bad" ? 4200 : 2800,
    );
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!enabled || !roomId || !name) return;

    setStatus("connecting");
    const socket = new PartySocket({
      host: PARTY_HOST,
      party: "game-room",
      room: roomId,
    });
    socketRef.current = socket;

    const onOpen = () => {
      setStatus("connected");
      // Replayed on every open, so an automatic reconnect reclaims the seat
      // (and the private hand) rather than starting a new one.
      socket.send(
        JSON.stringify({
          t: "join",
          name: nameRef.current,
          playerId: localStorage.getItem(seatKey(roomId)) || undefined,
        }),
      );
    };

    const onClose = () => setStatus("reconnecting");
    const onError = () => setStatus("reconnecting");

    const onMessage = (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.data);
      } catch {
        return;
      }

      if (msg.t === "welcome" && msg.playerId) {
        localStorage.setItem(seatKey(roomId), msg.playerId);
        return;
      }

      if (msg.t === "state") {
        setState(msg.state);
        localStorage.setItem(seatKey(roomId), msg.state.you.id);
        // Snapshots carry the authoritative history; only accept it when it is
        // longer than what we have, so a stale snapshot cannot drop live chat.
        setMessages((prev) =>
          msg.state.messages.length >= prev.length ? msg.state.messages : prev,
        );
        return;
      }

      if (msg.t === "chat") {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.message.id) ? prev : [...prev, msg.message],
        );
        return;
      }

      if (msg.t === "event") {
        setLastEvent({ ...msg.event, at: Date.now() });
        const e = msg.event;
        if (e.kind === "error") pushToast("bad", e.message);
        if (e.kind === "playerJoined") pushToast("good", `${e.name} sat down`);
        if (e.kind === "playerLeft") pushToast("info", `${e.name} left`);
        if (e.kind === "playerRejoined") pushToast("info", `${e.name} is back`);
        if (e.kind === "trumpChosen")
          pushToast("good", `${e.byName} called ${e.suit} as trump`);
        if (e.kind === "trickWon") pushToast("info", `${e.winnerName} takes it`);
        if (e.kind === "roundOver") pushToast("good", `Round ${e.round} done`);
      }
    };

    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("message", onMessage);
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, name, enabled, pushToast]);

  const send = useCallback((payload) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  const actions = {
    start: useCallback(() => send({ t: "start" }), [send]),
    chooseTrump: useCallback((suit) => send({ t: "trump", suit }), [send]),
    playCard: useCallback((cardId) => send({ t: "play", cardId }), [send]),
    sendChat: useCallback((text) => send({ t: "chat", text }), [send]),
    rematch: useCallback(() => send({ t: "rematch" }), [send]),
  };

  return { status, state, messages, toasts, dismissToast, lastEvent, actions };
}
