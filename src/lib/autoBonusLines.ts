import type { Id } from "../../convex/_generated/dataModel";

export type AutoBonusSettings = {
  actualTopScorers?: Id<"players">[];
  actualMostGoalsTeams?: Id<"teams">[];
  actualLeastConcededTeams?: Id<"teams">[];
} | null;

export type AutoBonusPlayerRow = {
  _id: Id<"players">;
  name: string;
  teamName: string;
};

export type AutoBonusTeamRow = {
  _id: Id<"teams">;
  name: string;
  group: string;
};

export type AutoBonusDisplay = {
  topScorerLines: string[];
  topScorerFooter?: string;
  mostGoalsLines: string[];
  mostGoalsFooter?: string;
  leastConcededLines: string[];
  leastConcededFooter?: string;
};

export function computeAutoBonusDisplay(
  settings: AutoBonusSettings,
  players: AutoBonusPlayerRow[],
  teams: AutoBonusTeamRow[]
): AutoBonusDisplay {
  const topScorerIds = settings?.actualTopScorers ?? [];

  const topScorerLines = topScorerIds
    .map((id) => players.find((p) => p._id === id)?.name)
    .filter(Boolean) as string[];
  const topScorerFooter =
    topScorerLines.length > 1
      ? "Empate: cuentan todos los goleadores empatados al maximo"
      : topScorerLines.length === 1
        ? players.find((p) => p._id === topScorerIds[0])?.teamName
        : undefined;

  const actualMostGoalsTeamIds = settings?.actualMostGoalsTeams ?? [];
  const mostGoalsLines = actualMostGoalsTeamIds
    .map((id) => teams.find((t) => t._id === id)?.name)
    .filter(Boolean) as string[];
  const mostGoalsSingle = teams.find((t) => t._id === actualMostGoalsTeamIds[0]);
  const mostGoalsFooter =
    actualMostGoalsTeamIds.length === 1
      ? mostGoalsSingle
        ? `Grupo ${mostGoalsSingle.group}`
        : undefined
      : actualMostGoalsTeamIds.length > 1
        ? "Empate entre varios equipos"
        : undefined;

  const actualLeastConcededIds = settings?.actualLeastConcededTeams ?? [];
  const leastConcededLines = actualLeastConcededIds
    .map((id) => teams.find((t) => t._id === id)?.name)
    .filter(Boolean) as string[];
  const leastConcededSingle = teams.find((t) => t._id === actualLeastConcededIds[0]);
  const leastConcededFooter =
    actualLeastConcededIds.length === 1
      ? leastConcededSingle
        ? `Grupo ${leastConcededSingle.group}`
        : undefined
      : actualLeastConcededIds.length > 1
        ? "Empate entre varios equipos"
        : undefined;

  return {
    topScorerLines,
    topScorerFooter,
    mostGoalsLines,
    mostGoalsFooter,
    leastConcededLines,
    leastConcededFooter,
  };
}
