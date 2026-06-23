"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Save, Calendar, Loader2, Lock, Unlock, Plus, Copy, Users } from "lucide-react";
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
  homeOwnGoals?: number;
  awayOwnGoals?: number;
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

type MatchStatusFilter = "unfinished" | "finished" | "all";

type QuinielaGroupSummary = {
  _id: Id<"quinielaGroups">;
  name: string;
  invitationCode: string;
  createdAt: string;
  memberCount: number;
};

const MATCH_STATUS_FILTER_OPTIONS: { value: MatchStatusFilter; label: string }[] = [
  { value: "unfinished", label: "No finalizados" },
  { value: "finished", label: "Finalizados" },
  { value: "all", label: "Todos" },
];

const EMPTY_MATCHES_BY_GROUP: Record<string, AdminMatchView[]> = {};
const EMPTY_TEAMS: TeamOption[] = [];
const EMPTY_PLAYERS: PlayerOption[] = [];

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
  const isAdmin = useQuery(api.users.isAdmin, isLoaded && user ? {} : "skip");
  const canBootstrap = useQuery(api.users.canBootstrapAdmin, isLoaded && user ? {} : "skip");
  const bootstrapAsFirstAdmin = useMutation(api.users.bootstrapAsFirstAdmin);
  const settings = useQuery(api.tournamentSettings.get);
  const exportSummary = useQuery(api.predictionsExports.adminSummary, isLoaded && user && isAdmin ? {} : "skip");
  const quinielaGroups = useQuery(api.quinielaGroups.listForAdmin, isLoaded && user && isAdmin ? {} : "skip") as QuinielaGroupSummary[] | undefined;
  const matchesByGroup =
    (useQuery(api.matches.byGroup) as Record<string, AdminMatchView[]> | undefined) ?? EMPTY_MATCHES_BY_GROUP;
  const teams = (useQuery(api.teams.list) as TeamOption[] | undefined) ?? EMPTY_TEAMS;
  const players = (useQuery(api.bonusPredictions.getPlayers) as PlayerOption[] | undefined) ?? EMPTY_PLAYERS;
  const setPredictionsLocked = useMutation(api.tournamentSettings.setPredictionsLocked);
  const setResult = useMutation(api.matches.setResult);
  const addPlayer = useMutation(api.bonusPredictions.addPlayer);
  const createGroup = useMutation(api.quinielaGroups.create);
  const [savingMatch, setSavingMatch] = useState<Id<"matches"> | null>(null);
  const [togglingLock, setTogglingLock] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const groups = Object.keys(matchesByGroup).sort();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [matchStatusFilter, setMatchStatusFilter] = useState<MatchStatusFilter>("unfinished");

  useEffect(() => {
    if (groups.length > 0 && !activeGroup) setActiveGroup(groups[0]);
  }, [groups, activeGroup]);

  const selectedGroup = activeGroup ?? groups[0];
  const selectedGroupMatches = selectedGroup ? matchesByGroup[selectedGroup] ?? [] : [];
  const visibleMatches = selectedGroupMatches.filter((match) => {
    if (matchStatusFilter === "all") return true;
    const isFinished = match.status === "finished";
    return matchStatusFilter === "finished" ? isFinished : !isFinished;
  });

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
    awayScorers: Id<"players">[] | undefined,
    homeOwnGoals: number | undefined,
    awayOwnGoals: number | undefined
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
        homeOwnGoals,
        awayOwnGoals,
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
        text: newLocked ? "Predicciones bloqueadas." : "Predicciones desbloqueadas y exportación limpiada.",
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setTogglingLock(false);
    }
  };

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingGroup(true);
    setMessage(null);
    try {
      const group = await createGroup({
        name: newGroupName,
        invitationCode: newGroupCode.trim() ? newGroupCode : undefined,
      });
      setNewGroupName("");
      setNewGroupCode("");
      setMessage({ type: "success", text: `Grupo ${group.name} creado con código ${group.invitationCode}.` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error al crear grupo" });
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCopyInvitationCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      setMessage({ type: "error", text: "No se pudo copiar el código. Cópialo manualmente." });
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
          <Link href="/" className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-medium text-sm transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const locked = settings?.predictionsLocked ?? false;
  const exportStatus =
    !locked
      ? null
      : exportSummary === undefined
        ? "loading"
        : exportSummary?.error
          ? "error"
          : exportSummary?.generating
            ? "generating"
            : exportSummary?.ready
              ? "ready"
              : "empty";

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wide">Panel de Administracion</h2>
        <p className="text-gray-400 text-sm mt-1">Bloquea predicciones y carga resultados oficiales</p>
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
            {exportStatus === "loading" || exportStatus === "generating" ? (
              <div className="flex items-center gap-2 text-gold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Generando exportaciones por grupo
                  {exportSummary ? ` (${exportSummary.ready}/${exportSummary.total} listas)` : ""}...
                </span>
              </div>
            ) : exportStatus === "ready" ? (
              <p className="text-green">
                Exportaciones listas para descarga ({exportSummary?.ready}/{exportSummary?.total} grupos).
              </p>
            ) : exportStatus === "error" ? (
              <p className="text-red-400">
                {exportSummary?.ready}/{exportSummary?.total} exportaciones listas. {exportSummary?.error} con error.
              </p>
            ) : (
              <p className="text-gray-400">No hay grupos con exportación generada.</p>
            )}
          </div>
        )}
      </div>

      {message && (
        <p className={cn("text-sm", message.type === "success" ? "text-green" : "text-red-400")}>
          {message.text}
        </p>
      )}

      <section aria-labelledby="groups-heading" className="glass-card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 id="groups-heading" className="font-bold font-display uppercase">Grupos de quiniela</h3>
            <p className="mt-1 text-sm text-gray-400">Crea grupos y comparte el código para que cada participante se una.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
            <Users aria-hidden="true" className="h-4 w-4 text-gold" />
            <span>{quinielaGroups ? `${quinielaGroups.length} grupo${quinielaGroups.length === 1 ? "" : "s"}` : "Cargando grupos"}</span>
          </div>
        </div>

        <form onSubmit={handleCreateGroup} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="flex flex-col gap-2 text-xs font-display uppercase tracking-[0.18em] text-gold/70">
            Nombre
            <input
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Familia, oficina, amigos..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-body normal-case tracking-normal text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-gold focus:ring-1 focus:ring-gold"
              disabled={creatingGroup}
              required
              minLength={2}
              maxLength={60}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-display uppercase tracking-[0.18em] text-gold/70">
            Código opcional
            <input
              value={newGroupCode}
              onChange={(event) => setNewGroupCode(event.target.value.toUpperCase())}
              placeholder="FAMILIA26"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-body normal-case tracking-normal text-gray-100 outline-none transition-all placeholder:text-gray-600 focus:border-gold focus:ring-1 focus:ring-gold"
              disabled={creatingGroup}
              maxLength={12}
              pattern="[A-Z0-9]{3,12}"
            />
          </label>
          <button
            type="submit"
            disabled={creatingGroup || newGroupName.trim().length < 2}
            className="btn-gold inline-flex items-center justify-center gap-2 self-end px-5 py-3 text-sm disabled:cursor-not-allowed"
          >
            {creatingGroup ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
            Crear
          </button>
        </form>

        <div className="mt-4 grid gap-2">
          {quinielaGroups === undefined ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gold">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Cargando grupos...
            </div>
          ) : quinielaGroups.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-500">Aún no hay grupos creados.</p>
          ) : (
            quinielaGroups.map((group) => (
              <div key={group._id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-100">{group.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {group.memberCount} participante{group.memberCount === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyInvitationCode(group.invitationCode)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-sm font-bold text-gold transition-colors hover:bg-gold/15"
                  aria-label={`Copiar código de invitación ${group.invitationCode}`}
                >
                  <Copy aria-hidden="true" className="h-4 w-4" />
                  {copiedCode === group.invitationCode ? "Copiado" : group.invitationCode}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <AutoBonusResultsSection
        variant="admin"
        display={autoBonusDisplay}
        subtitle="Se calculan automaticamente con los partidos finalizados y los goleadores que registres en cada resultado."
      />

      <div>
        <h3 className="font-bold mb-4 font-display uppercase tracking-wide">Resultados oficiales</h3>
        {groups.length > 0 && (
          <div className="mb-5 space-y-3">
            <div className="overflow-x-auto md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
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
            <label className="flex flex-col gap-2 text-xs font-display uppercase tracking-[0.18em] text-gold/70 sm:max-w-xs">
              Estado de partidos
              <select
                value={matchStatusFilter}
                onChange={(event) => setMatchStatusFilter(event.target.value as MatchStatusFilter)}
                className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold normal-case tracking-normal text-gray-100 outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold"
              >
                {MATCH_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#0a0a0a] text-gray-100">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-xs text-gray-500">
              Mostrando {visibleMatches.length} de {selectedGroupMatches.length} partidos
            </div>
          </div>
        )}
        <div className="grid gap-4 stagger-children">
          {selectedGroup && visibleMatches.length > 0 ? (
            visibleMatches.map((match, idx, arr) => (
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
                {groups.length === 0
                  ? "Cargando partidos o no hay partidos disponibles..."
                  : selectedGroupMatches.length === 0
                    ? "Selecciona un grupo para ver los partidos."
                    : "No hay partidos que coincidan con este filtro."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ScorerSlot = { playerId: Id<"players"> | null; ownGoal: boolean };

function buildInitialScorerSlots(
  score: number | undefined,
  scorers: Id<"players">[] | undefined,
  ownGoals: number | undefined
): ScorerSlot[] {
  const total = score ?? 0;
  if (total <= 0) return [];
  const realScorers = scorers ?? [];
  const ownGoalCount = Math.min(Math.max(ownGoals ?? 0, 0), total);
  const realCount = total - ownGoalCount;
  return Array.from({ length: total }, (_, index) =>
    index < realCount
      ? { playerId: realScorers[index] ?? null, ownGoal: false }
      : { playerId: null, ownGoal: true }
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
    awayScorers: Id<"players">[] | undefined,
    homeOwnGoals: number | undefined,
    awayOwnGoals: number | undefined
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
  const [homeScorers, setHomeScorers] = useState<ScorerSlot[]>(() =>
    buildInitialScorerSlots(match.homeScore, match.homeScorers, match.homeOwnGoals)
  );
  const [awayScorers, setAwayScorers] = useState<ScorerSlot[]>(() =>
    buildInitialScorerSlots(match.awayScore, match.awayScorers, match.awayOwnGoals)
  );

  const homeName = match.homeTeamDetails?.name || "TBD";
  const awayName = match.awayTeamDetails?.name || "TBD";
  const homeFlagUrl = match.homeTeamDetails?.flagUrl;
  const awayFlagUrl = match.awayTeamDetails?.flagUrl;
  const isFinished = match.status === "finished";
  const normalizeScorerSlots = (current: ScorerSlot[], size: number): ScorerSlot[] => {
    if (size <= 0) return [];
    return Array.from(
      { length: size },
      (_, index) => current[index] ?? { playerId: null, ownGoal: false }
    );
  };
  const homeGoals = homeScore === "" ? 0 : Number(homeScore);
  const awayGoals = awayScore === "" ? 0 : Number(awayScore);
  const normalizedHomeScorers = normalizeScorerSlots(homeScorers, homeGoals);
  const normalizedAwayScorers = normalizeScorerSlots(awayScorers, awayGoals);
  const originalHomeScorers = buildInitialScorerSlots(match.homeScore, match.homeScorers, match.homeOwnGoals);
  const originalAwayScorers = buildInitialScorerSlots(match.awayScore, match.awayScorers, match.awayOwnGoals);
  const hasChanged =
    String(match.homeScore ?? "") !== homeScore ||
    String(match.awayScore ?? "") !== awayScore ||
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
  const isValidSlot = (slot: ScorerSlot) => slot.ownGoal || slot.playerId !== null;
  const validScorers =
    normalizedHomeScorers.every(isValidSlot) && normalizedAwayScorers.every(isValidSlot);
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
            {normalizedHomeScorers.map((slot, index) => (
              <ScorerSlotField
                key={`home-scorer-${index}`}
                label={`Gol local ${index + 1}`}
                slot={slot}
                options={homePlayerOptions}
                searchPlaceholder="Buscar jugador local"
                ownGoalNote={`Autogol del rival · cuenta para ${homeName}, no para el goleador del torneo.`}
                onToggleOwnGoal={() =>
                  setHomeScorers((current) =>
                    normalizeScorerSlots(current, homeGoals).map((item, itemIndex) =>
                      itemIndex === index ? { playerId: null, ownGoal: !item.ownGoal } : item
                    )
                  )
                }
                onChange={(value) =>
                  setHomeScorers((current) =>
                    normalizeScorerSlots(current, homeGoals).map((item, itemIndex) =>
                      itemIndex === index ? { playerId: value as Id<"players"> | null, ownGoal: false } : item
                    )
                  )
                }
                onCreateNew={handleCreateHomePlayer}
              />
            ))}
          </div>
          <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[11px] font-display uppercase tracking-[0.2em] text-gold/65">
              Goleadores {awayName}
            </p>
            {normalizedAwayScorers.map((slot, index) => (
              <ScorerSlotField
                key={`away-scorer-${index}`}
                label={`Gol visitante ${index + 1}`}
                slot={slot}
                options={awayPlayerOptions}
                searchPlaceholder="Buscar jugador visitante"
                ownGoalNote={`Autogol del rival · cuenta para ${awayName}, no para el goleador del torneo.`}
                onToggleOwnGoal={() =>
                  setAwayScorers((current) =>
                    normalizeScorerSlots(current, awayGoals).map((item, itemIndex) =>
                      itemIndex === index ? { playerId: null, ownGoal: !item.ownGoal } : item
                    )
                  )
                }
                onChange={(value) =>
                  setAwayScorers((current) =>
                    normalizeScorerSlots(current, awayGoals).map((item, itemIndex) =>
                      itemIndex === index ? { playerId: value as Id<"players"> | null, ownGoal: false } : item
                    )
                  )
                }
                onCreateNew={handleCreateAwayPlayer}
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
              bothEmpty
                ? undefined
                : (normalizedHomeScorers.filter((slot) => !slot.ownGoal).map((slot) => slot.playerId).filter(Boolean) as Id<"players">[]),
              bothEmpty
                ? undefined
                : (normalizedAwayScorers.filter((slot) => !slot.ownGoal).map((slot) => slot.playerId).filter(Boolean) as Id<"players">[]),
              bothEmpty ? undefined : normalizedHomeScorers.filter((slot) => slot.ownGoal).length,
              bothEmpty ? undefined : normalizedAwayScorers.filter((slot) => slot.ownGoal).length
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
            Selecciona un goleador por cada gol o marcalo como autogol.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ScorerSlotField({
  label,
  slot,
  options,
  searchPlaceholder,
  ownGoalNote,
  onToggleOwnGoal,
  onChange,
  onCreateNew,
}: {
  label: string;
  slot: ScorerSlot;
  options: SearchableSelectOption[];
  searchPlaceholder: string;
  ownGoalNote: string;
  onToggleOwnGoal: () => void;
  onChange: (value: string | null) => void;
  onCreateNew: (name: string) => Promise<Id<"players">>;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggleOwnGoal}
        className={cn(
          "absolute right-0 top-0 z-[1] shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide font-display transition-all cursor-pointer",
          slot.ownGoal
            ? "bg-gold/20 text-gold border border-gold/30"
            : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-200"
        )}
      >
        Autogol
      </button>
      {slot.ownGoal ? (
        <div className="space-y-2">
          <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-gold/60 font-display">
            {label}
          </span>
          <div className="flex min-h-14 items-center rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3 text-xs text-gold/85">
            {ownGoalNote}
          </div>
        </div>
      ) : (
        <SearchableSelect
          label={label}
          placeholder="Selecciona goleador"
          options={options}
          value={slot.playerId}
          onChange={onChange}
          searchPlaceholder={searchPlaceholder}
          onCreateNew={onCreateNew}
          createNewLabel="Agregar jugador"
        />
      )}
    </div>
  );
}
