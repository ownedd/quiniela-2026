import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { recalculateLeaderboardInMutation } from "./scoring";

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!caller) return [];

    const isOwner = caller._id === userId;
    const isAdmin = caller.isAdmin === true;
    if (!isOwner && !isAdmin) return [];

    return await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) => q.eq("userId", user._id))
      .collect();
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
    const settings = await ctx.db.query("tournamentSettings").first();
    if (settings?.predictionsLocked) {
      throw new Error("Las predicciones están cerradas desde el inicio del Mundial");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sin autenticación");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuario no sincronizado");
    }

    const existing = await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) =>
        q.eq("userId", user._id).eq("matchId", args.matchId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        homeScore: args.homeScore,
        awayScore: args.awayScore,
      });
    } else {
      await ctx.db.insert("predictions", {
        userId: user._id,
        matchId: args.matchId,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
      });
    }
  },
});
