import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { updateScoresForMatch } from "./scoring";
import { teams, matches } from "./seedData";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const [allMatches, allTeams] = await Promise.all([
      ctx.db.query("matches").order("asc").collect(),
      ctx.db.query("teams").collect(),
    ]);
    const teamMap = new Map(allTeams.map((t) => [t._id, t]));
    return allMatches.map((match) => {
      const homeTeam = teamMap.get(match.homeTeam);
      const awayTeam = teamMap.get(match.awayTeam);
      return {
        ...match,
        homeTeamDetails: homeTeam ? { name: homeTeam.name, code: homeTeam.code, flagUrl: homeTeam.flagUrl } : null,
        awayTeamDetails: awayTeam ? { name: awayTeam.name, code: awayTeam.code, flagUrl: awayTeam.flagUrl } : null,
      };
    });
  },
});

export const byGroup = query({
  args: {},
  handler: async (ctx) => {
    const allTeams = await ctx.db.query("teams").collect();
    const teamMap = new Map(allTeams.map((t) => [t._id, t]));
    const groups = [...new Set(allTeams.map((t) => t.group))].sort();

    const grouped: Record<string, any[]> = {};
    for (const group of groups) {
      const matchesInGroup = await ctx.db
        .query("matches")
        .withIndex("by_group", (q) => q.eq("group", group))
        .collect();
      const populated = matchesInGroup.map((match) => {
        const homeTeam = teamMap.get(match.homeTeam);
        const awayTeam = teamMap.get(match.awayTeam);
        return {
          ...match,
          homeTeamDetails: homeTeam ? { name: homeTeam.name, code: homeTeam.code, flagUrl: homeTeam.flagUrl } : null,
          awayTeamDetails: awayTeam ? { name: awayTeam.name, code: awayTeam.code, flagUrl: awayTeam.flagUrl } : null,
        };
      });
      grouped[group] = populated;
    }

    return grouped;
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Limpiar datos existentes
    const existingMatches = await ctx.db.query("matches").collect();
    for (const match of existingMatches) {
      await ctx.db.delete(match._id);
    }
    
    const existingTeams = await ctx.db.query("teams").collect();
    for (const team of existingTeams) {
      await ctx.db.delete(team._id);
    }
    
    // Insertar equipos y guardar sus IDs por nombre
    const teamIdsByName: Record<string, Id<"teams">> = {};
    for (const team of teams) {
      const id = await ctx.db.insert("teams", team);
      teamIdsByName[team.name] = id;
    }
    
    // Insertar partidos usando los IDs de los equipos
    for (const match of matches) {
      const homeTeamId = teamIdsByName[match.homeTeam];
      const awayTeamId = teamIdsByName[match.awayTeam];
      
      if (!homeTeamId || !awayTeamId) {
        console.error(`Team not found: ${match.homeTeam} or ${match.awayTeam}`);
        continue;
      }

      await ctx.db.insert("matches", {
        homeTeam: homeTeamId,
        awayTeam: awayTeamId,
        date: match.date,
        status: "scheduled",
        group: match.group,
        venue: match.venue,
        city: match.city,
        homeScore: undefined,
        awayScore: undefined,
      });
    }
    
    return { teamsInserted: teams.length, matchesInserted: matches.length };
  },
});

async function requireAdmin(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sin autenticación");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user?.isAdmin) throw new Error("Solo administradores pueden cargar resultados");
  return user;
}

export const setResult = mutation({
  args: {
    matchId: v.id("matches"),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Partido no encontrado");

    const hasHome = args.homeScore !== undefined && args.homeScore !== null;
    const hasAway = args.awayScore !== undefined && args.awayScore !== null;

    if (hasHome !== hasAway) {
      throw new Error("Resultado incompleto: debes indicar ambos marcadores o dejar ambos vacios para limpiar");
    }

    const oldHome = match.homeScore;
    const oldAway = match.awayScore;
    const oldStatus = match.status;

    if (hasHome && hasAway) {
      const h = args.homeScore!;
      const a = args.awayScore!;
      if (h < 0 || a < 0) throw new Error("Los marcadores no pueden ser negativos");
      await ctx.db.patch(args.matchId, {
        homeScore: h,
        awayScore: a,
        status: "finished",
      });
      await updateScoresForMatch(ctx, args.matchId, oldHome, oldAway, oldStatus, h, a, "finished");
    } else {
      await ctx.db.patch(args.matchId, {
        homeScore: undefined,
        awayScore: undefined,
        status: "scheduled",
      });
      await updateScoresForMatch(ctx, args.matchId, oldHome, oldAway, oldStatus, undefined, undefined, "scheduled");
    }
  },
});
