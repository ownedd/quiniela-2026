import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  quinielaGroups: defineTable({
    name: v.string(),
    invitationCode: v.string(),
    createdAt: v.string(),
  }).index("by_invitationCode", ["invitationCode"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    displayName: v.optional(v.string()),
    score: v.number(),
    clerkId: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    groupId: v.optional(v.id("quinielaGroups")),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_score", ["score"])
    .index("by_groupId", ["groupId"])
    .index("by_groupId_score", ["groupId", "score"]),

  predictionsExports: defineTable({
    groupId: v.id("quinielaGroups"),
    storageId: v.optional(v.id("_storage")),
    filename: v.optional(v.string()),
    generatedAt: v.optional(v.string()),
    status: v.union(v.literal("generating"), v.literal("ready"), v.literal("error")),
    error: v.optional(v.string()),
    token: v.string(),
    scheduledId: v.optional(v.id("_scheduled_functions")),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_token", ["groupId", "token"]),

  tournamentSettings: defineTable({
    predictionsLocked: v.boolean(),
    lockedAt: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
    actualTopScorers: v.optional(v.array(v.id("players"))),
    actualMostGoalsTeams: v.optional(v.array(v.id("teams"))),
    actualLeastConcededTeams: v.optional(v.array(v.id("teams"))),
    // Export global legacy; replaced by `predictionsExports` per group.
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
    // Cantidad de goles del equipo que fueron autogoles del rival.
    // Cuentan para el marcador pero no para el goleador del torneo.
    homeOwnGoals: v.optional(v.number()),
    awayOwnGoals: v.optional(v.number()),
    resultUpdatedAt: v.optional(v.number()),
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
