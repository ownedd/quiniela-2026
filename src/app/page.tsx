"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Trophy,
  Medal,
  User,
  Loader2,
  CheckCircle2,
  Shield,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { AutoBonusResultsSection } from "@/components/AutoBonusResultsSection";
import { computeAutoBonusDisplay, type AutoBonusDisplay } from "@/lib/autoBonusLines";
import type { Id } from "../../convex/_generated/dataModel";

type LeaderboardRow = {
  _id: Id<"users">;
  displayName?: string;
  image?: string | null;
  score: number;
  bonusPoints: number;
};

type RankedLeaderboardRow = LeaderboardRow & {
  rank: number;
};

type MatchWithTeams = {
  _id: Id<"matches">;
  homeTeamDetails: { name: string; code: string; flagUrl?: string } | null;
  awayTeamDetails: { name: string; code: string; flagUrl?: string } | null;
  resultUpdatedAt?: number;
};

const emptyAutoBonusDisplay: AutoBonusDisplay = {
  topScorerLines: [],
  mostGoalsLines: [],
  leastConcededLines: [],
};

export default function Home() {
  const { isLoaded, user } = useUser();
  const users = useQuery(api.users.leaderboard) as LeaderboardRow[] | undefined;
  const settings = useQuery(api.tournamentSettings.get);
  const predictionsLocked = settings?.predictionsLocked ?? false;
  const teamsQuery = useQuery(api.teams.list);
  const playersQuery = useQuery(api.bonusPredictions.getPlayers);
  const matchesByGroupQuery = useQuery(api.matches.byGroup);
  const userPredictionsQuery = useQuery(
    api.predictions.getMine,
    isLoaded && user && settings !== undefined && !predictionsLocked ? {} : "skip"
  );
  const matchesByGroup = useMemo(() => matchesByGroupQuery ?? {}, [matchesByGroupQuery]);
  const userPredictions = userPredictionsQuery ?? [];
  const [showAll, setShowAll] = useState(false);

  const lastUpdatedMatch = useMemo(() => {
    const allMatches = Object.values(matchesByGroup).flat() as MatchWithTeams[];

    return allMatches.reduce<MatchWithTeams | null>((latest, match) => {
      if (match.resultUpdatedAt === undefined) return latest;
      if (latest === null || match.resultUpdatedAt > (latest.resultUpdatedAt ?? 0)) return match;
      return latest;
    }, null);
  }, [matchesByGroup]);

  const lastUpdatedMatchLabel = useMemo(() => {
    if (!lastUpdatedMatch?.resultUpdatedAt) return null;

    const homeTeamName = lastUpdatedMatch.homeTeamDetails?.name ?? "Local";
    const awayTeamName = lastUpdatedMatch.awayTeamDetails?.name ?? "Visitante";
    const updatedTime = new Intl.DateTimeFormat("es-VE", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(lastUpdatedMatch.resultUpdatedAt));
    const updatedDate = new Intl.DateTimeFormat("es-VE", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(lastUpdatedMatch.resultUpdatedAt));

    return `Ultimo partido actualizado: ${homeTeamName} vs ${awayTeamName} a las ${updatedTime} del ${updatedDate}`;
  }, [lastUpdatedMatch]);

  const rankedUsers = useMemo<RankedLeaderboardRow[] | undefined>(() => {
    if (!users) return undefined;

    let previousScore: number | null = null;
    let previousRank = 0;

    return users.map((leaderboardUser, index) => {
      const rank = previousScore === leaderboardUser.score ? previousRank : index + 1;
      previousScore = leaderboardUser.score;
      previousRank = rank;

      return {
        ...leaderboardUser,
        rank,
      };
    });
  }, [users]);
  const displayedUsers = showAll ? rankedUsers : rankedUsers?.slice(0, 3);

  const predictionsProgressLoading = !isLoaded || matchesByGroupQuery === undefined || (!!user && userPredictionsQuery === undefined);
  const totalMatches = predictionsProgressLoading ? undefined : Object.values(matchesByGroup).reduce((acc, group) => acc + group.length, 0);
  const completedPredictions = predictionsProgressLoading ? undefined : userPredictions.length;
  const missingPredictions = totalMatches === undefined || completedPredictions === undefined ? undefined : totalMatches - completedPredictions;
  const missingPredictionsCount = missingPredictions ?? 0;

  const autoBonusDisplay = useMemo(() => {
    if (!predictionsLocked) {
      return emptyAutoBonusDisplay;
    }
    return computeAutoBonusDisplay(
      settings ?? null,
      (playersQuery ?? []).map((p) => ({
        _id: p._id,
        name: p.name,
        teamName: p.teamName,
      })),
      (teamsQuery ?? []).map((t) => ({
        _id: t._id,
        name: t.name,
        group: t.group,
      }))
    );
  }, [predictionsLocked, settings, playersQuery, teamsQuery]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Leaderboard */}
      <div className="space-y-2">
        {lastUpdatedMatchLabel ? (
          <div className="px-1">
            <div className="inline-flex max-w-full items-start gap-2 rounded-full border border-gold/15 bg-gold/[0.06] px-3 py-1 text-[11px] font-medium text-gold-light/90">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(212,168,67,0.7)]" />
              <span className="min-w-0 leading-snug">{lastUpdatedMatchLabel}</span>
            </div>
          </div>
        ) : null}

        <section className="glass-card-gold p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 animate-pulse-glow">
              <Trophy className="text-gold w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display uppercase tracking-wide">Tabla de Posiciones</h2>
          </div>

          <div className="space-y-2 stagger-children">
          {users === undefined ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <p className="text-sm text-gray-500">Cargando participantes...</p>
            </div>
          ) : displayedUsers && displayedUsers.length > 0 ? (
            displayedUsers.map((user) => (
              <div
                key={user._id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all hover-lift ${
                  user.rank === 1
                    ? "bg-gold/[0.08] border border-gold/20"
                    : user.rank === 2
                      ? "bg-white/[0.04] border border-white/5"
                      : user.rank === 3
                        ? "bg-white/[0.03] border border-white/5"
                        : "bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-center w-8 shrink-0">
                  {user.rank === 1 ? (
                    <Medal className="text-gold w-6 h-6 drop-shadow-[0_0_6px_rgba(212,168,67,0.4)]" />
                  ) : user.rank === 2 ? (
                    <Medal className="text-gray-300 w-5 h-5" />
                  ) : user.rank === 3 ? (
                    <Medal className="text-amber-700 w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold text-gray-500 font-display">{user.rank}</span>
                  )}
                </div>

                <div
                  className={`w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white/5 ${
                    user.rank === 1 ? "border-2 border-gold/40 shadow-[0_0_12px_rgba(212,168,67,0.15)]" : "border border-white/10"
                  }`}
                >
                  {user.image ? (
                    <Image src={user.image} alt={user.displayName ?? ""} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${user.rank === 1 ? "text-gold-light" : ""}`}>{user.displayName ?? "Participante"}</p>
                </div>

                <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap font-display ${
                      user.rank === 1 ? "bg-gold/15 text-gold border border-gold/30" : "bg-white/5 text-gray-300 border border-white/10"
                    }`}
                  >
                    {user.score} pts
                  </span>
                  {(user.bonusPoints ?? 0) > 0 ? (
                    <span className="text-[10px] text-gray-500 font-display tabular-nums">
                      incluye {user.bonusPoints ?? 0} de especiales
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-gray-500">
              <User className="w-10 h-10 opacity-20" />
              <p className="text-sm">No hay participantes aun.</p>
            </div>
          )}
        </div>

        {users && users.length > 3 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-4 py-2.5 text-sm font-semibold text-gold hover:text-gold-light transition-colors rounded-xl bg-gold/5 hover:bg-gold/10 cursor-pointer"
          >
            Ver Ranking Completo
          </button>
        )}
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full mt-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-300 transition-colors rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
          >
            Mostrar menos
          </button>
        )}
        </section>
      </div>

      {predictionsLocked ? <AutoBonusResultsSection variant="home" display={autoBonusDisplay} /> : null}

      {/* Como ganar puntos */}
      <section className="glass-card p-4 sm:p-6 border-l-2 border-l-gold/40">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="text-gold w-5 h-5 shrink-0" />
          <h3 className="font-bold text-base sm:text-lg font-display uppercase tracking-wide">Como ganar puntos?</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">Resultado exacto:</span> <span className="text-gray-400">3 puntos cada uno.</span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">Ganador o empate:</span> <span className="text-gray-400">1 punto cada uno.</span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">Mejor goleador:</span>{" "}
                <span className="text-gray-400">
                  10 puntos. Si hay empate entre varios, acertar con cualquiera de ellos vale.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">Equipo con mas goles anotados:</span>{" "}
                <span className="text-gray-400">
                  10 puntos. Empates entre equipos: cualquiera de los empatados cuenta.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">Equipo con menos goles recibidos:</span>{" "}
                <span className="text-gray-400">
                  10 puntos. Misma regla si hay empate en la mejor defensa.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proximos Pasos — Banner CTA */}
      {!predictionsLocked && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold/10 via-gold-dark/15 to-navy-light border border-gold/20 p-5 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,168,67,0.08),transparent_60%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-gold shrink-0" />
              <h3 className="font-bold text-lg font-display uppercase tracking-wide">Proximos Pasos</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              {predictionsProgressLoading ? (
                <>Cargando el avance de tus predicciones...</>
              ) : missingPredictionsCount > 0 ? (
                <>
                  Te falta{missingPredictionsCount > 1 ? "n" : ""} <span className="text-gold font-semibold">{missingPredictionsCount}</span> prediccion
                  {missingPredictionsCount > 1 ? "es" : ""} por llenar.
                </>
              ) : (
                <>Listo. Puedes cambiar tus predicciones hasta el comienzo del mundial.</>
              )}
            </p>
            <Link href="/predictions" className="btn-gold inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 text-sm gap-2">
              {predictionsProgressLoading ? "Abrir Predicciones" : missingPredictionsCount > 0 ? "Comenzar Predicciones" : "Ver Mis Predicciones"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
