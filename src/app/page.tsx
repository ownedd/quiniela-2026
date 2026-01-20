"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy, Medal, User } from "lucide-react";

export default function Home() {
  // Use a fallback to avoid crash if Convex isn't fully set up/generated
  const users = useQuery(api.users.leaderboard) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <section className="glass-card p-8">
        <div className="flex items-center gap-4 mb-8">
          <Trophy className="text-yellow-400 w-8 h-8" />
          <h2 className="text-2xl font-semibold">Tabla de Posiciones</h2>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-gray-400">Posición</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-gray-400">Usuario</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-gray-400 text-right">Puntuación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length > 0 ? (
                // @ts-ignore
                users.map((user, index) => (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Medal className="text-yellow-400 w-5 h-5 animate-bounce" />}
                        {index === 1 && <Medal className="text-gray-400 w-5 h-5" />}
                        {index === 2 && <Medal className="text-amber-600 w-5 h-5" />}
                        <span className={index < 3 ? "font-bold text-white" : "text-gray-400"}>#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium group-hover:text-blue-400 transition-colors">{user.name}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/20">
                        {user.score} pts
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-12 h-12 opacity-20" />
                      <p>No hay participantes aún.</p>
                      <p className="text-sm italic">Conecta Convex y agrega competidores para comenzar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-blue-500 hover:scale-[1.02] transition-transform cursor-default">
          <h3 className="font-bold mb-2">¿Cómo ganar puntos?</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Resultado exacto: <span className="text-white font-bold">3 puntos</span></li>
            <li>• Acertar ganador o empate: <span className="text-white font-bold">1 punto</span></li>
          </ul>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-purple-500 hover:scale-[1.02] transition-transform cursor-default">
          <h3 className="font-bold mb-2">Próximos Pasos</h3>
          <p className="text-sm text-gray-400">
            Ve a la sección de <a href="/predictions" className="text-purple-400 hover:underline">Mis Predicciones</a> para completar tu quiniela antes del pitazo inicial.
          </p>
        </div>
      </div>
    </div>
  );
}
