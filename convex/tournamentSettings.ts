import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { requireGroupAdmin, requireGroupMember } from "./authHelpers";

type SettingsCtx = MutationCtx | QueryCtx;

async function getGlobalTournamentSettings(ctx: SettingsCtx) {
  return await ctx.db.query("tournamentSettings").first();
}

async function getGroupSettings(ctx: SettingsCtx, groupId: Id<"groups">) {
  return await ctx.db
    .query("groupSettings")
    .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
    .unique();
}

async function ensureGroupSettings(ctx: MutationCtx, groupId: Id<"groups">) {
  const existing = await getGroupSettings(ctx, groupId);
  if (existing) {
    return existing;
  }

  const settingsId = await ctx.db.insert("groupSettings", {
    groupId,
    predictionsLocked: false,
    lockedAt: undefined,
    updatedBy: undefined,
    predictionsExportStorageId: undefined,
    predictionsExportFilename: undefined,
    predictionsExportGeneratedAt: undefined,
    predictionsExportStatus: undefined,
    predictionsExportError: undefined,
    predictionsExportToken: undefined,
    predictionsExportScheduledId: undefined,
  });

  return (await ctx.db.get(settingsId))!;
}

export async function ensureGlobalTournamentSettings(ctx: MutationCtx) {
  const settings = await getGlobalTournamentSettings(ctx);
  if (settings) {
    return settings;
  }

  const settingsId = await ctx.db.insert("tournamentSettings", {
    actualTopScorers: undefined,
    actualMostGoalsTeams: undefined,
    actualLeastConcededTeams: undefined,
    predictionsLocked: false,
    lockedAt: undefined,
    updatedBy: undefined,
    predictionsExportStorageId: undefined,
    predictionsExportFilename: undefined,
    predictionsExportGeneratedAt: undefined,
    predictionsExportStatus: undefined,
    predictionsExportError: undefined,
    predictionsExportToken: undefined,
    predictionsExportScheduledId: undefined,
  });

  return (await ctx.db.get(settingsId))!;
}

async function cleanupPredictionsExport(ctx: MutationCtx, settings: Doc<"groupSettings"> | null) {
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
    const membership = await requireGroupMember(ctx);
    const [globalSettings, groupSettings] = await Promise.all([
      getGlobalTournamentSettings(ctx),
      getGroupSettings(ctx, membership.group._id),
    ]);

    return {
      predictionsLocked: groupSettings?.predictionsLocked ?? false,
      lockedAt: groupSettings?.lockedAt,
      updatedBy: groupSettings?.updatedBy,
      actualTopScorers: globalSettings?.actualTopScorers,
      actualMostGoalsTeams: globalSettings?.actualMostGoalsTeams,
      actualLeastConcededTeams: globalSettings?.actualLeastConcededTeams,
      predictionsExportStorageId: groupSettings?.predictionsExportStorageId,
      predictionsExportFilename: groupSettings?.predictionsExportFilename,
      predictionsExportGeneratedAt: groupSettings?.predictionsExportGeneratedAt,
      predictionsExportStatus: groupSettings?.predictionsExportStatus,
      predictionsExportError: groupSettings?.predictionsExportError,
      predictionsExportToken: groupSettings?.predictionsExportToken,
      predictionsExportScheduledId: groupSettings?.predictionsExportScheduledId,
      groupId: membership.group._id,
      groupName: membership.group.name,
    };
  },
});

export const getPredictionsExport = query({
  args: {},
  handler: async (ctx) => {
    const membership = await requireGroupMember(ctx);
    const settings = await getGroupSettings(ctx, membership.group._id);
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
    const { user, group } = await requireGroupAdmin(ctx);
    const existing = await ensureGroupSettings(ctx, group._id);
    const now = new Date().toISOString();

    await cleanupPredictionsExport(ctx, existing);

    if (locked) {
      const exportToken = `${now}-${Math.random().toString(36).slice(2, 10)}`;
      const settingsId = existing._id;

      await ctx.db.patch(existing._id, {
        predictionsLocked: true,
        lockedAt: now,
        updatedBy: user._id,
        predictionsExportStorageId: undefined,
        predictionsExportFilename: "quinielas.xlsx",
        predictionsExportGeneratedAt: undefined,
        predictionsExportStatus: "generating",
        predictionsExportError: undefined,
        predictionsExportToken: exportToken,
        predictionsExportScheduledId: undefined,
      });

      const scheduledId = await ctx.scheduler.runAfter(0, internal.predictionsExport.generatePredictionsExport, {
        token: exportToken,
        groupId: group._id,
      });

      if (settingsId) {
        await ctx.db.patch(settingsId, {
          predictionsExportScheduledId: scheduledId,
        });
      }

      return;
    }

    await ctx.db.patch(existing._id, {
      predictionsLocked: false,
      lockedAt: undefined,
      updatedBy: user._id,
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
    groupId: v.id("groups"),
    storageId: v.id("_storage"),
    filename: v.string(),
    generatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await getGroupSettings(ctx, args.groupId);
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
    groupId: v.id("groups"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await getGroupSettings(ctx, args.groupId);
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
