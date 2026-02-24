/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chat from "../chat.js";
import type * as crons from "../crons.js";
import type * as goalCreation from "../goalCreation.js";
import type * as goalTemplates from "../goalTemplates.js";
import type * as goals from "../goals.js";
import type * as invitations from "../invitations.js";
import type * as journal from "../journal.js";
import type * as lib_invitationAcceptance from "../lib/invitationAcceptance.js";
import type * as lib_invitationEmail from "../lib/invitationEmail.js";
import type * as lib_inviteUrl from "../lib/inviteUrl.js";
import type * as lib_notificationEmail from "../lib/notificationEmail.js";
import type * as lib_r2 from "../lib/r2.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as taskInstances from "../taskInstances.js";
import type * as taskScheduler from "../taskScheduler.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  crons: typeof crons;
  goalCreation: typeof goalCreation;
  goalTemplates: typeof goalTemplates;
  goals: typeof goals;
  invitations: typeof invitations;
  journal: typeof journal;
  "lib/invitationAcceptance": typeof lib_invitationAcceptance;
  "lib/invitationEmail": typeof lib_invitationEmail;
  "lib/inviteUrl": typeof lib_inviteUrl;
  "lib/notificationEmail": typeof lib_notificationEmail;
  "lib/r2": typeof lib_r2;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  taskInstances: typeof taskInstances;
  taskScheduler: typeof taskScheduler;
  tasks: typeof tasks;
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
