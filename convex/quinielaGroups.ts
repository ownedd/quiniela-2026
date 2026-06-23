import { internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./auth";

const groupSummaryValidator = v.object({
  _id: v.id("quinielaGroups"),
  name: v.string(),
  invitationCode: v.string(),
  createdAt: v.string(),
  memberCount: v.number(),
});

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

function codePrefixFromName(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return normalized || "GRUPO";
}

function randomCodeSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

async function generateInvitationCode(ctx: MutationCtx, name: string) {
  const prefix = codePrefixFromName(name);

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${prefix}${randomCodeSuffix()}`.slice(0, 12);
    const existing = await ctx.db
      .query("quinielaGroups")
      .withIndex("by_invitationCode", (q) => q.eq("invitationCode", candidate))
      .unique();
    if (!existing) return candidate;
  }

  throw new Error("No se pudo generar un código único. Intenta nuevamente.");
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user?.groupId) return null;
    return await ctx.db.get(user.groupId);
  },
});

export const listForAdmin = query({
  args: {},
  returns: v.array(groupSummaryValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [groups, users] = await Promise.all([
      ctx.db.query("quinielaGroups").collect(),
      ctx.db.query("users").collect(),
    ]);
    const membersByGroupId = new Map<string, number>();
    for (const user of users) {
      if (!user.groupId) continue;
      membersByGroupId.set(user.groupId, (membersByGroupId.get(user.groupId) ?? 0) + 1);
    }

    return groups
      .map((group) => ({
        _id: group._id,
        name: group.name,
        invitationCode: group.invitationCode,
        createdAt: group.createdAt,
        memberCount: membersByGroupId.get(group._id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    invitationCode: v.optional(v.string()),
  },
  returns: groupSummaryValidator,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const name = args.name.trim();
    if (name.length < 2 || name.length > 60) {
      throw new Error("El nombre del grupo debe tener entre 2 y 60 caracteres");
    }

    const invitationCode = args.invitationCode ? normalizeInvitationCode(args.invitationCode) : await generateInvitationCode(ctx, name);
    if (!/^[A-Z0-9]{3,12}$/.test(invitationCode)) {
      throw new Error("El código debe tener entre 3 y 12 letras o números");
    }

    const existing = await ctx.db
      .query("quinielaGroups")
      .withIndex("by_invitationCode", (q) => q.eq("invitationCode", invitationCode))
      .unique();
    if (existing) {
      throw new Error("Ya existe un grupo con ese código");
    }

    const createdAt = new Date().toISOString();
    const groupId = await ctx.db.insert("quinielaGroups", {
      name,
      invitationCode,
      createdAt,
    });

    return {
      _id: groupId,
      name,
      invitationCode,
      createdAt,
      memberCount: 0,
    };
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

