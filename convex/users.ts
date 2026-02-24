import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sin autenticación");
    }

    console.log("Sincronizando usuario:", identity.subject, identity.name, identity.email);

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
    return await ctx.db.query("users").withIndex("by_score").order("desc").collect();
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

