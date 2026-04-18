"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  calculateDuelXP,
  calculateDuelCoins,
  calculateCasualCoins,
} from "@/lib/game/economy";

export async function awardDuelResults(
  lobbyId: string,
  rank: number,
  correctAnswers: number = 0,
  totalQuestions: number = 10,
  matchesToday: number = 0,
  token?: string
) {
  const isWinner = rank === 1;
  const xpEarned = calculateDuelXP(isWinner, correctAnswers, totalQuestions, matchesToday);
  const coinsChange = calculateDuelCoins(isWinner);

  const opts = token ? { token } : {};

  const result = await fetchMutation(
    api.game.awardGameResults,
    {
      lobbyId: lobbyId as Id<"game_lobbies">,
      xp_earned: xpEarned,
      coins_change: coinsChange,
    },
    opts
  );

  if (result.alreadyAwarded) return { error: "Already awarded" };
  return { success: true, xpEarned, coinsChange };
}

export async function awardCasualResults(
  lobbyId: string,
  isWinner: boolean,
  token?: string
) {
  const coinsChange = calculateCasualCoins(isWinner);
  const opts = token ? { token } : {};

  const result = await fetchMutation(
    api.game.awardGameResults,
    {
      lobbyId: lobbyId as Id<"game_lobbies">,
      xp_earned: 0,
      coins_change: coinsChange,
    },
    opts
  );

  if (result.alreadyAwarded) return { error: "Already awarded" };
  return { success: true, coinsChange };
}

export async function deductEntryFee(
  lobbyId: string,
  fee: number = 10,
  token?: string
) {
  const opts = token ? { token } : {};
  try {
    await fetchMutation(
      api.game.deductEntryFee,
      {
        lobbyId: lobbyId as Id<"game_lobbies">,
        fee,
      },
      opts
    );
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Insufficient coins")) {
      return { error: "Not enough coins", insufficientFunds: true };
    }
    return { error: msg };
  }
}

export async function fetchEconomyBalance(token?: string) {
  const opts = token ? { token } : {};
  try {
    const user = await fetchQuery(api.users.getMe, {}, opts);
    return { coins: user?.total_coins ?? 500 };
  } catch {
    return { coins: 500 };
  }
}
