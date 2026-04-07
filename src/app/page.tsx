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

const emptyAutoBonusDisplay: AutoBonusDisplay = {
  topScorerLines: [],
  mostGoalsLines: [],
  leastConcededLines: [],
};

export default function Home() {
  const { isLoaded, user } = useUser();
  const users = useQuery(api.users.leaderboard) as LeaderboardRow[] | undefined;
  const settings = useQuery(api.tournamentSettings.get);
  const teamsQuery = useQuery(api.teams.list);
  const playersQuery = useQuery(api.bonusPredictions.getPlayers);
  const matchesByGroup = useQuery(api.matches.byGroup) ?? {};
  const userPredictions = useQuery(api.predictions.getMine, isLoaded && user ? {} : "skip") ?? [];
  const [showAll, setShowAll] = useState(false);

  const displayedUsers = showAll ? users : users?.slice(0, 3);

  const totalMatches = Object.values(matchesByGroup).reduce((acc, group) => acc + group.length, 0);
  const completedPredictions = userPredictions.length;
  const missingPredictions = totalMatches - completedPredictions;
  const predictionsLocked = settings?.predictionsLocked ?? false;

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
      <section className="glass-card-gold p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
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
            displayedUsers.map((user, index) => (
              <div
                key={user._id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all hover-lift ${
                  index === 0
                    ? "bg-gold/[0.08] border border-gold/20"
                    : index === 1
                      ? "bg-white/[0.04] border border-white/5"
                      : index === 2
                        ? "bg-white/[0.03] border border-white/5"
                        : "bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-center w-8 shrink-0">
                  {index === 0 ? (
                    <Medal className="text-gold w-6 h-6 drop-shadow-[0_0_6px_rgba(212,168,67,0.4)]" />
                  ) : index === 1 ? (
                    <Medal className="text-gray-300 w-5 h-5" />
                  ) : index === 2 ? (
                    <Medal className="text-amber-700 w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold text-gray-500 font-display">{index + 1}</span>
                  )}
                </div>

                <div
                  className={`w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white/5 ${
                    index === 0 ? "border-2 border-gold/40 shadow-[0_0_12px_rgba(212,168,67,0.15)]" : "border border-white/10"
                  }`}
                >
                  {user.image ? (
                    <Image src={user.image} alt={user.displayName ?? ""} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${index === 0 ? "text-gold-light" : ""}`}>{user.displayName ?? "Participante"}</p>
                </div>

                <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap font-display ${
                      index === 0 ? "bg-gold/15 text-gold border border-gold/30" : "bg-white/5 text-gray-300 border border-white/10"
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
              {missingPredictions > 0 ? (
                <>
                  Te falta{missingPredictions > 1 ? "n" : ""} <span className="text-gold font-semibold">{missingPredictions}</span> prediccion
                  {missingPredictions > 1 ? "es" : ""} por llenar.
                </>
              ) : (
                <>Listo. Puedes cambiar tus predicciones hasta el comienzo del mundial.</>
              )}
            </p>
            <Link href="/predictions" className="btn-gold inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 text-sm gap-2">
              {missingPredictions > 0 ? "Comenzar Predicciones" : "Ver Mis Predicciones"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
