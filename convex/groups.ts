import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { getCurrentUser } from "./authHelpers";
import { recalculateLeaderboardInMutation } from "./scoring";

function normalizeInviteCode(inviteCode: string) {
  return inviteCode.trim().toUpperCase();
}

function normalizeSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureGroupSettings(ctx: MutationCtx, groupId: Id<"groups">) {
  const existing = await ctx.db
    .query("groupSettings")
    .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
    .unique();

  if (existing) {
    return existing._id;
  }

  return await ctx.db.insert("groupSettings", {
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
}

export const createGroup = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    inviteCode: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const slug = normalizeSlug(args.slug);
    const inviteCode = normalizeInviteCode(args.inviteCode);

    if (!slug) {
      throw new Error("El slug del grupo es obligatorio");
    }

    if (!inviteCode) {
      throw new Error("El código de invitación es obligatorio");
    }

    const existingSlug = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingSlug) {
      throw new Error("Ya existe un grupo con ese slug");
    }

    const existingInviteCode = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
      .unique();
    if (existingInviteCode) {
      throw new Error("Ya existe un grupo con ese código");
    }

    const user = await getCurrentUser(ctx);
    const groupId = await ctx.db.insert("groups", {
      name: args.name.trim(),
      slug,
      inviteCode,
      status: args.status ?? "active",
      createdBy: user?._id,
    });

    await ensureGroupSettings(ctx, groupId);
    return groupId;
  },
});

export const joinByInviteCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Sin autenticación");
    }

    if (user.groupId) {
      throw new Error("Ya perteneces a un grupo");
    }

    const normalizedCode = normalizeInviteCode(inviteCode);
    const group = await ctx.db
      .query("groups")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", normalizedCode))
      .unique();

    if (!group || group.status !== "active") {
      throw new Error("Código de grupo inválido o grupo no creado en Convex");
    }

    await ctx.db.patch(user._id, {
      groupId: group._id,
      groupRole: user.groupRole ?? "member",
    });

    await ensureGroupSettings(ctx, group._id);

    return {
      groupId: group._id,
      groupName: group.name,
      groupSlug: group.slug,
    };
  },
});

export const migrateExistingUsersToDefaultGroup = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const slug = normalizeSlug(args.slug);
    const inviteCode = normalizeInviteCode(args.inviteCode);

    if (!slug) {
      throw new Error("El slug del grupo por defecto es obligatorio");
    }

    if (!inviteCode) {
      throw new Error("El código del grupo por defecto es obligatorio");
    }

    let group = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!group) {
      const groupId = await ctx.db.insert("groups", {
        name: args.name.trim(),
        slug,
        inviteCode,
        status: "active",
        createdBy: undefined,
      });
      group = (await ctx.db.get(groupId))!;
    }

    await ensureGroupSettings(ctx, group._id);

    const users = await ctx.db.query("users").collect();
    let usersAssigned = 0;
    let rolesMigrated = 0;

    for (const user of users) {
      const patch: {
        groupId?: Id<"groups">;
        groupRole?: "admin" | "member";
      } = {};

      if (!user.groupId) {
        patch.groupId = group._id;
        usersAssigned += 1;
      }

      if (!user.groupRole) {
        patch.groupRole = user.isAdmin ? "admin" : "member";
        rolesMigrated += 1;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
      }
    }

    await recalculateLeaderboardInMutation(ctx);

    return {
      groupId: group._id,
      usersAssigned,
      rolesMigrated,
    };
  },
});

export const getCurrentGroup = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user?.groupId) {
      return null;
    }

    const group = await ctx.db.get(user.groupId);
    if (!group) {
      return null;
    }

    return {
      _id: group._id,
      name: group.name,
      slug: group.slug,
      status: group.status,
      inviteCode: group.inviteCode,
    };
  },
});
