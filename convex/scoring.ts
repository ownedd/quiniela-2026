import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): number {
  const exactMatch = predHome === realHome && predAway === realAway;
  if (exactMatch) return 3;

  const predWinner =
    predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";
  const realWinner =
    realHome > realAway ? "home" : realHome < realAway ? "away" : "draw";
  if (predWinner === realWinner) return 1;

  return 0;
}

/**
 * Actualización incremental: solo recalcula puntajes de usuarios que predijeron
 * este partido, aplicando el delta entre el resultado anterior y el nuevo.
 */
export async function updateScoresForMatch(
  ctx: MutationCtx,
  matchId: Id<"matches">,
  oldHome: number | undefined,
  oldAway: number | undefined,
  oldStatus: string,
  newHome: number | undefined,
  newAway: number | undefined,
  newStatus: string
) {
  const matchPreds = await ctx.db
    .query("predictions")
    .withIndex("by_matchId", (q) => q.eq("matchId", matchId))
    .collect();

  const oldFinished = oldStatus === "finished" && oldHome !== undefined && oldAway !== undefined;
  const newFinished = newStatus === "finished" && newHome !== undefined && newAway !== undefined;

  for (const p of matchPreds) {
    const oldPts = oldFinished ? calculatePoints(p.homeScore, p.awayScore, oldHome, oldAway) : 0;
    const newPts = newFinished ? calculatePoints(p.homeScore, p.awayScore, newHome!, newAway!) : 0;
    const delta = newPts - oldPts;
    if (delta === 0) continue;

    const user = await ctx.db.get(p.userId);
    if (!user) continue;
    await ctx.db.patch(p.userId, { score: user.score + delta });
  }
}

export async function recalculateLeaderboardInMutation(ctx: MutationCtx) {
  const users = await ctx.db.query("users").collect();
  const matches = await ctx.db.query("matches").collect();
  const finishedMatches = matches.filter((m) => m.status === "finished");
  const predictions = await ctx.db.query("predictions").collect();

  const scores: Record<string, number> = {};
  for (const u of users) {
    scores[u._id] = 0;
  }

  for (const match of finishedMatches) {
    const homeScore = match.homeScore;
    const awayScore = match.awayScore;
    if (homeScore === undefined || awayScore === undefined) continue;
    const matchPreds = predictions.filter((p) => p.matchId === match._id);
    for (const p of matchPreds) {
      const pts = calculatePoints(
        p.homeScore,
        p.awayScore,
        homeScore,
        awayScore
      );
      scores[p.userId] = (scores[p.userId] ?? 0) + pts;
    }
  }

  for (const user of users) {
    const newScore = scores[user._id] ?? 0;
    if (user.score !== newScore) {
      await ctx.db.patch(user._id, { score: newScore });
    }
  }
}

export const recalculateLeaderboard = internalMutation({
  args: {},
  handler: async (ctx) => {
    await recalculateLeaderboardInMutation(ctx);
  },
});
