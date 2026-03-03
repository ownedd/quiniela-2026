"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy, Medal, User, Loader2, CheckCircle2, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const users = useQuery(api.users.leaderboard);
  const [showAll, setShowAll] = useState(false);

  const displayedUsers = showAll ? users : users?.slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Leaderboard */}
      <section className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <Trophy className="text-yellow-400 w-6 h-6 shrink-0" />
          <h2 className="text-lg sm:text-xl font-bold">Tabla de Posiciones</h2>
        </div>

        <div className="space-y-3">
          {users === undefined ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Cargando participantes...</p>
            </div>
          ) : displayedUsers && displayedUsers.length > 0 ? (
            displayedUsers.map((user, index) => (
              <div key={user._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className="flex items-center justify-center w-8 shrink-0">
                  {index === 0 ? (
                    <Medal className="text-yellow-400 w-5 h-5" />
                  ) : index === 1 ? (
                    <Medal className="text-gray-400 w-5 h-5" />
                  ) : index === 2 ? (
                    <Medal className="text-amber-600 w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold text-gray-500">{index + 1}</span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shrink-0 flex items-center justify-center bg-white/5">
                  {user.image ? (
                    <Image src={user.image} alt={user.displayName?.trim() || user.name} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.displayName?.trim() || user.name}</p>
                </div>

                <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border border-blue-500/20 whitespace-nowrap shrink-0">
                  {user.score} pts
                </span>
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
            className="w-full mt-4 py-2.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors rounded-xl bg-blue-500/5 hover:bg-blue-500/10"
          >
            Ver Ranking Completo
          </button>
        )}
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full mt-4 py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-300 transition-colors rounded-xl bg-white/5 hover:bg-white/10"
          >
            Mostrar menos
          </button>
        )}
      </section>

      {/* Como ganar puntos */}
      <section className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="text-blue-400 w-5 h-5 shrink-0" />
          <h3 className="font-bold text-base sm:text-lg">Como ganar puntos?</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">Resultado exacto:</span> <span className="text-gray-400">3 puntos por cada marcador acertado.</span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                <span className="text-white font-bold">Ganador o empate:</span> <span className="text-gray-400">1 punto por acertar la tendencia.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proximos Pasos - Banner CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-blue-900/30 to-purple-900/20 border border-blue-500/20 p-5 sm:p-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-blue-400 shrink-0" />
            <h3 className="font-bold text-lg">Proximos Pasos</h3>
          </div>
          <p className="text-sm text-gray-300 mb-4 leading-relaxed">
            Ve a la seccion de <span className="text-white font-semibold">Mis Predicciones</span> para completar tu quiniela antes del pitazo inicial.
          </p>
          <Link
            href="/predictions"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm"
          >
            Comenzar Predicciones
          </Link>
        </div>
      </section>
    </div>
  );
}
