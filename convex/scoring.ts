import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const BONUS_POINTS = 10;

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

function pickUniqueLeader(
  entries: Array<[string, number]>,
  mode: "max" | "min"
): string | undefined {
  if (entries.length === 0) return undefined;

  const sorted = [...entries].sort((a, b) =>
    mode === "max" ? b[1] - a[1] : a[1] - b[1]
  );
  const [leaderId, leaderValue] = sorted[0];
  const tied = sorted.filter(([, value]) => value === leaderValue);

  return tied.length === 1 ? leaderId : undefined;
}

async function recalculateBonusResultsInMutation(ctx: MutationCtx) {
  const [matches, players] = await Promise.all([
    ctx.db.query("matches").collect(),
    ctx.db.query("players").collect(),
  ]);
  const finishedMatches = matches.filter(
    (match) =>
      match.status === "finished" &&
      match.homeScore !== undefined &&
      match.awayScore !== undefined
  );

  const goalsFor = new Map<string, number>();
  const goalsAgainst = new Map<string, number>();
  const scorerGoals = new Map<string, number>();
  const playerSet = new Set(players.map((player) => player._id));

  for (const match of finishedMatches) {
    goalsFor.set(match.homeTeam, (goalsFor.get(match.homeTeam) ?? 0) + match.homeScore!);
    goalsFor.set(match.awayTeam, (goalsFor.get(match.awayTeam) ?? 0) + match.awayScore!);
    goalsAgainst.set(
      match.homeTeam,
      (goalsAgainst.get(match.homeTeam) ?? 0) + match.awayScore!
    );
    goalsAgainst.set(
      match.awayTeam,
      (goalsAgainst.get(match.awayTeam) ?? 0) + match.homeScore!
    );

    for (const scorerId of match.homeScorers ?? []) {
      if (!playerSet.has(scorerId)) continue;
      scorerGoals.set(scorerId, (scorerGoals.get(scorerId) ?? 0) + 1);
    }

    for (const scorerId of match.awayScorers ?? []) {
      if (!playerSet.has(scorerId)) continue;
      scorerGoals.set(scorerId, (scorerGoals.get(scorerId) ?? 0) + 1);
    }
  }

  const actualMostGoalsTeam = pickUniqueLeader(Array.from(goalsFor.entries()), "max") as
    | Id<"teams">
    | undefined;
  const actualLeastConcededTeam = pickUniqueLeader(
    Array.from(goalsAgainst.entries()),
    "min"
  ) as Id<"teams"> | undefined;
  const actualTopScorer = pickUniqueLeader(Array.from(scorerGoals.entries()), "max") as
    | Id<"players">
    | undefined;

  const settings = await ctx.db.query("tournamentSettings").first();
  if (settings) {
    await ctx.db.patch(settings._id, {
      actualTopScorer,
      actualMostGoalsTeam,
      actualLeastConcededTeam,
    });
  } else {
    await ctx.db.insert("tournamentSettings", {
      predictionsLocked: false,
      lockedAt: undefined,
      updatedBy: undefined,
      actualTopScorer,
      actualMostGoalsTeam,
      actualLeastConcededTeam,
      predictionsExportStorageId: undefined,
      predictionsExportFilename: undefined,
      predictionsExportGeneratedAt: undefined,
      predictionsExportStatus: undefined,
      predictionsExportError: undefined,
      predictionsExportToken: undefined,
      predictionsExportScheduledId: undefined,
    });
  }

  return {
    actualTopScorer,
    actualMostGoalsTeam,
    actualLeastConcededTeam,
  };
}

export async function recalculateLeaderboardInMutation(ctx: MutationCtx) {
  const users = await ctx.db.query("users").collect();
  const matches = await ctx.db.query("matches").collect();
  const finishedMatches = matches.filter((m) => m.status === "finished");
  const predictions = await ctx.db.query("predictions").collect();
  const bonusPredictions = await ctx.db.query("bonusPredictions").collect();
  const settings = await recalculateBonusResultsInMutation(ctx);

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

  for (const prediction of bonusPredictions) {
    let bonus = 0;

    if (settings?.actualTopScorer && prediction.topScorer === settings.actualTopScorer) {
      bonus += BONUS_POINTS;
    }

    if (
      settings?.actualMostGoalsTeam &&
      prediction.mostGoalsTeam === settings.actualMostGoalsTeam
    ) {
      bonus += BONUS_POINTS;
    }

    if (
      settings?.actualLeastConcededTeam &&
      prediction.leastConcededTeam === settings.actualLeastConcededTeam
    ) {
      bonus += BONUS_POINTS;
    }

    scores[prediction.userId] = (scores[prediction.userId] ?? 0) + bonus;
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
