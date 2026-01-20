import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateUser = mutation({
  args: { name: v.string(), email: v.string(), image: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      score: 0,
    });
  },
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});
