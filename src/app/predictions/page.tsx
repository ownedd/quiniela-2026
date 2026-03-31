"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Calendar, Loader2, User, CheckCircle2, Download } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import type { Id } from "../../../convex/_generated/dataModel";

type MatchPrediction = {
  matchId: Id<"matches">;
  homeScore: number;
  awayScore: number;
};

type MatchDetails = {
  name: string;
  flagUrl?: string | null;
};

type MatchView = {
  _id: Id<"matches">;
  group: string;
  date: string;
  homeTeam: Id<"teams"> | string;
  awayTeam: Id<"teams"> | string;
  homeTeamDetails?: MatchDetails | null;
  awayTeamDetails?: MatchDetails | null;
};

type LeaderboardUser = {
  _id: Id<"users">;
  displayName?: string;
  image?: string | null;
  score: number;
};

function LocalDateTime({
  value,
  options,
}: {
  value: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  return (
    <time dateTime={value} suppressHydrationWarning>
      {new Date(value).toLocaleString("es-MX", options)}
    </time>
  );
}

export default function Predictions() {
  const { user, isLoaded } = useUser();
  const matchesByGroup = (useQuery(api.matches.byGroup) ?? {}) as Record<string, MatchView[]>;
  const settings = useQuery(api.tournamentSettings.get);
  const leaderboard = (useQuery(api.users.leaderboard) ?? []) as LeaderboardUser[];
  const submitPrediction = useMutation(api.predictions.submit);
  const userPredictions = (
    useQuery(api.predictions.getMine, isLoaded && user ? {} : "skip") ?? []
  ) as MatchPrediction[];
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const groups = Object.keys(matchesByGroup).sort();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const currentGroup = activeGroup ?? groups[0] ?? null;

  const predictionsLocked = settings?.predictionsLocked ?? false;
  const predictionsExport = useQuery(
    api.tournamentSettings.getPredictionsExport,
    isLoaded && user && predictionsLocked ? {} : "skip"
  );
  const selectedUserPredictions = (
    useQuery(
      api.predictions.getByUserId,
      predictionsLocked && selectedUserId ? { userId: selectedUserId } : "skip"
    ) ?? []
  ) as MatchPrediction[];

  const handleSave = async (matchId: Id<"matches">, homeScore: number, awayScore: number) => {
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
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
      </div>
    );
  }

  if (predictionsLocked) {
    return (
      <div className="space-y-5 animate-slide-up">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wide">Predicciones</h2>
          <p className="text-gray-400 text-sm mt-1">
            Selecciona un participante para ver sus predicciones
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          {predictionsExport?.status === "ready" && predictionsExport.url ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold font-display uppercase">Quinielas exportadas</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Descarga el archivo consolidado con una hoja por participante.
                </p>
              </div>
              <a
                href="/api/predictions/export"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-gold to-gold-dark text-[#0a0a0a] shadow-lg shadow-gold/20 text-sm"
              >
                <Download className="w-4 h-4" />
                Descargar {predictionsExport.filename}
              </a>
            </div>
          ) : predictionsExport?.status === "error" ? (
            <div>
              <h3 className="font-bold font-display uppercase text-red-400">Exportación no disponible</h3>
              <p className="text-sm text-gray-400 mt-1">
                {predictionsExport.error ?? "No se pudo generar quinielas.xlsx todavía."}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gold text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generando quinielas.xlsx. El enlace aparecerá aquí en cuanto esté listo.</span>
            </div>
          )}
        </div>

        <div className="glass-card p-4 sm:p-5">
          <label className="block text-xs font-medium text-gold/60 mb-3 uppercase tracking-wider font-display">Participante</label>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No hay participantes en la tabla.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {leaderboard.map((u) => (
                <button
                  key={u._id}
                  onClick={() => setSelectedUserId(u._id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all text-sm cursor-pointer",
                    selectedUserId === u._id
                      ? "bg-gold/20 text-gold border border-gold/30 shadow-lg shadow-gold/10"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-transparent"
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
            <GroupTabs groups={groups} activeGroup={currentGroup} onChange={setActiveGroup} />
            <div className="grid gap-4 stagger-children">
              {currentGroup && matchesByGroup[currentGroup]?.length > 0 ? (
                matchesByGroup[currentGroup].map((match) => (
                  <MatchCardReadOnly
                    key={match._id}
                    match={match}
                    prediction={selectedUserPredictions.find((prediction) => prediction.matchId === match._id)}
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
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wide">Mis Predicciones</h2>
        <p className="text-gray-400 text-sm mt-1">Define tus resultados antes del inicio del mundial</p>
      </div>

      <GroupTabs groups={groups} activeGroup={currentGroup} onChange={setActiveGroup} />

      <div className="grid gap-4 stagger-children">
        {currentGroup && matchesByGroup[currentGroup]?.length > 0 ? (
          matchesByGroup[currentGroup].map((match) => (
            <MatchCard
              key={match._id}
              match={match}
              prediction={userPredictions.find((prediction) => prediction.matchId === match._id)}
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
              "px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap cursor-pointer font-display",
              activeGroup === group
                ? "bg-gradient-to-r from-gold to-gold-dark text-[#0a0a0a] shadow-lg shadow-gold/20"
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

function MatchCardReadOnly({ match, prediction }: { match: MatchView; prediction?: MatchPrediction }) {
  const homeName = match.homeTeamDetails?.name || "TBD";
  const awayName = match.awayTeamDetails?.name || "TBD";
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;

  return (
    <div className="glass-card p-4 sm:p-5 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-widest text-gold font-bold bg-gold/10 px-2 py-0.5 rounded font-display">
          Grupo {match.group}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3 shrink-0" />
          <LocalDateTime
            value={match.date}
            options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {homeFlagUrl ? (
              <Image src={homeFlagUrl} alt={homeName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-lg font-bold text-gray-400 font-display">{homeName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-xs sm:text-sm text-center truncate max-w-full">{homeName}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg sm:text-xl font-bold font-display">
            {prediction?.homeScore ?? "-"}
          </span>
          <span className="text-sm font-bold text-gray-500">vs</span>
          <span className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg sm:text-xl font-bold font-display">
            {prediction?.awayScore ?? "-"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {awayFlagUrl ? (
              <Image src={awayFlagUrl} alt={awayName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-lg font-bold text-gray-400 font-display">{awayName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-xs sm:text-sm text-center truncate max-w-full">{awayName}</span>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  prediction,
  onSave,
  isSaving,
  locked,
}: {
  match: MatchView;
  prediction?: MatchPrediction;
  onSave: (matchId: Id<"matches">, homeScore: number, awayScore: number) => void;
  isSaving: boolean;
  locked: boolean;
}) {
  const [homeScore, setHomeScore] = useState<string>(
    prediction?.homeScore !== undefined ? String(prediction.homeScore) : ""
  );
  const [awayScore, setAwayScore] = useState<string>(
    prediction?.awayScore !== undefined ? String(prediction.awayScore) : ""
  );
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const prevSaving = useRef(false);

  useEffect(() => {
    if (prevSaving.current && !isSaving) {
      setShowSavedMsg(true);
      const timer = setTimeout(() => setShowSavedMsg(false), 2000);
      return () => clearTimeout(timer);
    }
    prevSaving.current = isSaving;
  }, [isSaving]);

  const hasChanged = prediction?.homeScore !== Number(homeScore) || prediction?.awayScore !== Number(awayScore);
  const hasPrediction = prediction?.homeScore !== undefined && prediction?.awayScore !== undefined;

  const homeName = match.homeTeamDetails?.name || (typeof match.homeTeam === "string" ? match.homeTeam : "TBD");
  const awayName = match.awayTeamDetails?.name || (typeof match.awayTeam === "string" ? match.awayTeam : "TBD");
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;

  const inputClass = cn(
    "w-11 h-11 sm:w-13 sm:h-13 bg-white/5 border border-white/10 rounded-xl text-center text-lg sm:text-xl font-bold font-display focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all score-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    locked && "opacity-50 cursor-not-allowed"
  );

  return (
    <div className="glass-card p-4 sm:p-5 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] uppercase tracking-widest text-gold font-bold bg-gold/10 px-2 py-0.5 rounded font-display">
          Grupo {match.group}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3 shrink-0" />
          <LocalDateTime
            value={match.date}
            options={{ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 overflow-hidden flex items-center justify-center bg-white/5 shrink-0">
            {homeFlagUrl ? (
              <Image src={homeFlagUrl} alt={homeName} width={56} height={56} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span className="text-lg font-bold text-gray-400 font-display">{homeName[0] || "?"}</span>
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
          <span className="text-sm font-bold text-gray-500 font-display">vs</span>
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
              <span className="text-lg font-bold text-gray-400 font-display">{awayName[0] || "?"}</span>
            )}
          </div>
          <span className="font-semibold text-xs sm:text-sm text-center truncate max-w-full">{awayName}</span>
        </div>
      </div>

      {(showSavedMsg || hasChanged || isSaving || !hasPrediction) && (
        <div className="mt-4">
          {showSavedMsg && !hasChanged ? (
            <div className="flex items-center justify-center gap-2 py-2.5 text-green text-sm font-medium">
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
                "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer",
                hasChanged && homeScore !== "" && awayScore !== "" && !isSaving && "btn-gold",
                (!hasChanged || homeScore === "" || awayScore === "") && "bg-white/5 text-gray-500 cursor-not-allowed",
                isSaving && "bg-gold/50 text-[#0a0a0a] cursor-wait"
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
      )}
    </div>
  );
}
