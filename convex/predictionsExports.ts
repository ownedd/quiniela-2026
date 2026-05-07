import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db.query("tournamentSettings").first();
    if (!settings?.predictionsLocked) return null;

    const user = await getCurrentUser(ctx);
    if (!user?.groupId) return null;

    const row = await ctx.db
      .query("predictionsExports")
      .withIndex("by_groupId", (q) => q.eq("groupId", user.groupId!))
      .first();

    if (!row) {
      return { status: "generating" as const, filename: "quinielas.xlsx", generatedAt: undefined, error: undefined, url: null };
    }

    const url = row.storageId ? await ctx.storage.getUrl(row.storageId) : null;

    return {
      status: row.status,
      filename: row.filename ?? "quinielas.xlsx",
      generatedAt: row.generatedAt,
      error: row.error,
      url,
    };
  },
});

export const adminSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user?.isAdmin) {
      return null;
    }

    const [groups, exports] = await Promise.all([
      ctx.db.query("quinielaGroups").collect(),
      ctx.db.query("predictionsExports").collect(),
    ]);

    const groupById = new Map(groups.map((group) => [group._id, group]));
    const rows = exports
      .map((row) => ({
        groupId: row.groupId,
        groupName: groupById.get(row.groupId)?.name ?? "Grupo",
        status: row.status,
        filename: row.filename,
        generatedAt: row.generatedAt,
        error: row.error,
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName, "es"));

    return {
      total: rows.length,
      ready: rows.filter((row) => row.status === "ready").length,
      generating: rows.filter((row) => row.status === "generating").length,
      error: rows.filter((row) => row.status === "error").length,
      rows,
    };
  },
});

export const complete = internalMutation({
  args: {
    groupId: v.id("quinielaGroups"),
    token: v.string(),
    storageId: v.id("_storage"),
    filename: v.string(),
    generatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("tournamentSettings").first();
    if (!settings?.predictionsLocked) {
      await ctx.storage.delete(args.storageId);
      return { applied: false };
    }

    const row = await ctx.db
      .query("predictionsExports")
      .withIndex("by_groupId_token", (q) => q.eq("groupId", args.groupId).eq("token", args.token))
      .first();

    if (!row) {
      await ctx.storage.delete(args.storageId);
      return { applied: false };
    }

    const previousStorageId = row.storageId;

    await ctx.db.patch(row._id, {
      storageId: args.storageId,
      filename: args.filename,
      generatedAt: args.generatedAt,
      status: "ready",
      error: undefined,
      scheduledId: undefined,
    });

    if (previousStorageId && previousStorageId !== args.storageId) {
      await ctx.storage.delete(previousStorageId);
    }

    return { applied: true };
  },
});

export const fail = internalMutation({
  args: {
    groupId: v.id("quinielaGroups"),
    token: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("tournamentSettings").first();
    if (!settings?.predictionsLocked) {
      return { applied: false };
    }

    const row = await ctx.db
      .query("predictionsExports")
      .withIndex("by_groupId_token", (q) => q.eq("groupId", args.groupId).eq("token", args.token))
      .first();

    if (!row) {
      return { applied: false };
    }

    await ctx.db.patch(row._id, {
      storageId: undefined,
      generatedAt: undefined,
      status: "error",
      error: args.error,
      scheduledId: undefined,
    });

    return { applied: true };
  },
});

