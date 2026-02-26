import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Result types for secure data access
type GetParentDataResult =
  | { ok: true; student: Doc<"users">; performance: any[]; projects: Doc<"projects">[] }
  | { ok: false; code: "FORBIDDEN" | "NOT_FOUND"; message: string };

// Create parent account with validation
export const createParent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    username: v.string(),
    password: v.string(),
    studentGrade: v.string(),
    studentClass: v.string(),
    studentUsername: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser) {
      throw new Error("A user with this username already exists");
    }

    // Check if email already exists
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingEmail) {
      throw new Error("A user with this email already exists");
    }

    // Validate that the student exists and matches the provided details
    const student = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.studentUsername))
      .first();

    if (!student) {
      throw new Error("Student with the provided username does not exist");
    }

    if (student.role !== "student") {
      throw new Error("The provided username does not belong to a student");
    }

    if (student.grade !== args.studentGrade) {
      throw new Error("Student grade does not match the provided grade");
    }

    if (student.class !== args.studentClass) {
      throw new Error("Student class does not match the provided class");
    }

    // Check if this student already has a parent
    const existingParent = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "parent"),
          q.eq(q.field("parentOf"), student._id)
        )
      )
      .first();

    if (existingParent) {
      throw new Error("This student already has a parent account registered");
    }

    const parentId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      username: args.username,
      password: args.password,
      grade: "Parent", // Special grade for parents
      role: "parent",
      parentOf: student._id,
      childrenIds: [student._id],
      isApproved: true, // Require admin approval
      registrationDate: Date.now(),
      approvalDate: undefined, // Will be set when approved
    });

    return { success: true, parentId };
  },
});

// Get parent's child data and performance
export const getParentData = query({
  args: { parentUsername: v.optional(v.string()) },
  handler: async (ctx, args): Promise<GetParentDataResult> => {
    let parent;
    
    if (args.parentUsername) {
      // Custom auth - get parent by username
      parent = await ctx.db
        .query("users")
        .withIndex("username", (q) => q.eq("username", args.parentUsername))
        .first();
    } else {
      // Convex auth - get current user
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return { ok: false, code: "FORBIDDEN", message: "Not authenticated" };
      }
      parent = await ctx.db.get(userId);
    }

    if (!parent || parent.role !== "parent") {
      return { ok: false, code: "FORBIDDEN", message: "Access denied. Parent role required." };
    }

    if (!parent.parentOf) {
      return { ok: false, code: "NOT_FOUND", message: "No child associated with this parent account" };
    }

    // Get the child's data
    const student = await ctx.db.get(parent.parentOf);
    if (!student) {
      return { ok: false, code: "NOT_FOUND", message: "Child not found" };
    }

    // Get child's quiz performance
    const quizSessions = await ctx.db
      .query("quizSessions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id as any))
      .collect();

    // Get child's projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_student", (q) => q.eq("studentId", student._id as any))
      .collect();

    // Get course details for performance data
    const performanceData = await Promise.all(
      quizSessions.map(async (session) => {
        const course = await ctx.db.get(session.courseId);
        return {
          ...session,
          courseName: course?.title || "Unknown Course",
        };
      })
    );

    return {
      ok: true,
      student: student as Doc<"users">,
      performance: performanceData,
      projects: projects as Doc<"projects">[],
    };
  },
});

// Get all parents (admin only)
export const getAllParents = query({
  args: {},
  handler: async (ctx) => {
    const parents = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "parent"))
      .collect();

    // Get child details for each parent
    const parentsWithChildren = await Promise.all(
      parents.map(async (parent) => {
        if (parent.parentOf) {
          const child = await ctx.db.get(parent.parentOf);
          return {
            ...parent,
            childDetails: child,
            childName: child?.name || "Not specified",
            childGrade: child?.grade || "Not specified",
            childClass: child?.class || "Not specified",
          };
        }
        return {
          ...parent,
          childDetails: null,
          childName: "Not specified",
          childGrade: "Not specified", 
          childClass: "Not specified",
        };
      })
    );

    return parentsWithChildren;
  },
});

// Update parent profile
export const updateParent = mutation({
  args: {
    parentId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { parentId, ...updates } = args;
    
    const parent = await ctx.db.get(parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("Parent not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(parentId, filteredUpdates);
    return { success: true };
  },
});

// Delete parent (admin only)
export const deleteParent = mutation({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("Parent not found");
    }

    // Delete the parent
    await ctx.db.delete(args.parentId);
    return { success: true };
  },
});

// Approve parent (admin only)
export const approveParent = mutation({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("Parent not found");
    }

    await ctx.db.patch(args.parentId, {
      isApproved: true,
      approvalDate: Date.now(),
    });
    
    return { success: true };
  },
});

// Reject parent (admin only)
export const rejectParent = mutation({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("Parent not found");
    }

    // Delete the parent account
    await ctx.db.delete(args.parentId);
    return { success: true };
  },
});

// Get available students for parent registration (validation helper)
export const getAvailableStudentsForParent = query({
  args: {},
  handler: async (ctx) => {
    // Get all students
    const allStudents = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "student"),
          q.eq(q.field("isApproved"), true)
        )
      )
      .collect();

    // Get all parents to check which students already have parents
    const allParents = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "parent"))
      .collect();

    const studentsWithParents = new Set(
      allParents
        .filter(parent => parent.parentOf)
        .map(parent => parent.parentOf)
    );

    // Return students without parents
    const availableStudents = allStudents.filter(
      student => !studentsWithParents.has(student._id)
    );

    return availableStudents.map(student => ({
      _id: student._id,
      name: student.name,
      username: student.username,
      grade: student.grade,
      class: student.class,
    }));
  },
});

// Validate student details for parent registration
export const validateStudentForParent = query({
  args: {
    studentUsername: v.string(),
    studentGrade: v.string(),
    studentClass: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.studentUsername))
      .first();

    if (!student) {
      return { valid: false, message: "Student with this username does not exist" };
    }

    if (student.role !== "student") {
      return { valid: false, message: "This username does not belong to a student" };
    }

    if (student.grade !== args.studentGrade) {
      return { valid: false, message: "Grade does not match student records" };
    }

    if (student.class !== args.studentClass) {
      return { valid: false, message: "Class does not match student records" };
    }

    // Check if student already has a parent
    const existingParent = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "parent"),
          q.eq(q.field("parentOf"), student._id)
        )
      )
      .first();

    if (existingParent) {
      return { valid: false, message: "This student already has a parent account" };
    }

    return { valid: true, message: "Student details are valid" };
  },
});







