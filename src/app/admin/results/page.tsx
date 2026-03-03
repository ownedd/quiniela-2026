"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Save, Calendar, Loader2, Lock, Unlock } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function AdminResultsPage() {
  const { user, isLoaded } = useUser();
  const isAdmin = useQuery(api.users.isAdmin, isLoaded && user ? {} : "skip");
  const canBootstrap = useQuery(api.users.canBootstrapAdmin, isLoaded && user ? {} : "skip");
  const bootstrapAsFirstAdmin = useMutation(api.users.bootstrapAsFirstAdmin);
  const settings = useQuery(api.tournamentSettings.get);
  const matchesByGroup = useQuery(api.matches.byGroup) ?? {};
  const setPredictionsLocked = useMutation(api.tournamentSettings.setPredictionsLocked);
  const setResult = useMutation(api.matches.setResult);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const groups = Object.keys(matchesByGroup).sort();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) setActiveGroup(groups[0]);
  }, [groups, activeGroup]);

  const handleSetResult = async (matchId: string, homeScore: number, awayScore: number) => {
    setSavingMatch(matchId);
    setMessage(null);
    try {
      await setResult({ matchId: matchId as any, homeScore, awayScore });
      setMessage({ type: "success", text: "Resultado guardado. La tabla se actualizara automaticamente." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    }
    setTimeout(() => setSavingMatch(null), 1000);
  };

  const handleToggleLock = async () => {
    setTogglingLock(true);
    setMessage(null);
    try {
      const newLocked = !settings?.predictionsLocked;
      await setPredictionsLocked({ locked: newLocked });
      setMessage({
        type: "success",
        text: newLocked ? "Predicciones bloqueadas" : "Predicciones desbloqueadas",
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setTogglingLock(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleBootstrap = async () => {
    setBootstrapping(true);
    setMessage(null);
    try {
      await bootstrapAsFirstAdmin();
      setMessage({ type: "success", text: "Ahora eres administrador." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setBootstrapping(false);
    }
  };

  if (isAdmin === false) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        {message && (
          <p className={cn("text-sm", message.type === "success" ? "text-green-400" : "text-red-400")}>
            {message.text}
          </p>
        )}
        <div className="glass-card p-8 text-center">
          <Lock className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Acceso denegado</h2>
          <p className="text-gray-400 mb-6 text-sm">Solo administradores pueden acceder a esta seccion.</p>
          {canBootstrap && (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Eres el organizador? Conviertete en el primer administrador.</p>
              <button
                onClick={handleBootstrap}
                disabled={bootstrapping}
                className="px-6 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 text-sm"
              >
                {bootstrapping ? <Loader2 className="w-5 h-5 animate-spin inline" /> : "Ser administrador"}
              </button>
            </div>
          )}
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const locked = settings?.predictionsLocked ?? false;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Panel de Administracion</h2>
        <p className="text-gray-400 text-sm mt-1">Bloquea predicciones y carga resultados oficiales</p>
      </div>

      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold mb-1">Predicciones</h3>
            <p className="text-sm text-gray-400">
              {locked ? "Cerradas desde el inicio del Mundial" : "Abiertas para edicion"}
            </p>
          </div>
          <button
            onClick={handleToggleLock}
            disabled={togglingLock}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto text-sm",
              locked ? "bg-amber-600 hover:bg-amber-500" : "bg-green-600 hover:bg-green-500",
              "text-white shadow-lg disabled:opacity-50"
            )}
          >
            {togglingLock ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : locked ? (
              <>
                <Unlock className="w-4 h-4" />
                Desbloquear predicciones
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Bloquear predicciones
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <p className={cn("text-sm", message.type === "success" ? "text-green-400" : "text-red-400")}>
          {message.text}
        </p>
      )}

      <div>
        <h3 className="font-bold mb-4">Resultados oficiales</h3>
        {groups.length > 0 && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-5">
            <div className="flex gap-2 w-max">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={cn(
                    "px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap",
                    activeGroup === group
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                  )}
                >
                  Grupo {group}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-4">
          {(activeGroup ?? groups[0]) && matchesByGroup[activeGroup ?? groups[0]]?.length > 0 ? (
            matchesByGroup[activeGroup ?? groups[0]].map((match: { _id: string }) => (
              <AdminMatchCard
                key={match._id}
                match={match}
                onSave={handleSetResult}
                isSaving={savingMatch === match._id}
              />
            ))
          ) : (
            <div className="glass-card p-8 text-center text-gray-500">
              <p className="italic text-sm">
                {groups.length === 0 ? "Cargando partidos o no hay partidos disponibles..." : "Selecciona un grupo para ver los partidos."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminMatchCard({
  match,
  onSave,
  isSaving,
}: {
  match: any;
  onSave: (matchId: string, homeScore: number, awayScore: number) => void;
  isSaving: boolean;
}) {
  const [homeScore, setHomeScore] = useState<string>(
    match.homeScore !== undefined && match.homeScore !== null ? String(match.homeScore) : ""
  );
  const [awayScore, setAwayScore] = useState<string>(
    match.awayScore !== undefined && match.awayScore !== null ? String(match.awayScore) : ""
  );

  const homeName = match.homeTeamDetails?.name || "TBD";
  const awayName = match.awayTeamDetails?.name || "TBD";
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;
  const isFinished = match.status === "finished";
  const hasChanged =
    (match.homeScore ?? "") !== homeScore || (match.awayScore ?? "") !== awayScore;
  const canSave =
    hasChanged &&
    homeScore !== "" &&
    awayScore !== "" &&
    !isNaN(Number(homeScore)) &&
    !isNaN(Number(awayScore)) &&
    Number(homeScore) >= 0 &&
    Number(awayScore) >= 0;

  const inputClass =
    "w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-xl text-center text-lg sm:text-xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div
      className={cn(
        "glass-card p-4 sm:p-5",
        isFinished && "border-green-500/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">
            Grupo {match.group}
          </span>
          {isFinished && (
            <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded">
              Finalizado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3 shrink-0" />
          {new Date(match.date).toLocaleDateString()}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {homeFlagUrl ? (
              <Image src={homeFlagUrl} alt={homeName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-lg font-bold text-gray-400">{homeName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-xs sm:text-sm text-center truncate max-w-full">{homeName}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            min={0}
            value={homeScore}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
            }}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return setHomeScore("");
              const n = Number(v);
              if (!isNaN(n) && n >= 0) setHomeScore(v);
            }}
            className={inputClass}
            placeholder="0"
          />
          <span className="text-sm font-bold text-gray-500">vs</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
            }}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return setAwayScore("");
              const n = Number(v);
              if (!isNaN(n) && n >= 0) setAwayScore(v);
            }}
            className={inputClass}
            placeholder="0"
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {awayFlagUrl ? (
              <Image src={awayFlagUrl} alt={awayName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-lg font-bold text-gray-400">{awayName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-xs sm:text-sm text-center truncate max-w-full">{awayName}</span>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => onSave(match._id, Number(homeScore), Number(awayScore))}
          disabled={!canSave || isSaving}
          className={cn(
            "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm",
            canSave && !isSaving && "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
            !canSave && "bg-white/5 text-gray-500 cursor-not-allowed",
            isSaving && "bg-blue-600/50 text-white cursor-wait"
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar resultado</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
