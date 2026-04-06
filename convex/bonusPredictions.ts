import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user;
}

type BonusPredictionDoc = Doc<"bonusPredictions"> | null;

async function buildBonusPredictionResponse(
  ctx: QueryCtx,
  prediction: BonusPredictionDoc
) {
  if (!prediction) return null;

  const [topScorer, mostGoalsTeam, leastConcededTeam] = await Promise.all([
    prediction.topScorer ? ctx.db.get(prediction.topScorer) : null,
    prediction.mostGoalsTeam ? ctx.db.get(prediction.mostGoalsTeam) : null,
    prediction.leastConcededTeam ? ctx.db.get(prediction.leastConcededTeam) : null,
  ]);

  const topScorerTeam = topScorer ? await ctx.db.get(topScorer.teamId) : null;

  return {
    _id: prediction._id,
    userId: prediction.userId,
    topScorer: prediction.topScorer,
    mostGoalsTeam: prediction.mostGoalsTeam,
    leastConcededTeam: prediction.leastConcededTeam,
    topScorerDetails: topScorer
      ? {
          _id: topScorer._id,
          name: topScorer.name,
          teamId: topScorer.teamId,
          teamName: topScorerTeam?.name ?? "Equipo",
          teamFlagUrl: topScorerTeam?.flagUrl ?? null,
        }
      : null,
    mostGoalsTeamDetails: mostGoalsTeam
      ? {
          _id: mostGoalsTeam._id,
          name: mostGoalsTeam.name,
          flagUrl: mostGoalsTeam.flagUrl ?? null,
        }
      : null,
    leastConcededTeamDetails: leastConcededTeam
      ? {
          _id: leastConcededTeam._id,
          name: leastConcededTeam.name,
          flagUrl: leastConcededTeam.flagUrl ?? null,
        }
      : null,
  };
}

export const getPlayers = query({
  args: {},
  handler: async (ctx) => {
    const [players, teams] = await Promise.all([
      ctx.db.query("players").collect(),
      ctx.db.query("teams").collect(),
    ]);

    const teamMap = new Map(teams.map((team) => [team._id, team]));

    return players
      .map((player) => {
        const team = teamMap.get(player.teamId);
        return {
          _id: player._id,
          name: player.name,
          teamId: player.teamId,
          teamName: team?.name ?? "Equipo",
          teamCode: team?.code ?? "",
          teamFlagUrl: team?.flagUrl ?? null,
          group: team?.group ?? "",
        };
      })
      .sort((a, b) => {
        const teamCompare = a.teamName.localeCompare(b.teamName, "es");
        if (teamCompare !== 0) return teamCompare;
        return a.name.localeCompare(b.name, "es");
      });
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const prediction = await ctx.db
      .query("bonusPredictions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return await buildBonusPredictionResponse(ctx, prediction);
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const caller = await getCurrentUser(ctx);
    if (!caller) return null;
    const isOwner = caller._id === userId;
    const isAdmin = caller.isAdmin === true;

    if (!isOwner && !isAdmin) return null;

    const prediction = await ctx.db
      .query("bonusPredictions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return await buildBonusPredictionResponse(ctx, prediction);
  },
});

export const addPlayer = mutation({
  args: {
    name: v.string(),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user?.isAdmin) {
      throw new Error("Solo administradores pueden agregar jugadores");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Equipo no encontrado");

    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("El nombre del jugador no puede estar vacío");

    const playerId = await ctx.db.insert("players", {
      name: trimmed,
      teamId: args.teamId,
    });

    return playerId;
  },
});

export const submit = mutation({
  args: {
    topScorer: v.optional(v.id("players")),
    mostGoalsTeam: v.optional(v.id("teams")),
    leastConcededTeam: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("tournamentSettings").first();
    if (settings?.predictionsLocked) {
      throw new Error("Las predicciones están cerradas desde el inicio del Mundial");
    }

    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Sin autenticación");
    }

    const existing = await ctx.db
      .query("bonusPredictions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const payload = {
      topScorer: args.topScorer,
      mostGoalsTeam: args.mostGoalsTeam,
      leastConcededTeam: args.leastConcededTeam,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("bonusPredictions", {
        userId: user._id,
        ...payload,
      });
    }
  },
});
