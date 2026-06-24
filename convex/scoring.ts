import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

const BONUS_POINTS = 10;
const PROJECTED_OUTCOME_POINTS = 3;
const PROJECTED_HOME_SCORE_POINTS = 1;
const PROJECTED_AWAY_SCORE_POINTS = 1;

const projectedLeaderboardRowValidator = v.object({
  rank: v.number(),
  userId: v.id("users"),
  displayName: v.string(),
  email: v.string(),
  groupId: v.union(v.id("quinielaGroups"), v.null()),
  groupName: v.union(v.string(), v.null()),
  currentScore: v.number(),
  projectedScore: v.number(),
  scoreDelta: v.number(),
  matchPoints: v.number(),
  bonusPoints: v.number(),
  correctOutcomes: v.number(),
  exactHomeScores: v.number(),
  exactAwayScores: v.number(),
  exactScores: v.number(),
});

function calculatePoints(predHome: number, predAway: number, realHome: number, realAway: number): number {
  const exactMatch = predHome === realHome && predAway === realAway;
  if (exactMatch) return 3;

  const predWinner = predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";
  const realWinner = realHome > realAway ? "home" : realHome < realAway ? "away" : "draw";
  if (predWinner === realWinner) return 1;

  return 0;
}

function getOutcome(home: number, away: number): "home" | "away" | "draw" {
  return home > away ? "home" : home < away ? "away" : "draw";
}

function calculateProjectedPoints(predHome: number, predAway: number, realHome: number, realAway: number): number {
  let points = 0;

  if (getOutcome(predHome, predAway) === getOutcome(realHome, realAway)) {
    points += PROJECTED_OUTCOME_POINTS;
  }

  if (predHome === realHome) {
    points += PROJECTED_HOME_SCORE_POINTS;
  }

  if (predAway === realAway) {
    points += PROJECTED_AWAY_SCORE_POINTS;
  }

  return points;
}

function pickAllLeaders(entries: Array<[string, number]>, mode: "max" | "min"): string[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) => (mode === "max" ? b[1] - a[1] : a[1] - b[1]));
  const bestValue = sorted[0][1];
  return sorted.filter(([, value]) => value === bestValue).map(([id]) => id);
}

function calculateBonusResults(matches: Doc<"matches">[], players: Doc<"players">[]) {
  const finishedMatches = matches.filter((match) => match.status === "finished" && match.homeScore !== undefined && match.awayScore !== undefined);

  const goalsFor = new Map<string, number>();
  const goalsAgainst = new Map<string, number>();
  const scorerGoals = new Map<string, number>();
  const playerSet = new Set(players.map((player) => player._id));

  for (const match of finishedMatches) {
    goalsFor.set(match.homeTeam, (goalsFor.get(match.homeTeam) ?? 0) + match.homeScore!);
    goalsFor.set(match.awayTeam, (goalsFor.get(match.awayTeam) ?? 0) + match.awayScore!);
    goalsAgainst.set(match.homeTeam, (goalsAgainst.get(match.homeTeam) ?? 0) + match.awayScore!);
    goalsAgainst.set(match.awayTeam, (goalsAgainst.get(match.awayTeam) ?? 0) + match.homeScore!);

    for (const scorerId of match.homeScorers ?? []) {
      if (!playerSet.has(scorerId)) continue;
      scorerGoals.set(scorerId, (scorerGoals.get(scorerId) ?? 0) + 1);
    }

    for (const scorerId of match.awayScorers ?? []) {
      if (!playerSet.has(scorerId)) continue;
      scorerGoals.set(scorerId, (scorerGoals.get(scorerId) ?? 0) + 1);
    }
  }

  const actualMostGoalsTeams = pickAllLeaders(Array.from(goalsFor.entries()), "max") as Id<"teams">[];
  const actualLeastConcededTeams = pickAllLeaders(Array.from(goalsAgainst.entries()), "min") as Id<"teams">[];
  const scorerEntries = Array.from(scorerGoals.entries());
  const actualTopScorers = scorerEntries.length === 0 ? ([] as Id<"players">[]) : (pickAllLeaders(scorerEntries, "max") as Id<"players">[]);

  return {
    actualTopScorers,
    actualMostGoalsTeams,
    actualLeastConcededTeams,
  };
}

