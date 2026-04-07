import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

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

async function cleanupPredictionsExport(ctx: MutationCtx, settings: Doc<"tournamentSettings"> | null) {
  if (settings?.predictionsExportScheduledId) {
    try {
      await ctx.scheduler.cancel(settings.predictionsExportScheduledId as Id<"_scheduled_functions">);
    } catch {
      // Ignorar jobs ya iniciados o cancelados.
    }
  }

  if (settings?.predictionsExportStorageId) {
    try {
      await ctx.storage.delete(settings.predictionsExportStorageId as Id<"_storage">);
    } catch {
      // Ignorar si el archivo ya no existe.
    }
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
        predictionsExportStorageId: undefined,
        predictionsExportFilename: undefined,
        predictionsExportGeneratedAt: undefined,
        predictionsExportStatus: undefined,
        predictionsExportError: undefined,
        predictionsExportToken: undefined,
        predictionsExportScheduledId: undefined,
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

    const url = settings.predictionsExportStorageId ? await ctx.storage.getUrl(settings.predictionsExportStorageId) : null;

    return {
      status: settings.predictionsExportStatus ?? "generating",
      filename: settings.predictionsExportFilename ?? "quinielas.xlsx",
      generatedAt: settings.predictionsExportGeneratedAt,
      error: settings.predictionsExportError,
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

    await cleanupPredictionsExport(ctx, existing);

    if (locked) {
      const exportToken = `${now}-${Math.random().toString(36).slice(2, 10)}`;
      let settingsId = existing?._id;

      if (existing) {
        await ctx.db.patch(existing._id, {
          predictionsLocked: true,
          lockedAt: now,
          updatedBy: user._id,
          actualTopScorers: existing.actualTopScorers,
          actualMostGoalsTeams: existing.actualMostGoalsTeams,
          actualLeastConcededTeams: existing.actualLeastConcededTeams,
          predictionsExportStorageId: undefined,
          predictionsExportFilename: "quinielas.xlsx",
          predictionsExportGeneratedAt: undefined,
          predictionsExportStatus: "generating",
          predictionsExportError: undefined,
          predictionsExportToken: exportToken,
          predictionsExportScheduledId: undefined,
        });
      } else {
        settingsId = await ctx.db.insert("tournamentSettings", {
          predictionsLocked: true,
          lockedAt: now,
          updatedBy: user._id,
          actualTopScorers: undefined,
          actualMostGoalsTeams: undefined,
          actualLeastConcededTeams: undefined,
          predictionsExportStorageId: undefined,
          predictionsExportFilename: "quinielas.xlsx",
          predictionsExportGeneratedAt: undefined,
          predictionsExportStatus: "generating",
          predictionsExportError: undefined,
          predictionsExportToken: exportToken,
          predictionsExportScheduledId: undefined,
        });
      }

      const scheduledId = await ctx.scheduler.runAfter(0, internal.predictionsExport.generatePredictionsExport, { token: exportToken });

      if (settingsId) {
        await ctx.db.patch(settingsId, {
          predictionsExportScheduledId: scheduledId,
        });
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
        predictionsExportStorageId: undefined,
        predictionsExportFilename: undefined,
        predictionsExportGeneratedAt: undefined,
        predictionsExportStatus: undefined,
        predictionsExportError: undefined,
        predictionsExportToken: undefined,
        predictionsExportScheduledId: undefined,
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
      predictionsExportStorageId: undefined,
      predictionsExportFilename: undefined,
      predictionsExportGeneratedAt: undefined,
      predictionsExportStatus: undefined,
      predictionsExportError: undefined,
      predictionsExportToken: undefined,
      predictionsExportScheduledId: undefined,
    });
  },
});

export const completePredictionsExport = internalMutation({
  args: {
    token: v.string(),
    storageId: v.id("_storage"),
    filename: v.string(),
    generatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("tournamentSettings").first();
    if (!settings?.predictionsLocked || settings.predictionsExportToken !== args.token) {
      await ctx.storage.delete(args.storageId);
      return { applied: false };
    }

    const previousStorageId = settings.predictionsExportStorageId;

    await ctx.db.patch(settings._id, {
      predictionsExportStorageId: args.storageId,
      predictionsExportFilename: args.filename,
      predictionsExportGeneratedAt: args.generatedAt,
      predictionsExportStatus: "ready",
      predictionsExportError: undefined,
      predictionsExportScheduledId: undefined,
    });

    if (previousStorageId && previousStorageId !== args.storageId) {
      await ctx.storage.delete(previousStorageId);
    }

    return { applied: true };
  },
});

export const failPredictionsExport = internalMutation({
  args: {
    token: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("tournamentSettings").first();
    if (!settings?.predictionsLocked || settings.predictionsExportToken !== args.token) {
      return { applied: false };
    }

    await ctx.db.patch(settings._id, {
      predictionsExportStorageId: undefined,
      predictionsExportGeneratedAt: undefined,
      predictionsExportStatus: "error",
      predictionsExportError: args.error,
      predictionsExportScheduledId: undefined,
    });

    return { applied: true };
  },
});
