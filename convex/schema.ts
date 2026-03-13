import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    displayName: v.optional(v.string()),
    score: v.number(),
    clerkId: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
  }).index("by_clerkId", ["clerkId"]).index("by_score", ["score"]),

  tournamentSettings: defineTable({
    predictionsLocked: v.boolean(),
    lockedAt: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
  }),

  teams: defineTable({
    name: v.string(),
    code: v.string(),
    group: v.string(),
    flagUrl: v.optional(v.string()),
  }).index("by_group", ["group"]),

  matches: defineTable({
    homeTeam: v.id("teams"),
    awayTeam: v.id("teams"),
    date: v.string(),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    status: v.string(),
    group: v.string(),
    venue: v.string(),
    city: v.string(),
  }).index("by_group", ["group"]),

  predictions: defineTable({
    userId: v.id("users"),
    matchId: v.id("matches"),
    homeScore: v.number(),
    awayScore: v.number(),
  })
    .index("by_user_match", ["userId", "matchId"])
    .index("by_matchId", ["matchId"]),
});
