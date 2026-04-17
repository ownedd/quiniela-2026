"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Save, Calendar, Loader2, Lock, Unlock } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect, type SearchableSelectOption } from "@/components/SearchableSelect";
import { AutoBonusResultsSection } from "@/components/AutoBonusResultsSection";
import { computeAutoBonusDisplay } from "@/lib/autoBonusLines";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

type AdminMatchDetails = {
  name: string;
  flagUrl?: string | null;
};

type AdminMatchView = {
  _id: Id<"matches">;
  group: string;
  date: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  homeTeam: Id<"teams">;
  awayTeam: Id<"teams">;
  homeScorers?: Id<"players">[];
  awayScorers?: Id<"players">[];
  homeTeamDetails?: AdminMatchDetails | null;
  awayTeamDetails?: AdminMatchDetails | null;
};

type PlayerOption = {
  _id: Id<"players">;
  name: string;
  teamId: Id<"teams">;
  teamName: string;
  teamCode: string;
  teamFlagUrl?: string | null;
  group: string;
};

type TeamOption = {
  _id: Id<"teams">;
  name: string;
  code: string;
  flagUrl?: string | null;
  group: string;
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

export default function AdminResultsPage() {
  const { user, isLoaded } = useUser();
  const viewer = useQuery(api.users.getViewerContext, isLoaded && user ? {} : "skip");
  const hasGroup = viewer?.hasGroup ?? false;
  const isAdmin = useQuery(api.users.isAdmin, isLoaded && user && hasGroup ? {} : "skip");
  const canBootstrap = useQuery(api.users.canBootstrapAdmin, isLoaded && user && hasGroup ? {} : "skip");
  const bootstrapAsFirstAdmin = useMutation(api.users.bootstrapAsFirstAdmin);
  const settings = useQuery(api.tournamentSettings.get, hasGroup ? {} : "skip");
  const matchesByGroup = (useQuery(api.matches.byGroup, hasGroup ? {} : "skip") ?? {}) as Record<string, AdminMatchView[]>;
  const teams = (useQuery(api.teams.list, hasGroup ? {} : "skip") ?? []) as TeamOption[];
  const players = (useQuery(api.bonusPredictions.getPlayers, hasGroup ? {} : "skip") ?? []) as PlayerOption[];
  const setPredictionsLocked = useMutation(api.tournamentSettings.setPredictionsLocked);
  const setResult = useMutation(api.matches.setResult);
  const addPlayer = useMutation(api.bonusPredictions.addPlayer);
  const [savingMatch, setSavingMatch] = useState<Id<"matches"> | null>(null);
  const [togglingLock, setTogglingLock] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const groups = Object.keys(matchesByGroup).sort();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) setActiveGroup(groups[0]);
  }, [groups, activeGroup]);

  const playerOptions: SearchableSelectOption[] = players.map((player) => ({
    value: player._id,
    label: player.name,
    subtitle: player.teamName,
    imageUrl: player.teamFlagUrl,
    group: `Grupo ${player.group} · ${player.teamName}`,
  }));

  const autoBonusDisplay = useMemo(
    () =>
      computeAutoBonusDisplay(
        settings ?? null,
        players.map((p) => ({
          _id: p._id,
          name: p.name,
          teamName: p.teamName,
        })),
        teams.map((t) => ({
          _id: t._id,
          name: t.name,
          group: t.group,
        }))
      ),
    [settings, players, teams]
  );

  const handleSetResult = async (
    matchId: Id<"matches">,
    homeScore: number | undefined,
    awayScore: number | undefined,
    homeScorers: Id<"players">[] | undefined,
    awayScorers: Id<"players">[] | undefined
  ) => {
    setSavingMatch(matchId);
    setMessage(null);
    try {
      await setResult({
        matchId,
        homeScore: homeScore !== undefined ? homeScore : undefined,
        awayScore: awayScore !== undefined ? awayScore : undefined,
        homeScorers,
        awayScorers,
      });
      setMessage({
        type: "success",
        text:
          homeScore !== undefined && awayScore !== undefined
            ? "Resultado y goleadores guardados. Las predicciones especiales se recalcularon automaticamente."
            : "Resultado limpiado. El partido queda como no jugado.",
      });
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
        text: newLocked
          ? "Predicciones bloqueadas. Generando quinielas.xlsx..."
          : "Predicciones desbloqueadas y exportación limpiada.",
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
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
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
      <div className="space-y-6 animate-slide-up">
        {message && (
          <p className={cn("text-sm", message.type === "success" ? "text-green" : "text-red-400")}>
            {message.text}
          </p>
        )}
        <div className="glass-card p-8 text-center">
          <Lock className="w-14 h-14 text-gold mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 font-display uppercase">Acceso denegado</h2>
          <p className="text-gray-400 mb-6 text-sm">Solo administradores pueden acceder a esta seccion.</p>
          {canBootstrap && (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Eres el organizador? Conviertete en el primer administrador.</p>
              <button
                onClick={handleBootstrap}
                disabled={bootstrapping}
                className="btn-gold px-6 py-2 text-sm cursor-pointer"
              >
                {bootstrapping ? <Loader2 className="w-5 h-5 animate-spin inline" /> : "Ser administrador"}
              </button>
            </div>
          )}
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-medium text-sm transition-colors">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const locked = settings?.predictionsLocked ?? false;
  const exportStatus = settings?.predictionsExportStatus;
  const isGeneratingExport = locked && exportStatus === "generating";
  const exportGeneratedAt = settings?.predictionsExportGeneratedAt ?? null;

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wide">Panel de Administracion</h2>
        <p className="text-gray-400 text-sm mt-1">Bloquea predicciones y carga resultados oficiales</p>
        {viewer?.group?.name ? <p className="text-sm text-gold/80 mt-2">Grupo: {viewer.group.name}</p> : null}
      </div>

      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold mb-1 font-display uppercase">Predicciones</h3>
            <p className="text-sm text-gray-400">
              {locked ? "Cerradas desde el inicio del Mundial" : "Abiertas para edicion"}
            </p>
          </div>
          <button
            onClick={handleToggleLock}
            disabled={togglingLock}
            className={cn(
              "px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all w-full sm:w-auto text-sm cursor-pointer",
              locked
                ? "bg-gradient-to-r from-gold to-gold-dark text-[#0a0a0a] shadow-lg shadow-gold/20"
                : "bg-green/80 hover:bg-green text-[#0a0a0a] shadow-lg shadow-green/20",
              "disabled:opacity-50"
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
        {locked && (
          <div className="mt-4 text-sm">
            {isGeneratingExport && (
              <div className="flex items-center gap-2 text-gold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando quinielas.xlsx con las predicciones registradas...</span>
              </div>
            )}
            {exportStatus === "ready" && (
              <p className="text-green">
                quinielas.xlsx listo para descarga
                {exportGeneratedAt ? (
                  <>
                    {" "}desde{" "}
                    <LocalDateTime value={exportGeneratedAt} />
                  </>
                ) : null}
                .
              </p>
            )}
            {exportStatus === "error" && (
              <p className="text-red-400">
                No se pudo generar quinielas.xlsx
                {settings?.predictionsExportError ? `: ${settings.predictionsExportError}` : "."}
              </p>
            )}
          </div>
        )}
      </div>

      {message && (
        <p className={cn("text-sm", message.type === "success" ? "text-green" : "text-red-400")}>
          {message.text}
        </p>
      )}

      <AutoBonusResultsSection
        variant="admin"
        display={autoBonusDisplay}
        subtitle="Se calculan automaticamente con los partidos finalizados y los goleadores que registres en cada resultado."
      />

      <div>
        <h3 className="font-bold mb-4 font-display uppercase tracking-wide">Resultados oficiales</h3>
        {groups.length > 0 && (
          <div className="overflow-x-auto md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mb-5">
            <div className="flex gap-2 flex-nowrap md:flex-wrap w-max md:w-full">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
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
        )}
        <div className="grid gap-4 stagger-children">
          {(activeGroup ?? groups[0]) && matchesByGroup[activeGroup ?? groups[0]]?.length > 0 ? (
            matchesByGroup[activeGroup ?? groups[0]].map((match, idx, arr) => (
              <AdminMatchCard
                key={match._id}
                match={match}
                onSave={handleSetResult}
                isSaving={savingMatch === match._id}
                players={players}
                zIndex={arr.length - idx}
                onAddPlayer={addPlayer}
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
  players,
  zIndex = 1,
  onAddPlayer,
}: {
  match: AdminMatchView;
  onSave: (
    matchId: Id<"matches">,
    homeScore: number | undefined,
    awayScore: number | undefined,
    homeScorers: Id<"players">[] | undefined,
    awayScorers: Id<"players">[] | undefined
  ) => void;
  isSaving: boolean;
  players: PlayerOption[];
  zIndex?: number;
  onAddPlayer: (args: { name: string; teamId: Id<"teams"> }) => Promise<Id<"players">>;
}) {
  const [homeScore, setHomeScore] = useState<string>(
    match.homeScore !== undefined && match.homeScore !== null ? String(match.homeScore) : ""
  );
  const [awayScore, setAwayScore] = useState<string>(
    match.awayScore !== undefined && match.awayScore !== null ? String(match.awayScore) : ""
  );
  const [homeScorers, setHomeScorers] = useState<Array<Id<"players"> | null>>(
    (match.homeScorers ?? []).map((playerId) => playerId)
  );
  const [awayScorers, setAwayScorers] = useState<Array<Id<"players"> | null>>(
    (match.awayScorers ?? []).map((playerId) => playerId)
  );

  const homeName = match.homeTeamDetails?.name || "TBD";
  const awayName = match.awayTeamDetails?.name || "TBD";
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;
  const isFinished = match.status === "finished";
  const normalizeScorerSlots = (
    current: Array<Id<"players"> | null>,
    size: number
  ) => {
    if (size <= 0) return [];
    return Array.from({ length: size }, (_, index) => current[index] ?? null);
  };
  const homeGoals = homeScore === "" ? 0 : Number(homeScore);
  const awayGoals = awayScore === "" ? 0 : Number(awayScore);
  const normalizedHomeScorers = normalizeScorerSlots(homeScorers, homeGoals);
  const normalizedAwayScorers = normalizeScorerSlots(awayScorers, awayGoals);
  const originalHomeScorers = match.homeScorers ?? [];
  const originalAwayScorers = match.awayScorers ?? [];
  const hasChanged =
    (match.homeScore ?? "") !== homeScore ||
    (match.awayScore ?? "") !== awayScore ||
    JSON.stringify(normalizedHomeScorers) !== JSON.stringify(originalHomeScorers) ||
    JSON.stringify(normalizedAwayScorers) !== JSON.stringify(originalAwayScorers);
  const bothFilled =
    homeScore !== "" &&
    awayScore !== "" &&
    !isNaN(Number(homeScore)) &&
    !isNaN(Number(awayScore)) &&
    Number(homeScore) >= 0 &&
    Number(awayScore) >= 0;
  const bothEmpty = homeScore === "" && awayScore === "";
  const validScorers =
    normalizedHomeScorers.every(Boolean) && normalizedAwayScorers.every(Boolean);
  const canSave =
    hasChanged &&
    ((bothFilled && validScorers) || (bothEmpty && isFinished));
  const homePlayerOptions = players
    .filter((player) => player.teamId === match.homeTeam)
    .map((player) => ({
      value: player._id,
      label: player.name,
      subtitle: player.teamName,
      imageUrl: player.teamFlagUrl,
    }));
  const awayPlayerOptions = players
    .filter((player) => player.teamId === match.awayTeam)
    .map((player) => ({
      value: player._id,
      label: player.name,
      subtitle: player.teamName,
      imageUrl: player.teamFlagUrl,
    }));

  const handleCreateHomePlayer = async (name: string) => {
    return await onAddPlayer({ name, teamId: match.homeTeam });
  };

  const handleCreateAwayPlayer = async (name: string) => {
    return await onAddPlayer({ name, teamId: match.awayTeam });
  };

  const inputClass =
    "w-11 h-11 sm:w-13 sm:h-13 bg-white/5 border border-white/10 rounded-xl text-center text-lg sm:text-xl font-bold font-display focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all score-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div
      style={{ zIndex }}
      className={cn(
        "glass-card p-4 sm:p-5 hover-lift overflow-visible relative",
        isFinished && "border-green/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-gold font-bold bg-gold/10 px-2 py-0.5 rounded font-display">
            Grupo {match.group}
          </span>
          {isFinished && (
            <span className="text-[10px] uppercase tracking-widest text-green font-bold bg-green/10 px-2 py-0.5 rounded font-display shadow-[0_0_8px_rgba(34,197,94,0.15)]">
              Finalizado
            </span>
          )}
        </div>
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
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
            }}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setHomeScore("");
                setHomeScorers([]);
                return;
              }
              const n = Number(v);
              if (!isNaN(n) && n >= 0) {
                setHomeScore(v);
                setHomeScorers((current) => normalizeScorerSlots(current, n));
              }
            }}
            className={inputClass}
            placeholder="0"
          />
          <span className="text-sm font-bold text-gray-500 font-display">vs</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
            }}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setAwayScore("");
                setAwayScorers([]);
                return;
              }
              const n = Number(v);
              if (!isNaN(n) && n >= 0) {
                setAwayScore(v);
                setAwayScorers((current) => normalizeScorerSlots(current, n));
              }
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

      {(normalizedHomeScorers.length > 0 || normalizedAwayScorers.length > 0) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] font-display uppercase tracking-[0.2em] text-gold/65">
              Goleadores {homeName}
            </p>
            {normalizedHomeScorers.map((scorer, index) => (
              <SearchableSelect
                key={`home-scorer-${index}`}
                label={`Gol local ${index + 1}`}
                placeholder="Selecciona goleador"
                options={homePlayerOptions}
                value={scorer}
                onChange={(value) =>
                  setHomeScorers((current) =>
                    normalizeScorerSlots(current, homeGoals).map((item, itemIndex) =>
                      itemIndex === index ? (value as Id<"players"> | null) : item
                    )
                  )
                }
                searchPlaceholder="Buscar jugador local"
                onCreateNew={handleCreateHomePlayer}
                createNewLabel="Agregar jugador"
              />
            ))}
          </div>
          <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] font-display uppercase tracking-[0.2em] text-gold/65">
              Goleadores {awayName}
            </p>
            {normalizedAwayScorers.map((scorer, index) => (
              <SearchableSelect
                key={`away-scorer-${index}`}
                label={`Gol visitante ${index + 1}`}
                placeholder="Selecciona goleador"
                options={awayPlayerOptions}
                value={scorer}
                onChange={(value) =>
                  setAwayScorers((current) =>
                    normalizeScorerSlots(current, awayGoals).map((item, itemIndex) =>
                      itemIndex === index ? (value as Id<"players"> | null) : item
                    )
                  )
                }
                searchPlaceholder="Buscar jugador visitante"
                onCreateNew={handleCreateAwayPlayer}
                createNewLabel="Agregar jugador"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() =>
            onSave(
              match._id,
              bothEmpty ? undefined : Number(homeScore),
              bothEmpty ? undefined : Number(awayScore),
              bothEmpty ? undefined : normalizedHomeScorers.filter(Boolean) as Id<"players">[],
              bothEmpty ? undefined : normalizedAwayScorers.filter(Boolean) as Id<"players">[]
            )
          }
          disabled={!canSave || isSaving}
          className={cn(
            "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer",
            canSave && !isSaving && "btn-gold",
            !canSave && "bg-white/5 text-gray-500 cursor-not-allowed",
            isSaving && "bg-gold/50 text-[#0a0a0a] cursor-wait"
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{bothEmpty && isFinished ? "Limpiar resultado" : "Guardar resultado"}</span>
            </>
          )}
        </button>
        {bothFilled && !validScorers ? (
          <p className="mt-3 text-xs text-gold/80">
            Debes seleccionar un goleador por cada gol registrado.
          </p>
        ) : null}
      </div>
    </div>
  );
}
