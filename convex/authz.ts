import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Check if user is admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return !!user && user.role === "admin";
  },
});

// Check if user is teacher
export const isTeacher = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return !!user && user.role === "teacher";
  },
});

// Check if user is parent
export const isParent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return !!user && user.role === "parent";
  },
});

// Check if user is student
export const isStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return !!user && user.role === "student";
  },
});

// Get current user with role check
export const getCurrentUserWithRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return user;
  },
});

// Check if teacher has access to specific class
export const teacherHasClassAccess = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "teacher") return false;
    
    const classRecord = await ctx.db.get(args.classId);
    if (!classRecord) return false;
    
    // Check if teacher is assigned to this class
    return classRecord.teacherId === userId;
  },
});

// Check if parent has access to specific student
export const parentHasStudentAccess = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "parent") return false;
    
    // Check if this student is the parent's child
    return user.parentOf === args.studentId;
  },
});

// Custom auth check using username (for localStorage auth system)
export const getUserByUsernameWithRole = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    return user;
  },
});

// Check if user has admin role (custom auth)
export const isAdminByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    return !!user && user.role === "admin";
  },
});

// Check if user has teacher role (custom auth)
export const isTeacherByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    return !!user && user.role === "teacher";
  },
});

// Check if user has parent role (custom auth)
export const isParentByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    return !!user && user.role === "parent";
  },
});