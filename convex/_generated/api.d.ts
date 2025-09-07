/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assessment from "../assessment.js";
import type * as blackboxApi from "../blackboxApi.js";
import type * as credentials from "../credentials.js";
import type * as crons from "../crons.js";
import type * as jobs from "../jobs.js";
import type * as project from "../project.js";
import type * as repositories from "../repositories.js";
import type * as tasks from "../tasks.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assessment: typeof assessment;
  blackboxApi: typeof blackboxApi;
  credentials: typeof credentials;
  crons: typeof crons;
  jobs: typeof jobs;
  project: typeof project;
  repositories: typeof repositories;
  tasks: typeof tasks;
  tickets: typeof tickets;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