async function recalculateBonusResultsInMutation(ctx: MutationCtx) {
  const [matches, players] = await Promise.all([ctx.db.query("matches").collect(), ctx.db.query("players").collect()]);
  const bonusResults = calculateBonusResults(matches, players);

  const settings = await ctx.db.query("tournamentSettings").first();
  if (settings) {
    await ctx.db.patch(settings._id, {
      actualTopScorers: bonusResults.actualTopScorers,
      actualMostGoalsTeams: bonusResults.actualMostGoalsTeams,
      actualLeastConcededTeams: bonusResults.actualLeastConcededTeams,
    });
  } else {
    await ctx.db.insert("tournamentSettings", {
      predictionsLocked: false,
      lockedAt: undefined,
      updatedBy: undefined,
      actualTopScorers: bonusResults.actualTopScorers,
      actualMostGoalsTeams: bonusResults.actualMostGoalsTeams,
      actualLeastConcededTeams: bonusResults.actualLeastConcededTeams,
    });
  }

  return bonusResults;
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
      const pts = calculatePoints(p.homeScore, p.awayScore, homeScore, awayScore);
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

    if (prediction.leastConcededTeam && leastConcededTeamIds.has(prediction.leastConcededTeam)) {
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

export const projectedLeaderboardWithExperimentalScoring = internalQuery({
  args: {
    groupId: v.optional(v.id("quinielaGroups")),
  },
  returns: v.object({
    groupId: v.union(v.id("quinielaGroups"), v.null()),
    groupName: v.union(v.string(), v.null()),
    finishedMatches: v.number(),
    scoringRule: v.object({
      outcomePoints: v.number(),
      homeScorePoints: v.number(),
      awayScorePoints: v.number(),
      bonusPointsPerCategory: v.number(),
    }),
    projectedLeaderboard: v.array(projectedLeaderboardRowValidator),
  }),
  handler: async (ctx, args) => {
    const [users, matches, predictions, bonusPredictions, players, groups] = await Promise.all([
      args.groupId
        ? ctx.db
            .query("users")
            .withIndex("by_groupId_score", (q) => q.eq("groupId", args.groupId))
            .collect()
        : ctx.db.query("users").collect(),
      ctx.db.query("matches").collect(),
      ctx.db.query("predictions").collect(),
      ctx.db.query("bonusPredictions").collect(),
      ctx.db.query("players").collect(),
      ctx.db.query("quinielaGroups").collect(),
    ]);

    const groupMap = new Map(groups.map((group) => [group._id, group]));
    const groupName = args.groupId ? groupMap.get(args.groupId)?.name ?? null : null;
    const userIds = new Set(users.map((user) => user._id));
    const finishedMatches = matches.filter((match) => match.status === "finished" && match.homeScore !== undefined && match.awayScore !== undefined);
    const finishedMatchesById = new Map(finishedMatches.map((match) => [match._id, match]));
    const bonusResults = calculateBonusResults(matches, players);
    const topScorerIds = new Set(bonusResults.actualTopScorers);
    const mostGoalsTeamIds = new Set(bonusResults.actualMostGoalsTeams);
    const leastConcededTeamIds = new Set(bonusResults.actualLeastConcededTeams);

    const statsByUserId = new Map(
      users.map((user) => [
        user._id,
        {
          matchPoints: 0,
          bonusPoints: 0,
          correctOutcomes: 0,
          exactHomeScores: 0,
          exactAwayScores: 0,
          exactScores: 0,
        },
      ])
    );

    for (const prediction of predictions) {
      if (!userIds.has(prediction.userId)) continue;

      const match = finishedMatchesById.get(prediction.matchId);
      if (!match || match.homeScore === undefined || match.awayScore === undefined) continue;

      const stats = statsByUserId.get(prediction.userId);
      if (!stats) continue;

      const projectedPoints = calculateProjectedPoints(prediction.homeScore, prediction.awayScore, match.homeScore, match.awayScore);
      stats.matchPoints += projectedPoints;

      if (getOutcome(prediction.homeScore, prediction.awayScore) === getOutcome(match.homeScore, match.awayScore)) {
        stats.correctOutcomes += 1;
      }

      if (prediction.homeScore === match.homeScore) {
        stats.exactHomeScores += 1;
      }

      if (prediction.awayScore === match.awayScore) {
        stats.exactAwayScores += 1;
      }

      if (prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore) {
        stats.exactScores += 1;
      }
    }

    for (const prediction of bonusPredictions) {
      if (!userIds.has(prediction.userId)) continue;

      const stats = statsByUserId.get(prediction.userId);
      if (!stats) continue;

      if (prediction.topScorer && topScorerIds.has(prediction.topScorer)) {
        stats.bonusPoints += BONUS_POINTS;
      }

      if (prediction.mostGoalsTeam && mostGoalsTeamIds.has(prediction.mostGoalsTeam)) {
        stats.bonusPoints += BONUS_POINTS;
      }

      if (prediction.leastConcededTeam && leastConcededTeamIds.has(prediction.leastConcededTeam)) {
        stats.bonusPoints += BONUS_POINTS;
      }
    }

    const sortedRows = users
      .map((user) => {
        const stats = statsByUserId.get(user._id);
        const matchPoints = stats?.matchPoints ?? 0;
        const bonusPoints = stats?.bonusPoints ?? 0;
        const projectedScore = matchPoints + bonusPoints;
        const userGroup = user.groupId ? groupMap.get(user.groupId) : null;

        return {
          rank: 0,
          userId: user._id,
          displayName: user.displayName ?? user.name,
          email: user.email,
          groupId: user.groupId ?? null,
          groupName: userGroup?.name ?? null,
          currentScore: user.score,
          projectedScore,
          scoreDelta: projectedScore - user.score,
          matchPoints,
          bonusPoints,
          correctOutcomes: stats?.correctOutcomes ?? 0,
          exactHomeScores: stats?.exactHomeScores ?? 0,
          exactAwayScores: stats?.exactAwayScores ?? 0,
          exactScores: stats?.exactScores ?? 0,
        };
      })
      .sort((a, b) => {
        const scoreCompare = b.projectedScore - a.projectedScore;
        if (scoreCompare !== 0) return scoreCompare;

        const currentScoreCompare = b.currentScore - a.currentScore;
        if (currentScoreCompare !== 0) return currentScoreCompare;

        return a.displayName.localeCompare(b.displayName, "es");
      });

    let previousScore: number | null = null;
    let rank = 0;
    const projectedLeaderboard = sortedRows.map((row, index) => {
      if (row.projectedScore !== previousScore) {
        rank = index + 1;
        previousScore = row.projectedScore;
      }

      return {
        ...row,
        rank,
      };
    });

    return {
      groupId: args.groupId ?? null,
      groupName,
      finishedMatches: finishedMatches.length,
      scoringRule: {
        outcomePoints: PROJECTED_OUTCOME_POINTS,
        homeScorePoints: PROJECTED_HOME_SCORE_POINTS,
        awayScorePoints: PROJECTED_AWAY_SCORE_POINTS,
        bonusPointsPerCategory: BONUS_POINTS,
      },
      projectedLeaderboard,
    };
  },
});
