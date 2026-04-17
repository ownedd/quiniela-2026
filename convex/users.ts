import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser as getAuthenticatedUser,
  getUserRole,
  isGroupAdmin,
  requireCurrentUser,
} from "./authHelpers";

const BONUS_POINTS_PER_CATEGORY = 10;

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sin autenticación");
    }

    // Check if we've already stored this user.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const name = identity.name || [identity.givenName, identity.familyName].filter(Boolean).join(" ") || "Sin Nombre";
    const email = identity.email || "sin@email.com";
    const image = identity.pictureUrl || "";

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
      groupRole: undefined,
    });
  },
});

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user?.groupId) return false;
    return isGroupAdmin(user);
  },
});

export const canBootstrapAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user?.groupId) return false;
    const groupUsers = await ctx.db
      .query("users")
      .withIndex("by_groupId", (q) => q.eq("groupId", user.groupId))
      .collect();
    return groupUsers.filter((u) => isGroupAdmin(u)).length === 0;
  },
});

export const bootstrapAsFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    if (!user) throw new Error("Usuario no sincronizado");
    if (!user.groupId) throw new Error("Debes pertenecer a un grupo para ser administrador");

    const groupUsers = await ctx.db
      .query("users")
      .withIndex("by_groupId", (q) => q.eq("groupId", user.groupId))
      .collect();
    const adminCount = groupUsers.filter((u) => isGroupAdmin(u)).length;
    if (adminCount > 0) throw new Error("Ya existen administradores");
    await ctx.db.patch(user._id, { groupRole: "admin", isAdmin: true });
  },
});

export const setAdmin = mutation({
  args: { userId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, { userId, isAdmin }) => {
    const caller = await requireCurrentUser(ctx);
    const targetUser = await ctx.db.get(userId);
    if (!targetUser) throw new Error("Usuario no encontrado");

    if (!caller.groupId || !targetUser.groupId || caller.groupId !== targetUser.groupId) {
      throw new Error("Solo puedes modificar usuarios de tu mismo grupo");
    }

    const groupUsers = await ctx.db
      .query("users")
      .withIndex("by_groupId", (q) => q.eq("groupId", caller.groupId))
      .collect();
    const adminCount = groupUsers.filter((u) => isGroupAdmin(u)).length;

    if (adminCount === 0) {
      if (caller?._id !== userId) throw new Error("Solo puedes promoverte a ti mismo como primer admin");
    } else {
      if (!isGroupAdmin(caller)) throw new Error("Solo administradores pueden cambiar roles");
    }
    await ctx.db.patch(userId, { isAdmin, groupRole: isAdmin ? "admin" : "member" });
  },
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    if (!currentUser?.groupId) {
      return [];
    }

    const [users, settings, bonusPredictions] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_groupId", (q) => q.eq("groupId", currentUser.groupId!))
        .collect(),
      ctx.db.query("tournamentSettings").first(),
      ctx.db.query("bonusPredictions").collect(),
    ]);

    const orderedUsers = [...users].sort((a, b) => b.score - a.score);

    const topScorerIds = new Set(settings?.actualTopScorers ?? []);
    const mostGoalsTeamIds = new Set(settings?.actualMostGoalsTeams ?? []);
    const leastConcededTeamIds = new Set(settings?.actualLeastConcededTeams ?? []);

    const bonusByUserId = new Map(bonusPredictions.map((b) => [b.userId, b]));

    return orderedUsers.map((u) => {
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
    const user = await getAuthenticatedUser(ctx);
    if (!user) return null;

    const group = user.groupId ? await ctx.db.get(user.groupId) : null;

    return {
      ...user,
      groupName: group?.name ?? null,
      groupSlug: group?.slug ?? null,
      groupRole: getUserRole(user),
      isAdmin: isGroupAdmin(user),
    };
  },
});

export const getViewerContext = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return {
        isAuthenticated: false,
        hasGroup: false,
        isAdmin: false,
        user: null,
        group: null,
      };
    }

    const group = user.groupId ? await ctx.db.get(user.groupId) : null;

    return {
      isAuthenticated: true,
      hasGroup: Boolean(group),
      isAdmin: Boolean(group && isGroupAdmin(user)),
      user: {
        _id: user._id,
        name: user.name,
        displayName: user.displayName ?? user.name,
        image: user.image ?? null,
        groupRole: getUserRole(user),
      },
      group: group
        ? {
            _id: group._id,
            name: group.name,
            slug: group.slug,
            status: group.status,
          }
        : null,
    };
  },
});

export const updateDisplayName = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, { displayName }) => {
    const user = await requireCurrentUser(ctx);

    const trimmed = displayName.trim();
    if (trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 30)) {
      throw new Error("El nombre debe tener entre 2 y 30 caracteres");
    }

    await ctx.db.patch(user._id, {
      displayName: trimmed.length > 0 ? trimmed : "",
    });
    return user._id;
  },
});
