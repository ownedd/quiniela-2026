import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { recalculateLeaderboardInMutation } from "./scoring";
import { players, teams, matches } from "./seedData";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./auth";

type GroupedMatch = Doc<"matches"> & {
  homeTeamDetails: { name: string; code: string; flagUrl?: string } | null;
  awayTeamDetails: { name: string; code: string; flagUrl?: string } | null;
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const [allMatches, allTeams] = await Promise.all([
      ctx.db.query("matches").order("asc").collect(),
      ctx.db.query("teams").collect(),
    ]);
    const teamMap = new Map(allTeams.map((t) => [t._id, t]));
    return allMatches
      .map((match) => {
        const homeTeam = teamMap.get(match.homeTeam);
        const awayTeam = teamMap.get(match.awayTeam);
        return {
          ...match,
          homeTeamDetails: homeTeam ? { name: homeTeam.name, code: homeTeam.code, flagUrl: homeTeam.flagUrl } : null,
          awayTeamDetails: awayTeam ? { name: awayTeam.name, code: awayTeam.code, flagUrl: awayTeam.flagUrl } : null,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const byGroup = query({
  args: {},
  handler: async (ctx) => {
    const allTeams = await ctx.db.query("teams").collect();
    const teamMap = new Map(allTeams.map((t) => [t._id, t]));
    const groups = [...new Set(allTeams.map((t) => t.group))].sort();

    const grouped: Record<string, GroupedMatch[]> = {};
    for (const group of groups) {
      const matchesInGroup = await ctx.db
        .query("matches")
        .withIndex("by_group", (q) => q.eq("group", group))
        .collect();
      const populated = matchesInGroup
        .map((match) => {
          const homeTeam = teamMap.get(match.homeTeam);
          const awayTeam = teamMap.get(match.awayTeam);
          return {
            ...match,
            homeTeamDetails: homeTeam ? { name: homeTeam.name, code: homeTeam.code, flagUrl: homeTeam.flagUrl } : null,
            awayTeamDetails: awayTeam ? { name: awayTeam.name, code: awayTeam.code, flagUrl: awayTeam.flagUrl } : null,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
      grouped[group] = populated;
    }

    return grouped;
  },
});

export const seed = mutation({
  args: {
    confirmation: v.literal("RESET_TOURNAMENT_DATA"),
  },
  returns: v.object({
    teamsInserted: v.number(),
    playersInserted: v.number(),
    matchesInserted: v.number(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx, "Solo administradores pueden reiniciar el calendario del torneo");

    // Resetear datos derivados para evitar referencias huérfanas cuando cambian IDs.
    const existingPredictions = await ctx.db.query("predictions").collect();
    for (const prediction of existingPredictions) {
      await ctx.db.delete(prediction._id);
    }

    const existingBonusPredictions = await ctx.db.query("bonusPredictions").collect();
    for (const bonusPrediction of existingBonusPredictions) {
      await ctx.db.delete(bonusPrediction._id);
    }

    const existingExports = await ctx.db.query("predictionsExports").collect();
    for (const exportRow of existingExports) {
      if (exportRow.storageId) {
        await ctx.storage.delete(exportRow.storageId);
      }
      await ctx.db.delete(exportRow._id);
    }

    const existingSettings = await ctx.db.query("tournamentSettings").collect();
    for (const setting of existingSettings) {
      await ctx.db.delete(setting._id);
    }

    const existingUsers = await ctx.db.query("users").collect();
    for (const user of existingUsers) {
      if (user.score !== 0) {
        await ctx.db.patch(user._id, { score: 0 });
      }
    }

    // Limpiar datos existentes del torneo
    const existingPlayers = await ctx.db.query("players").collect();
    for (const player of existingPlayers) {
      await ctx.db.delete(player._id);
    }

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

    for (const player of players) {
      const teamId = teamIdsByName[player.team];
      if (!teamId) {
        console.error(`Team not found for player: ${player.name} (${player.team})`);
        continue;
      }

      await ctx.db.insert("players", {
        name: player.name,
        teamId,
      });
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
        homeScorers: undefined,
        awayScorers: undefined,
      });
    }
    
    return {
      teamsInserted: teams.length,
      playersInserted: players.length,
      matchesInserted: matches.length,
    };
  },
});

export const setResult = mutation({
  args: {
    matchId: v.id("matches"),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    homeScorers: v.optional(v.array(v.id("players"))),
    awayScorers: v.optional(v.array(v.id("players"))),
    homeOwnGoals: v.optional(v.number()),
    awayOwnGoals: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, "Solo administradores pueden cargar resultados");
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Partido no encontrado");
    const resultUpdatedAt = Date.now();

    const hasHome = args.homeScore !== undefined && args.homeScore !== null;
    const hasAway = args.awayScore !== undefined && args.awayScore !== null;

    if (hasHome !== hasAway) {
      throw new Error("Resultado incompleto: debes indicar ambos marcadores o dejar ambos vacios para limpiar");
    }

    if (hasHome && hasAway) {
      const h = args.homeScore!;
      const a = args.awayScore!;
      if (h < 0 || a < 0) throw new Error("Los marcadores no pueden ser negativos");

      const homeOwnGoals = args.homeOwnGoals ?? 0;
      const awayOwnGoals = args.awayOwnGoals ?? 0;

      if (homeOwnGoals < 0 || awayOwnGoals < 0) {
        throw new Error("Los autogoles no pueden ser negativos");
      }
      if (!Number.isInteger(homeOwnGoals) || !Number.isInteger(awayOwnGoals)) {
        throw new Error("Los autogoles deben ser numeros enteros");
      }
      if (homeOwnGoals > h || awayOwnGoals > a) {
        throw new Error("Los autogoles no pueden superar el numero de goles del equipo");
      }

      const homeScorers = args.homeScorers ?? [];
      const awayScorers = args.awayScorers ?? [];

      // Los autogoles cuentan para el marcador pero no llevan goleador propio.
      if (homeScorers.length !== h - homeOwnGoals) {
        throw new Error("Debes indicar exactamente un goleador por cada gol del equipo local que no sea autogol");
      }

      if (awayScorers.length !== a - awayOwnGoals) {
        throw new Error("Debes indicar exactamente un goleador por cada gol del equipo visitante que no sea autogol");
      }

      for (const playerId of homeScorers) {
        const player = await ctx.db.get(playerId);
        if (!player || player.teamId !== match.homeTeam) {
          throw new Error("Todos los goleadores locales deben pertenecer al equipo local");
        }
      }

      for (const playerId of awayScorers) {
        const player = await ctx.db.get(playerId);
        if (!player || player.teamId !== match.awayTeam) {
          throw new Error("Todos los goleadores visitantes deben pertenecer al equipo visitante");
        }
      }

      await ctx.db.patch(args.matchId, {
        homeScore: h,
        awayScore: a,
        homeScorers,
        awayScorers,
        homeOwnGoals,
        awayOwnGoals,
        resultUpdatedAt,
        status: "finished",
      });
    } else {
      await ctx.db.patch(args.matchId, {
        homeScore: undefined,
        awayScore: undefined,
        homeScorers: undefined,
        awayScorers: undefined,
        homeOwnGoals: undefined,
        awayOwnGoals: undefined,
        resultUpdatedAt,
        status: "scheduled",
      });
    }

    await recalculateLeaderboardInMutation(ctx);
  },
});
