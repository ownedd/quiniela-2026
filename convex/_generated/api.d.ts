/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bonusPredictions from "../bonusPredictions.js";
import type * as matches from "../matches.js";
import type * as predictions from "../predictions.js";
import type * as predictionsExport from "../predictionsExport.js";
import type * as predictionsExports from "../predictionsExports.js";
import type * as quinielaGroups from "../quinielaGroups.js";
import type * as scoring from "../scoring.js";
import type * as seedData from "../seedData.js";
import type * as teams from "../teams.js";
import type * as testSeed from "../testSeed.js";
import type * as tournamentSettings from "../tournamentSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bonusPredictions: typeof bonusPredictions;
  matches: typeof matches;
  predictions: typeof predictions;
  predictionsExport: typeof predictionsExport;
  predictionsExports: typeof predictionsExports;
  quinielaGroups: typeof quinielaGroups;
  scoring: typeof scoring;
  seedData: typeof seedData;
  teams: typeof teams;
  testSeed: typeof testSeed;
  tournamentSettings: typeof tournamentSettings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
