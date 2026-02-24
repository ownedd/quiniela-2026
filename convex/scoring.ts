import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

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
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;
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
