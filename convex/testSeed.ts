import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { recalculateLeaderboardInMutation } from "./scoring";

/** Clerk IDs inventados; no inician sesión en Clerk pero aparecen en la quiniela. */
const SEED_CLERK_PREFIX = "seed_demo_";
const SEED_USER_COUNT = 30;

function randomScores(userIndex: number, matchIndex: number): { homeScore: number; awayScore: number } {
  const homeSeed = userIndex * 10007 + matchIndex * 30011;
  const awaySeed = userIndex * 541 + matchIndex * 9973 + 1;
  return {
    homeScore: ((homeSeed % 5) + 5) % 5,
    awayScore: ((awaySeed % 5) + 5) % 5,
  };
}

/**
 * Inserta usuarios de prueba y predicciones (todos los partidos + bonus).
 * Idempotente respecto a corridas anteriores: borra solo usuarios con clerkId `seed_demo_*` y sus predicciones.
 * Requiere datos de torneo cargados (`matches.seed`).
 */
export const seedUsersAndPredictions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const ensureGroup = async (name: string, invitationCode: string) => {
      const existing = await ctx.db
        .query("quinielaGroups")
        .withIndex("by_invitationCode", (q) => q.eq("invitationCode", invitationCode))
        .unique();
      if (existing) return existing;
      const id = await ctx.db.insert("quinielaGroups", {
        name,
        invitationCode,
        createdAt: now,
      });
      const created = await ctx.db.get(id);
      if (!created) throw new Error(`No se pudo crear el grupo ${name}`);
      return created;
    };

    const groupA = await ensureGroup("Demo A", "DEMOA");
    const groupB = await ensureGroup("Demo B", "DEMOB");

    const allUsers = await ctx.db.query("users").collect();
    const seedUsers = allUsers.filter((u) => u.clerkId?.startsWith(SEED_CLERK_PREFIX));

    for (const u of seedUsers) {
      const preds = await ctx.db
        .query("predictions")
        .withIndex("by_user_match", (q) => q.eq("userId", u._id))
        .collect();
      for (const p of preds) await ctx.db.delete(p._id);

      const bonus = await ctx.db
        .query("bonusPredictions")
        .withIndex("by_userId", (q) => q.eq("userId", u._id))
        .unique();
      if (bonus) await ctx.db.delete(bonus._id);

      await ctx.db.delete(u._id);
    }

    const matches = await ctx.db.query("matches").order("asc").collect();
    if (matches.length === 0) {
      throw new Error("No hay partidos. Ejecuta primero la mutación matches.seed");
    }

    const [players, teams] = await Promise.all([
      ctx.db.query("players").collect(),
      ctx.db.query("teams").collect(),
    ]);
    if (players.length === 0) {
      throw new Error("No hay jugadores. Ejecuta primero la mutación matches.seed");
    }
    if (teams.length < 2) {
      throw new Error("No hay equipos. Ejecuta primero la mutación matches.seed");
    }

    const userIds: Id<"users">[] = [];
    for (let i = 1; i <= SEED_USER_COUNT; i++) {
      const groupId = i % 2 === 0 ? groupB._id : groupA._id;
      const id = await ctx.db.insert("users", {
        name: `Usuario prueba ${i}`,
        email: `prueba${i}@seed.quiniela.local`,
        displayName: `Prueba ${i}`,
        score: 0,
        clerkId: `${SEED_CLERK_PREFIX}${String(i).padStart(2, "0")}`,
        isAdmin: false,
        groupId,
      });
      userIds.push(id);
    }

    let predictionsInserted = 0;
    for (let ui = 0; ui < userIds.length; ui++) {
      const userId = userIds[ui]!;
      for (let mi = 0; mi < matches.length; mi++) {
        const match = matches[mi]!;
        const { homeScore, awayScore } = randomScores(ui, mi);
        await ctx.db.insert("predictions", {
          userId,
          matchId: match._id,
          homeScore,
          awayScore,
        });
        predictionsInserted++;
      }

      await ctx.db.insert("bonusPredictions", {
        userId,
        topScorer: players[ui % players.length]!._id,
        mostGoalsTeam: teams[(ui * 2) % teams.length]!._id,
        leastConcededTeam: teams[(ui * 3 + 1) % teams.length]!._id,
      });
    }

    await recalculateLeaderboardInMutation(ctx);

    return {
      usersInserted: SEED_USER_COUNT,
      predictionsInserted,
      bonusRowsInserted: SEED_USER_COUNT,
      matchesCount: matches.length,
    };
  },
});
