import { mutation, query } from "./_generated/server";
import { teams, matches } from "./seedData";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("asc").collect();
    const results = [];
    for (const match of matches) {
      const homeTeam = await ctx.db.get(match.homeTeam);
      const awayTeam = await ctx.db.get(match.awayTeam);
      results.push({
        ...match,
        homeTeamDetails: homeTeam ? { name: homeTeam.name, code: homeTeam.code } : null,
        awayTeamDetails: awayTeam ? { name: awayTeam.name, code: awayTeam.code } : null,
      });
    }
    return results;
  },
});

export const byGroup = query({
  args: {},
  handler: async (ctx) => {
    const allMatches = await ctx.db.query("matches").collect();
    const populated = [];
    for (const match of allMatches) {
      const homeTeam = await ctx.db.get(match.homeTeam);
      const awayTeam = await ctx.db.get(match.awayTeam);
      populated.push({
        ...match,
        homeTeamDetails: homeTeam ? { name: homeTeam.name, code: homeTeam.code } : null,
        awayTeamDetails: awayTeam ? { name: awayTeam.name, code: awayTeam.code } : null,
      });
    }

    const grouped: Record<string, any[]> = {};
    for (const match of populated) {
      if (!grouped[match.group]) {
        grouped[match.group] = [];
      }
      grouped[match.group].push(match);
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
