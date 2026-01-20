import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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


export const submit = mutation({
  args: {
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
  },
  handler: async (ctx, args) => {
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
