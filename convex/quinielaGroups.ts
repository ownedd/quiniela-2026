import { internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

function normalizeInvitationCode(code: string) {
  return code.trim().toUpperCase();
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user?.groupId) return null;
    return await ctx.db.get(user.groupId);
  },
});

export const joinByInvitationCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sin autenticación");
    if (user.groupId) {
      return { joined: true, groupId: user.groupId };
    }

    const normalized = normalizeInvitationCode(code);
    if (normalized.length < 3 || normalized.length > 32) {
      throw new Error("Código inválido");
    }

    const group = await ctx.db
      .query("quinielaGroups")
      .withIndex("by_invitationCode", (q) => q.eq("invitationCode", normalized))
      .unique();

    if (!group) {
      throw new Error("Código de invitación inválido");
    }

    await ctx.db.patch(user._id, { groupId: group._id });
    return { joined: true, groupId: group._id };
  },
});

export const getById = internalQuery({
  args: { groupId: v.id("quinielaGroups") },
  handler: async (ctx, { groupId }) => {
    return await ctx.db.get(groupId);
  },
});

