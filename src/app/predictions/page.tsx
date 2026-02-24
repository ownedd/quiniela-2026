"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Calendar, Loader2, User } from "lucide-react";
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
      await submitPrediction({
        matchId,
        homeScore,
        awayScore,
      });
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold">Predicciones</h2>
          <p className="text-gray-400 font-medium">
            Selecciona un participante para ver sus predicciones
          </p>
        </div>

        <div className="glass-card p-6">
          <label className="block text-sm font-medium text-gray-400 mb-3">Participante</label>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 italic">No hay participantes en la tabla.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {leaderboard.map((u: any) => (
                <button
                  key={u._id}
                  onClick={() => setSelectedUserId(u._id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                    selectedUserId === u._id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                  )}
                >
                  {u.image ? (
                    <Image src={u.image} alt="" width={24} height={24} className="rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                  <span>{u.displayName?.trim() || u.name}</span>
                  <span className="text-xs opacity-75">({u.score} pts)</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedUserId ? (
          <div className="glass-card p-12 text-center text-gray-500">
            <p className="italic">Selecciona un participante para ver sus predicciones.</p>
          </div>
        ) : (
          <>
            {groups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setActiveGroup(group)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                      activeGroup === group ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                    )}
                  >
                    Grupo {group}
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-6">
              {(activeGroup ?? groups[0]) && matchesByGroup[activeGroup ?? groups[0]]?.length > 0 ? (
                matchesByGroup[activeGroup ?? groups[0]].map((match: any) => (
                  <MatchCardReadOnly
                    key={match._id}
                    match={match}
                    prediction={selectedUserPredictions.find((p: any) => p.matchId === match._id)}
                  />
                ))
              ) : (
                <div className="glass-card p-12 text-center text-gray-500">
                  <p className="italic">Selecciona un grupo para ver los partidos.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">Mis Predicciones</h2>
        <p className="text-gray-400 font-medium">Define tus resultados antes del inicio del mundial</p>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={cn(
                "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                activeGroup === group ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
              )}
            >
              Grupo {group}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6">
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
          <div className="glass-card p-12 text-center text-gray-500">
            <p className="italic">
              {groups.length === 0 ? "Cargando partidos o no hay partidos disponibles..." : "Selecciona un grupo para ver los partidos."}
            </p>
          </div>
        )}
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
    <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-500/30 transition-all">
      <div className="flex flex-col gap-1 items-center md:items-start min-w-[120px]">
        <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">Grupo {match.group}</span>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <Calendar className="w-3 h-3" />
          {new Date(match.date).toLocaleDateString()}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-12 flex-1 justify-center">
        <div className="flex flex-col items-center gap-2 flex-1 text-center">
          <div className="w-14 h-14 rounded-full mb-1 border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {homeFlagUrl ? (
              <Image src={homeFlagUrl} alt={homeName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-xl font-bold text-gray-400">{homeName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-lg">{homeName}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-2xl font-bold">
            {prediction?.homeScore ?? "-"}
          </span>
          <span className="text-2xl font-bold text-gray-600">vs</span>
          <span className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-2xl font-bold">
            {prediction?.awayScore ?? "-"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 text-center">
          <div className="w-14 h-14 rounded-full mb-1 border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {awayFlagUrl ? (
              <Image src={awayFlagUrl} alt={awayName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-xl font-bold text-gray-400">{awayName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-lg">{awayName}</span>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, prediction, onSave, isSaving, locked }: any) {
  const [homeScore, setHomeScore] = useState(prediction?.homeScore ?? "");
  const [awayScore, setAwayScore] = useState(prediction?.awayScore ?? "");

  const hasChanged = prediction?.homeScore !== Number(homeScore) || prediction?.awayScore !== Number(awayScore);

  const homeName = match.homeTeamDetails?.name || (typeof match.homeTeam === "string" ? match.homeTeam : "TBD");
  const awayName = match.awayTeamDetails?.name || (typeof match.awayTeam === "string" ? match.awayTeam : "TBD");
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;

  return (
    <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-500/30 transition-all">
      <div className="flex flex-col gap-1 items-center md:items-start min-w-[120px]">
        <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">Grupo {match.group}</span>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <Calendar className="w-3 h-3" />
          {new Date(match.date).toLocaleDateString()}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-12 flex-1 justify-center">
        <div className="flex flex-col items-center gap-2 flex-1 text-center">
          <div className="w-14 h-14 rounded-full mb-1 border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {homeFlagUrl ? (
              <Image src={homeFlagUrl} alt={homeName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-xl font-bold text-gray-400">{homeName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-lg">{homeName}</span>
        </div>

        <div className="flex items-center gap-3">
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
            className={cn(
              "w-14 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              locked && "opacity-50 cursor-not-allowed"
            )}
            placeholder="0"
          />
          <span className="text-2xl font-bold text-gray-600">vs</span>
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
            className={cn(
              "w-14 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              locked && "opacity-50 cursor-not-allowed"
            )}
            placeholder="0"
          />
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 text-center">
          <div className="w-14 h-14 rounded-full mb-1 border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {awayFlagUrl ? (
              <Image src={awayFlagUrl} alt={awayName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-xl font-bold text-gray-400">{awayName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-lg">{awayName}</span>
        </div>
      </div>

      <button
        onClick={() => onSave(match._id, Number(homeScore), Number(awayScore))}
        disabled={locked || !hasChanged || isSaving || homeScore === "" || awayScore === ""}
        className={cn(
          "w-full md:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
          hasChanged && !isSaving && "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
          !hasChanged && "bg-white/5 text-gray-500 cursor-not-allowed",
          isSaving && "bg-blue-600/50 text-white cursor-wait"
        )}
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Guardar</span>
          </>
        )}
      </button>
    </div>
  );
}
