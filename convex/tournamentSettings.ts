import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

async function requireAdmin(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sin autenticación");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user?.isAdmin) throw new Error("Solo administradores pueden realizar esta acción");
  return user;
}

async function cleanupGroupExports(ctx: MutationCtx) {
  const exports = await ctx.db.query("predictionsExports").collect();
  for (const row of exports) {
    if (row.scheduledId) {
      try {
        await ctx.scheduler.cancel(row.scheduledId as Id<"_scheduled_functions">);
      } catch {
        // ignore
      }
    }
    if (row.storageId) {
      try {
        await ctx.storage.delete(row.storageId as Id<"_storage">);
      } catch {
        // ignore
      }
    }
    await ctx.db.delete(row._id);
  }
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("tournamentSettings").first();
    return (
      settings ?? {
        predictionsLocked: false,
        lockedAt: undefined,
        updatedBy: undefined,
        actualTopScorers: undefined,
        actualMostGoalsTeams: undefined,
        actualLeastConcededTeams: undefined,
      }
    );
  },
});

export const getPredictionsExport = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const settings = await ctx.db.query("tournamentSettings").first();
    if (!settings?.predictionsLocked) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user?.groupId) return null;

    const row = await ctx.db
      .query("predictionsExports")
      .withIndex("by_groupId", (q) => q.eq("groupId", user.groupId!))
      .first();

    if (!row) {
      return {
        status: "generating" as const,
        filename: "quinielas.xlsx",
        generatedAt: undefined,
        error: undefined,
        url: null,
      };
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

export const setPredictionsLocked = mutation({
  args: { locked: v.boolean() },
  handler: async (ctx, { locked }) => {
    const user = await requireAdmin(ctx);
    const existing = await ctx.db.query("tournamentSettings").first();
    const now = new Date().toISOString();
    await cleanupGroupExports(ctx);

    if (locked) {
      if (existing) {
        await ctx.db.patch(existing._id, {
          predictionsLocked: true,
          lockedAt: now,
          updatedBy: user._id,
          actualTopScorers: existing.actualTopScorers,
          actualMostGoalsTeams: existing.actualMostGoalsTeams,
          actualLeastConcededTeams: existing.actualLeastConcededTeams,
        });
      } else {
        await ctx.db.insert("tournamentSettings", {
          predictionsLocked: true,
          lockedAt: now,
          updatedBy: user._id,
          actualTopScorers: undefined,
          actualMostGoalsTeams: undefined,
          actualLeastConcededTeams: undefined,
        });
      }

      const groups = await ctx.db.query("quinielaGroups").collect();
      for (const group of groups) {
        const token = `${now}-${Math.random().toString(36).slice(2, 10)}`;
        const rowId = await ctx.db.insert("predictionsExports", {
          groupId: group._id,
          storageId: undefined,
          filename: undefined,
          generatedAt: undefined,
          status: "generating",
          error: undefined,
          token,
          scheduledId: undefined,
        });

        const scheduledId = await ctx.scheduler.runAfter(0, internal.predictionsExport.generatePredictionsExport, {
          groupId: group._id,
          token,
        });

        await ctx.db.patch(rowId, { scheduledId });
      }

      return;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        predictionsLocked: false,
        lockedAt: undefined,
        updatedBy: user._id,
        actualTopScorers: existing.actualTopScorers,
        actualMostGoalsTeams: existing.actualMostGoalsTeams,
        actualLeastConcededTeams: existing.actualLeastConcededTeams,
      });
      return;
    }

    await ctx.db.insert("tournamentSettings", {
      predictionsLocked: false,
      lockedAt: undefined,
      updatedBy: user._id,
      actualTopScorers: undefined,
      actualMostGoalsTeams: undefined,
      actualLeastConcededTeams: undefined,
    });
  },
});
