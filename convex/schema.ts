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
    actualTopScorers: v.optional(v.array(v.id("players"))),
    actualMostGoalsTeams: v.optional(v.array(v.id("teams"))),
    actualLeastConcededTeams: v.optional(v.array(v.id("teams"))),
    predictionsExportStorageId: v.optional(v.id("_storage")),
    predictionsExportFilename: v.optional(v.string()),
    predictionsExportGeneratedAt: v.optional(v.string()),
    predictionsExportStatus: v.optional(
      v.union(v.literal("generating"), v.literal("ready"), v.literal("error"))
    ),
    predictionsExportError: v.optional(v.string()),
    predictionsExportToken: v.optional(v.string()),
    predictionsExportScheduledId: v.optional(v.id("_scheduled_functions")),
  }),

  teams: defineTable({
    name: v.string(),
    code: v.string(),
    group: v.string(),
    flagUrl: v.optional(v.string()),
  }).index("by_group", ["group"]),

  players: defineTable({
    name: v.string(),
    teamId: v.id("teams"),
  }).index("by_teamId", ["teamId"]),

  matches: defineTable({
    homeTeam: v.id("teams"),
    awayTeam: v.id("teams"),
    date: v.string(),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    homeScorers: v.optional(v.array(v.id("players"))),
    awayScorers: v.optional(v.array(v.id("players"))),
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

  bonusPredictions: defineTable({
    userId: v.id("users"),
    topScorer: v.optional(v.id("players")),
    mostGoalsTeam: v.optional(v.id("teams")),
    leastConcededTeam: v.optional(v.id("teams")),
  }).index("by_userId", ["userId"]),
});
