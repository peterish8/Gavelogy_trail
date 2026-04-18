"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchGameQuestions } from "./questions";
import { deductEntryFee } from "./rewards";
import { getCasualEntryFee } from "@/lib/game/economy";

export async function createLobby(
  mode: "duel" | "arena" | "tagteam" | "speed_court",
  displayName: string,
  avatarUrl?: string,
  token?: string
) {
  const opts = token ? { token } : {};

  const result = await fetchMutation(
    api.game.createLobby,
    {
      mode,
      question_ids: [],
      max_rounds: mode === "duel" ? 1 : mode === "arena" ? 4 : 1,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    opts
  );

  return { success: true, lobbyId: result.lobbyId, playerId: result.playerId };
}

export async function joinLobby(
  lobbyId: string,
  displayName: string,
  avatarUrl?: string,
  token?: string
) {
  const opts = token ? { token } : {};

  const lobby = await fetchQuery(
    api.game.getLobby,
    { lobbyId: lobbyId as Id<"game_lobbies"> },
    opts
  );

  if (!lobby || lobby.status !== "waiting") {
    return { error: "Lobby is not available" };
  }

  const playerId = await fetchMutation(
    api.game.joinLobby,
    {
      lobbyId: lobbyId as Id<"game_lobbies">,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    opts
  );

  return { success: true, playerId };
}

export async function startGame(lobbyId: string, token?: string) {
  const opts = token ? { token } : {};
  await fetchMutation(
    api.game.startGame,
    { lobbyId: lobbyId as Id<"game_lobbies"> },
    opts
  );
  return { success: true };
}
