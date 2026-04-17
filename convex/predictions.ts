import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { recalculateLeaderboardInMutation } from "./scoring";
import { getCurrentUser, isGroupAdmin, requireGroupMember } from "./authHelpers";

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const caller = await getCurrentUser(ctx);
    if (!caller) return [];

    const targetUser = await ctx.db.get(userId);
    if (!targetUser) return [];

    const isOwner = caller._id === userId;
    const isAdmin = isGroupAdmin(caller);
    const sameGroup =
      caller.groupId !== undefined &&
      targetUser.groupId !== undefined &&
      caller.groupId === targetUser.groupId;
    if (!sameGroup || (!isOwner && !isAdmin)) return [];

    return await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const membership = await requireGroupMember(ctx);

    return await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) => q.eq("userId", membership.user._id))
      .collect();
  },
});

export const getAllForExport = internalQuery({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const [users, predictions, bonusPredictions, matches, teams, players] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
        .collect(),
      ctx.db.query("predictions").collect(),
      ctx.db.query("bonusPredictions").collect(),
      ctx.db.query("matches").order("asc").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("players").collect(),
    ]);
    const orderedUsers = [...users].sort((a, b) => b.score - a.score);
    const allowedUserIds = new Set(orderedUsers.map((user) => user._id));

    const teamMap = new Map(teams.map((team) => [team._id, team]));
    const playerMap = new Map(players.map((player) => [player._id, player]));
    const enrichedMatches = matches
      .map((match) => ({
        _id: match._id,
        group: match.group,
        date: match.date,
        homeTeam: teamMap.get(match.homeTeam)?.name ?? "TBD",
        awayTeam: teamMap.get(match.awayTeam)?.name ?? "TBD",
      }))
      .sort((a, b) => {
        const groupCompare = a.group.localeCompare(b.group);
        if (groupCompare !== 0) return groupCompare;
        return a.date.localeCompare(b.date);
      });

    return {
      users: orderedUsers.map((user) => ({
        _id: user._id,
        displayName: user.displayName ?? user.name,
        score: user.score,
      })),
      matches: enrichedMatches,
      predictions: predictions
        .filter((prediction) => allowedUserIds.has(prediction.userId))
        .map((prediction) => ({
        userId: prediction.userId,
        matchId: prediction.matchId,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
      })),
      bonusPredictions: bonusPredictions
        .filter((prediction) => allowedUserIds.has(prediction.userId))
        .map((prediction) => {
        const topScorer = prediction.topScorer
          ? playerMap.get(prediction.topScorer)
          : null;
        const topScorerTeam = topScorer ? teamMap.get(topScorer.teamId) : null;
        const mostGoalsTeam = prediction.mostGoalsTeam
          ? teamMap.get(prediction.mostGoalsTeam)
          : null;
        const leastConcededTeam = prediction.leastConcededTeam
          ? teamMap.get(prediction.leastConcededTeam)
          : null;

        return {
          userId: prediction.userId,
          topScorerName: topScorer?.name ?? "",
          topScorerTeamName: topScorerTeam?.name ?? "",
          mostGoalsTeamName: mostGoalsTeam?.name ?? "",
          leastConcededTeamName: leastConcededTeam?.name ?? "",
        };
      }),
    };
  },
});


export const cleanOrphanedPredictions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const predictions = await ctx.db.query("predictions").collect();
    const matches = await ctx.db.query("matches").collect();
    const matchIds = new Set(matches.map((m) => m._id));
    let deleted = 0;
    for (const p of predictions) {
      if (!matchIds.has(p.matchId)) {
        await ctx.db.delete(p._id);
        deleted++;
      }
    }
    if (deleted > 0) {
      await recalculateLeaderboardInMutation(ctx);
    }
    return { deleted };
  },
});

export const submit = mutation({
  args: {
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
  },
  handler: async (ctx, args) => {
    const membership = await requireGroupMember(ctx);
    const settings = await ctx.db
      .query("groupSettings")
      .withIndex("by_groupId", (q) => q.eq("groupId", membership.group._id))
      .unique();
    if (settings?.predictionsLocked) {
      throw new Error("Las predicciones están cerradas desde el inicio del Mundial");
    }

    const existing = await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) =>
        q.eq("userId", membership.user._id).eq("matchId", args.matchId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        homeScore: args.homeScore,
        awayScore: args.awayScore,
      });
    } else {
      await ctx.db.insert("predictions", {
        userId: membership.user._id,
        matchId: args.matchId,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
      });
    }
  },
});
