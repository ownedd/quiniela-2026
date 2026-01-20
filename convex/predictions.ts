import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const submit = mutation({
  args: {
    userId: v.id("users"),
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("predictions")
      .withIndex("by_user_match", (q) =>
        q.eq("userId", args.userId).eq("matchId", args.matchId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        homeScore: args.homeScore,
        awayScore: args.awayScore,
      });
    } else {
      await ctx.db.insert("predictions", {
        userId: args.userId,
        matchId: args.matchId,
        homeScore: args.homeScore,
        awayScore: args.awayScore,
      });
    }
  },
});
