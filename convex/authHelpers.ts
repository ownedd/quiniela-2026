import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type RequestCtx = QueryCtx | MutationCtx;

export function getUserRole(user: Pick<Doc<"users">, "groupRole" | "isAdmin">) {
  if (user.groupRole) {
    return user.groupRole;
  }
  return user.isAdmin ? "admin" : "member";
}

export function isGroupAdmin(user: Pick<Doc<"users">, "groupRole" | "isAdmin">) {
  return getUserRole(user) === "admin";
}

export async function getUserByClerkId(ctx: RequestCtx, clerkId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

export async function getCurrentUser(ctx: RequestCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await getUserByClerkId(ctx, identity.subject);
}

export async function requireCurrentUser(ctx: RequestCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Sin autenticación");
  }
  return user;
}

export async function requireGroupMember(ctx: RequestCtx) {
  const user = await requireCurrentUser(ctx);

  if (!user.groupId) {
    throw new Error("Debes unirte a un grupo para acceder a esta sección");
  }

  const group = await ctx.db.get(user.groupId);
  if (!group) {
    throw new Error("El grupo asignado no existe");
  }

  return {
    user,
    group,
    role: getUserRole(user),
  };
}

export async function requireGroupAdmin(ctx: RequestCtx) {
  const membership = await requireGroupMember(ctx);
  if (!isGroupAdmin(membership.user)) {
    throw new Error("Solo administradores pueden realizar esta acción");
  }
  return membership;
}
