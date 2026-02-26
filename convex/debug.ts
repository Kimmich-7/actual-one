import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * 1) List all courses (full documents)
 */
export const listAllCourses = query({
  args: {},
  handler: async (ctx) => {
    const courses: Doc<"courses">[] = await ctx.db.query("courses").collect();
    return courses;
  },
});

/**
 * 2) Get a sample user document.
 * If userId is provided, returns that user. Otherwise returns the first user document (if any).
 */
export const getSampleUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      const user: Doc<"users"> | null = await ctx.db.get(args.userId);
      return user;
    }
    // fallback: return the first user we find
    const users = await ctx.db.query("users").take(1);
    return users.length ? users[0] : null;
  },
});

/**
 * 3) Check whether a course should be available for a user based on grade.
 * Returns the course, user, directMatch, normalizedMatch and normalized strings for debugging.
 */
export const checkCourseAvailable = query({
  args: {
    courseId: v.id("courses"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const course: Doc<"courses"> | null = await ctx.db.get(args.courseId);
    const user: Doc<"users"> | null = await ctx.db.get(args.userId);

    if (!course || !user) {
      return {
        course,
        user,
        directMatch: false,
        normalizedMatch: false,
        normalizedUserGrade: user?.grade ?? null,
        normalizedCourseGrades: Array.isArray(course?.availableForGrades)
          ? course!.availableForGrades
          : null,
        note: !course ? "Course not found" : !user ? "User not found" : undefined,
      };
    }

    const userGradeRaw = (user as any).grade;
    const courseGradesRaw = Array.isArray((course as any).availableForGrades)
      ? (course as any).availableForGrades
      : [];

    // direct string equality check (exact)
    const directMatch = courseGradesRaw.includes(userGradeRaw);

    // normalized check: trim + lowercase to catch spacing/casing differences
    const normalize = (s: unknown) =>
      typeof s === "string" ? s.trim().toLowerCase() : String(s);
    const normalizedUserGrade = normalize(userGradeRaw);
    const normalizedCourseGrades = courseGradesRaw.map(normalize);
    const normalizedMatch = normalizedCourseGrades.includes(normalizedUserGrade);

    return {
      course,
      user,
      directMatch,
      normalizedMatch,
      normalizedUserGrade,
      normalizedCourseGrades,
    };
  },
});

/**
 * 4) Debug authentication - check what getAuthUserId returns
 */
export const debugAuth = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    
    if (!userId) {
      return { userId: null, user: null, message: "No authenticated user" };
    }
    
    const user = await ctx.db.get(userId);
    return { userId, user, message: user ? "User found" : "User ID exists but user document not found" };
  },
});

/**
 * 5) List all projects in the database for debugging
 */
export const listAllProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    return projects;
  },
});



