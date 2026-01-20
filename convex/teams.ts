import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teams").collect();
  },
});

export const byGroup = query({
  args: { group: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_group", (q) => q.eq("group", args.group))
      .collect();
  },
});

export const allByGroup = query({
  args: {},
  handler: async (ctx) => {
    const allTeams = await ctx.db.query("teams").collect();
    const grouped: Record<string, typeof allTeams> = {};
    
    for (const team of allTeams) {
      if (!grouped[team.group]) {
        grouped[team.group] = [];
      }
      grouped[team.group].push(team);
    }
    
    return grouped;
  },
});
