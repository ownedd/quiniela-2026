"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Calendar, Loader2, User, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import type { Id } from "../../../convex/_generated/dataModel";

export default function Predictions() {
  const { user, isLoaded } = useUser();
  const matchesByGroup = useQuery(api.matches.byGroup) || {};
  const settings = useQuery(api.tournamentSettings.get);
  const leaderboard = useQuery(api.users.leaderboard) ?? [];
  const submitPrediction = useMutation(api.predictions.submit);
  const userPredictions = useQuery(api.predictions.getMine, isLoaded && user ? {} : "skip") || [];
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const groups = Object.keys(matchesByGroup).sort();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const predictionsLocked = settings?.predictionsLocked ?? false;
  const selectedUserPredictions = useQuery(
    api.predictions.getByUserId,
    predictionsLocked && selectedUserId ? { userId: selectedUserId } : "skip"
  ) ?? [];

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) setActiveGroup(groups[0]);
  }, [groups, activeGroup]);

  const handleSave = async (matchId: any, homeScore: number, awayScore: number) => {
    setSaving(matchId);
    try {
      await submitPrediction({ matchId, homeScore, awayScore });
    } catch (error) {
      console.error(error);
    }
    setTimeout(() => setSaving(null), 1000);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (predictionsLocked) {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Predicciones</h2>
          <p className="text-gray-400 text-sm mt-1">
            Selecciona un participante para ver sus predicciones
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Participante</label>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No hay participantes en la tabla.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {leaderboard.map((u: any) => (
                <button
                  key={u._id}
                  onClick={() => setSelectedUserId(u._id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all text-sm cursor-pointer",
                    selectedUserId === u._id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                  )}
                >
                  {u.image ? (
                    <Image src={u.image} alt="" width={24} height={24} className="rounded-full" unoptimized />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                  <span className="truncate max-w-[100px]">{u.displayName ?? "Participante"}</span>
                  <span className="text-xs opacity-75">({u.score} pts)</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedUserId ? (
          <div className="glass-card p-8 text-center text-gray-500">
            <p className="italic text-sm">Selecciona un participante para ver sus predicciones.</p>
          </div>
        ) : (
          <>
            <GroupTabs groups={groups} activeGroup={activeGroup} onChange={setActiveGroup} />
            <div className="grid gap-4">
              {(activeGroup ?? groups[0]) && matchesByGroup[activeGroup ?? groups[0]]?.length > 0 ? (
                matchesByGroup[activeGroup ?? groups[0]].map((match: any) => (
                  <MatchCardReadOnly
                    key={match._id}
                    match={match}
                    prediction={selectedUserPredictions.find((p: any) => p.matchId === match._id)}
                  />
                ))
              ) : (
                <div className="glass-card p-8 text-center text-gray-500">
                  <p className="italic text-sm">Selecciona un grupo para ver los partidos.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Mis Predicciones</h2>
        <p className="text-gray-400 text-sm mt-1">Define tus resultados antes del inicio del mundial</p>
      </div>

      <GroupTabs groups={groups} activeGroup={activeGroup} onChange={setActiveGroup} />

      <div className="grid gap-4">
        {(activeGroup ?? groups[0]) && matchesByGroup[activeGroup ?? groups[0]]?.length > 0 ? (
          matchesByGroup[activeGroup ?? groups[0]].map((match: any) => (
            <MatchCard
              key={match._id}
              match={match}
              prediction={userPredictions.find((p: any) => p.matchId === match._id)}
              onSave={handleSave}
              isSaving={saving === match._id}
              locked={false}
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
  );
}

function GroupTabs({
  groups,
  activeGroup,
  onChange,
}: {
  groups: string[];
  activeGroup: string | null;
  onChange: (g: string) => void;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="overflow-x-auto md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-2 flex-nowrap md:flex-wrap w-max md:w-full">
        {groups.map((group) => (
          <button
            key={group}
            onClick={() => onChange(group)}
            className={cn(
              "px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer",
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
  );
}

function MatchCardReadOnly({ match, prediction }: { match: any; prediction?: any }) {
  const homeName = match.homeTeamDetails?.name || "TBD";
  const awayName = match.awayTeamDetails?.name || "TBD";
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;

  return (
    <div className="glass-card p-4 sm:p-5 hover:border-blue-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">
          Grupo {match.group}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3 shrink-0" />
          {new Date(match.date).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
          <span className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg sm:text-xl font-bold">
            {prediction?.homeScore ?? "-"}
          </span>
          <span className="text-sm font-bold text-gray-500">vs</span>
          <span className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg sm:text-xl font-bold">
            {prediction?.awayScore ?? "-"}
          </span>
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
    </div>
  );
}

function MatchCard({ match, prediction, onSave, isSaving, locked }: any) {
  const [homeScore, setHomeScore] = useState(prediction?.homeScore ?? "");
  const [awayScore, setAwayScore] = useState(prediction?.awayScore ?? "");

  const hasChanged = prediction?.homeScore !== Number(homeScore) || prediction?.awayScore !== Number(awayScore);
  const hasPrediction = prediction?.homeScore !== undefined && prediction?.awayScore !== undefined;
  const justSaved = isSaving === false && !hasChanged && hasPrediction;

  const homeName = match.homeTeamDetails?.name || (typeof match.homeTeam === "string" ? match.homeTeam : "TBD");
  const awayName = match.awayTeamDetails?.name || (typeof match.awayTeam === "string" ? match.awayTeam : "TBD");
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;

  const inputClass = cn(
    "w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-xl text-center text-lg sm:text-xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    locked && "opacity-50 cursor-not-allowed"
  );

  return (
    <div className="glass-card p-4 sm:p-5 hover:border-blue-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">
          Grupo {match.group}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3 shrink-0" />
          {new Date(match.date).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
            disabled={locked}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
            }}
            onChange={(e) => {
              if (locked) return;
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
            disabled={locked}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
            }}
            onChange={(e) => {
              if (locked) return;
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
        {justSaved ? (
          <div className="flex items-center justify-center gap-2 py-2.5 text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Prediccion guardada correctamente
          </div>
        ) : (
          <button
            onClick={() => {
              const canSave = !locked && hasChanged && !isSaving && homeScore !== "" && awayScore !== "";
              if (canSave) onSave(match._id, Number(homeScore), Number(awayScore));
            }}
            disabled={locked || !hasChanged || isSaving || homeScore === "" || awayScore === ""}
            className={cn(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm",
              hasChanged && homeScore !== "" && awayScore !== "" && !isSaving && "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 cursor-pointer",
              (!hasChanged || homeScore === "" || awayScore === "") && "bg-white/5 text-gray-500 cursor-not-allowed",
              isSaving && "bg-blue-600/50 text-white cursor-wait"
            )}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{hasPrediction ? "Guardar" : "Guardar Prediccion"}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
