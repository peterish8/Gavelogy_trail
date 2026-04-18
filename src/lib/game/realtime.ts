"use client";
// Convex reactive queries replace Supabase Realtime channels.
// Components use useQuery(api.game.getPlayers, { lobbyId }) and
// useQuery(api.game.getGameEvents, { lobbyId }) directly — no channel setup needed.
// This file provides a compatibility hook for components that previously called
// subscribeToLobby / unsubscribeFromLobby.

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useGameStore } from "@/lib/stores/game-store";

/**
 * Reactive game lobby hook — replaces subscribeToLobby().
 * Uses Convex's built-in reactivity: no channel, no cleanup needed.
 * Drop this into any component that previously called subscribeToLobby.
 */
export function useLobbySync(lobbyId: Id<"game_lobbies"> | null) {
  const players = useQuery(
    api.game.getPlayers,
    lobbyId ? { lobbyId } : "skip"
  );
  const events = useQuery(
    api.game.getGameEvents,
    lobbyId ? { lobbyId } : "skip"
  );
  const lobby = useQuery(
    api.game.getLobby,
    lobbyId ? { lobbyId } : "skip"
  );

  const store = useGameStore();

  useEffect(() => {
    if (players) {
      players.forEach((p) => store.addPlayer(p));
    }
  }, [players]);

  useEffect(() => {
    if (lobby?.status) {
      store.setStatus(lobby.status);
    }
  }, [lobby?.status]);

  useEffect(() => {
    if (!events?.length) return;
    const latest = events[0];
    if (!latest) return;

    if (latest.event_type === "answer_submitted") {
      const { playerId, questionId } = latest.payload as Record<string, string>;
      if (playerId) {
        store.updatePlayerProgress(playerId, { currentQuestion: undefined, score: undefined });
      }
    }
    if (latest.event_type === "game_finished") {
      store.setStatus("finished");
    }
  }, [events?.[0]?._id]);

  return { lobby, players, events };
}

// Legacy no-ops kept for call-site compatibility during migration.
// Remove after all callers are updated to use useLobbySync.
export const subscribeToLobby = (_lobbyId: string) => {
  console.warn("subscribeToLobby is deprecated; use useLobbySync hook instead");
  return null;
};

export const unsubscribeFromLobby = (_channel: unknown) => {};
