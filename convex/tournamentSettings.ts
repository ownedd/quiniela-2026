import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";

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

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("tournamentSettings").first();
    return settings ?? { predictionsLocked: false, lockedAt: undefined, updatedBy: undefined };
  },
});

export const setPredictionsLocked = mutation({
  args: { locked: v.boolean() },
  handler: async (ctx, { locked }) => {
    const user = await requireAdmin(ctx);
    const existing = await ctx.db.query("tournamentSettings").first();
    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, {
        predictionsLocked: locked,
        lockedAt: locked ? now : undefined,
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("tournamentSettings", {
        predictionsLocked: locked,
        lockedAt: locked ? now : undefined,
        updatedBy: user._id,
      });
    }
  },
});
