import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
const BONUS_POINTS_PER_CATEGORY = 10;

export const store = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sin autenticación");
    }

    // Check if we've already stored this user.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const name = args.name || identity.name || [identity.givenName, identity.familyName].filter(Boolean).join(" ") || "Sin Nombre";
    const email = args.email || identity.email || "sin@email.com";
    const image = args.image || identity.pictureUrl || "";

    if (user !== null) {
      // If we've seen this user before but the name or email has changed, patch it.
      if (user.name !== name || user.email !== email || user.image !== image) {
        await ctx.db.patch(user._id, { name, email, image });
      }
      return user._id;
    }

    // If it's a new identity, create a new User.
    return await ctx.db.insert("users", {
      name,
      email,
      image,
      clerkId: identity.subject,
      score: 0,
    });
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    return user?.isAdmin ?? false;
  },
});

export const canBootstrapAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const admins = await ctx.db.query("users").collect();
    return admins.filter((u) => u.isAdmin).length === 0;
  },
});

export const bootstrapAsFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sin autenticación");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("Usuario no sincronizado");
    const admins = await ctx.db.query("users").collect();
    const adminCount = admins.filter((u) => u.isAdmin).length;
    if (adminCount > 0) throw new Error("Ya existen administradores");
    await ctx.db.patch(user._id, { isAdmin: true });
  },
});

export const setAdmin = mutation({
  args: { userId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, { userId, isAdmin }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sin autenticación");
    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    const admins = await ctx.db.query("users").collect();
    const adminCount = admins.filter((u) => u.isAdmin).length;
    if (adminCount === 0) {
      if (caller?._id !== userId) throw new Error("Solo puedes promoverte a ti mismo como primer admin");
    } else {
      if (!caller?.isAdmin) throw new Error("Solo administradores pueden cambiar roles");
    }
    await ctx.db.patch(userId, { isAdmin });
  },
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const groupId = caller?.groupId;
    if (!groupId) return [];

    const [users, settings, allBonusPredictions] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_groupId_score", (q) => q.eq("groupId", groupId))
        .order("desc")
        .collect(),
      ctx.db.query("tournamentSettings").first(),
      ctx.db.query("bonusPredictions").collect(),
    ]);
    const userIdSet = new Set(users.map((u) => u._id));
    const bonusPredictions = allBonusPredictions.filter((b) => userIdSet.has(b.userId));

    const topScorerIds = new Set(settings?.actualTopScorers ?? []);
    const mostGoalsTeamIds = new Set(settings?.actualMostGoalsTeams ?? []);
    const leastConcededTeamIds = new Set(settings?.actualLeastConcededTeams ?? []);

    const bonusByUserId = new Map(bonusPredictions.map((b) => [b.userId, b]));

    return users.map((u) => {
      const b = bonusByUserId.get(u._id);
      let bonusPoints = 0;
      if (b) {
        if (b.topScorer && topScorerIds.has(b.topScorer)) {
          bonusPoints += BONUS_POINTS_PER_CATEGORY;
        }
        if (b.mostGoalsTeam && mostGoalsTeamIds.has(b.mostGoalsTeam)) {
          bonusPoints += BONUS_POINTS_PER_CATEGORY;
        }
        if (b.leastConcededTeam && leastConcededTeamIds.has(b.leastConcededTeam)) {
          bonusPoints += BONUS_POINTS_PER_CATEGORY;
        }
      }
      return {
        _id: u._id,
        displayName: u.displayName ?? u.name,
        image: u.image,
        score: u.score,
        bonusPoints,
      };
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const updateDisplayName = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, { displayName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sin autenticación");
    }

    const trimmed = displayName.trim();
    if (trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 30)) {
      throw new Error("El nombre debe tener entre 2 y 30 caracteres");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    await ctx.db.patch(user._id, {
      displayName: trimmed.length > 0 ? trimmed : "",
    });
    return user._id;
  },
});
