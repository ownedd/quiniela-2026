import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx, message = "Solo administradores pueden realizar esta acción") {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sin autenticación");

  const user = await getCurrentUser(ctx);
  if (!user?.isAdmin) throw new Error(message);

  return user;
}
