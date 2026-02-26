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
import type * as ResendOTP from "../ResendOTP.js";
import type * as admin_clearAllAuth from "../admin/clearAllAuth.js";
import type * as admin_deleteUser from "../admin/deleteUser.js";
import type * as admin_exportUsers from "../admin/exportUsers.js";
import type * as archivedStudents from "../archivedStudents.js";
import type * as assessments from "../assessments.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as cleanupAuth from "../cleanupAuth.js";
import type * as courseNotes from "../courseNotes.js";
import type * as courses from "../courses.js";
import type * as createDummyAccounts from "../createDummyAccounts.js";
import type * as curriculum from "../curriculum.js";
import type * as dataExport from "../dataExport.js";
import type * as debug from "../debug.js";
import type * as exams from "../exams.js";
import type * as http from "../http.js";
import type * as migrations_fixGradeFormat from "../migrations/fixGradeFormat.js";
import type * as parents from "../parents.js";
import type * as projects from "../projects.js";
import type * as quiz from "../quiz.js";
import type * as quizManagement from "../quizManagement.js";
import type * as quizStrandHelpers from "../quizStrandHelpers.js";
import type * as reports from "../reports.js";
import type * as schoolAuth from "../schoolAuth.js";
import type * as seedTestData from "../seedTestData.js";
import type * as teachers from "../teachers.js";
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
  ResendOTP: typeof ResendOTP;
  "admin/clearAllAuth": typeof admin_clearAllAuth;
  "admin/deleteUser": typeof admin_deleteUser;
  "admin/exportUsers": typeof admin_exportUsers;
  archivedStudents: typeof archivedStudents;
  assessments: typeof assessments;
  auth: typeof auth;
  authz: typeof authz;
  cleanupAuth: typeof cleanupAuth;
  courseNotes: typeof courseNotes;
  courses: typeof courses;
  createDummyAccounts: typeof createDummyAccounts;
  curriculum: typeof curriculum;
  dataExport: typeof dataExport;
  debug: typeof debug;
  exams: typeof exams;
  http: typeof http;
  "migrations/fixGradeFormat": typeof migrations_fixGradeFormat;
  parents: typeof parents;
  projects: typeof projects;
  quiz: typeof quiz;
  quizManagement: typeof quizManagement;
  quizStrandHelpers: typeof quizStrandHelpers;
  reports: typeof reports;
  schoolAuth: typeof schoolAuth;
  seedTestData: typeof seedTestData;
  teachers: typeof teachers;
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
