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

function pickAllLeaders(
  entries: Array<[string, number]>,
  mode: "max" | "min"
): string[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) =>
    mode === "max" ? b[1] - a[1] : a[1] - b[1]
  );
  const bestValue = sorted[0][1];
  return sorted.filter(([, value]) => value === bestValue).map(([id]) => id);
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

  const actualMostGoalsTeams = pickAllLeaders(
    Array.from(goalsFor.entries()),
    "max"
  ) as Id<"teams">[];
  const actualLeastConcededTeams = pickAllLeaders(
    Array.from(goalsAgainst.entries()),
    "min"
  ) as Id<"teams">[];
  const scorerEntries = Array.from(scorerGoals.entries());
  const actualTopScorers =
    scorerEntries.length === 0
      ? ([] as Id<"players">[])
      : (pickAllLeaders(scorerEntries, "max") as Id<"players">[]);

  const settings = await ctx.db.query("tournamentSettings").first();
  if (settings) {
    await ctx.db.patch(settings._id, {
      actualTopScorers,
      actualMostGoalsTeams,
      actualLeastConcededTeams,
    });
  } else {
    await ctx.db.insert("tournamentSettings", {
      predictionsLocked: false,
      lockedAt: undefined,
      updatedBy: undefined,
      actualTopScorers,
      actualMostGoalsTeams,
      actualLeastConcededTeams,
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
    actualTopScorers,
    actualMostGoalsTeams,
    actualLeastConcededTeams,
  };
}

export async function recalculateLeaderboardInMutation(ctx: MutationCtx) {
  const users = await ctx.db.query("users").collect();
  const matches = await ctx.db.query("matches").collect();
  const finishedMatches = matches.filter((m) => m.status === "finished");
  const predictions = await ctx.db.query("predictions").collect();
  const bonusPredictions = await ctx.db.query("bonusPredictions").collect();
  const bonusSettings = await recalculateBonusResultsInMutation(ctx);

  const topScorerIds = new Set(bonusSettings.actualTopScorers);
  const mostGoalsTeamIds = new Set(bonusSettings.actualMostGoalsTeams);
  const leastConcededTeamIds = new Set(bonusSettings.actualLeastConcededTeams);

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

    if (prediction.topScorer && topScorerIds.has(prediction.topScorer)) {
      bonus += BONUS_POINTS;
    }

    if (prediction.mostGoalsTeam && mostGoalsTeamIds.has(prediction.mostGoalsTeam)) {
      bonus += BONUS_POINTS;
    }

    if (
      prediction.leastConcededTeam &&
      leastConcededTeamIds.has(prediction.leastConcededTeam)
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
