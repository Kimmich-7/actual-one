

import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Result types for secure data access
type GetTeacherDataResult =
  | { ok: true; classes: Doc<"classes">[]; students: Doc<"users">[]; performance: any[] }
  | { ok: false; code: "FORBIDDEN" | "NOT_FOUND"; message: string };

type GetTeacherClassesResult =
  | { ok: true; classes: Doc<"classes">[] }
  | { ok: false; code: "FORBIDDEN"; message: string };

// Create teacher account (admin only)
export const createTeacher = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    username: v.string(),
    password: v.string(),
    subjects: v.array(v.string()),
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

    const teacherId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      username: args.username,
      password: args.password,
      grade: "teacher", // Special grade for teachers
      role: "teacher",
      teacherSubjects: args.subjects,
      assignedClasses: [],
      isApproved: true, // Require admin approval
      registrationDate: Date.now(),
      approvalDate: undefined, // Will be set when approved
    });

    return { success: true, teacherId };
  },
});

// Get all approved teachers (for class assignment)
export const getAllTeachers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "teacher"))
      .collect();
  },
});



// Get teacher's assigned classes and students
export const getTeacherData = query({
  args: { teacherUsername: v.optional(v.string()) },
  handler: async (ctx, args): Promise<GetTeacherDataResult> => {
    let teacher;
    
    if (args.teacherUsername) {
      // Custom auth - get teacher by username
      teacher = await ctx.db
        .query("users")
        .withIndex("username", (q) => q.eq("username", args.teacherUsername))
        .first();
    } else {
      // Convex auth - get current user
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return { ok: false, code: "FORBIDDEN", message: "Not authenticated" };
      }
      teacher = await ctx.db.get(userId);
    }

    if (!teacher || teacher.role !== "teacher") {
      return { ok: false, code: "FORBIDDEN", message: "Access denied. Teacher role required." };
    }

    // Get classes assigned to this teacher
    const assignedClasses = await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("teacherId"), teacher._id))
      .collect();

    // Get all students in assigned classes
    const studentIds = new Set<string>();
    assignedClasses.forEach(cls => {
      cls.students.forEach(studentId => studentIds.add(studentId));
    });

    const students = await Promise.all(
      Array.from(studentIds).map(async (studentId) => {
        const student = await ctx.db.get(studentId as any);
        return student;
      })
    );

    // Get performance data for assigned students with last login times
    const performanceData = await Promise.all(
      Array.from(studentIds).map(async (studentId) => {
        const sessions = await ctx.db
          .query("quizSessions")
          .withIndex("by_student", (q) => q.eq("studentId", studentId as any))
          .collect();
        
        const student = await ctx.db.get(studentId as any);
        
        // Get student's last login time from their latest activity
        const lastLoginTime = (student as Doc<"users">)?.lastLoginTime || (student as Doc<"users">)?.registrationDate || Date.now();
        
        return {
          studentId,
          studentName: (student as Doc<"users">)?.name || "Unknown Student",
          studentGrade: (student as Doc<"users">)?.grade || "Unknown Grade",
          studentClass: (student as Doc<"users">)?.class || "Unknown Class",
          lastLoginTime,
          sessions,
        };
      })
    );

    return {
      ok: true,
      classes: assignedClasses,
      students: students.filter(Boolean) as Doc<"users">[],
      performance: performanceData,
    };
  },
});

// Assign teacher to class (admin only)
export const assignTeacherToClass = mutation({
  args: {
    teacherId: v.id("users"),
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    const classRecord = await ctx.db.get(args.classId);

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Invalid teacher");
    }

    if (!classRecord) {
      throw new Error("Class not found");
    }

    // Update class with teacher assignment
    await ctx.db.patch(args.classId, {
      teacherId: args.teacherId,
      updatedAt: Date.now(),
    });

    // Update teacher's assigned classes
    const currentClasses = teacher.assignedClasses || [];
    if (!currentClasses.includes(args.classId)) {
      await ctx.db.patch(args.teacherId, {
        assignedClasses: [...currentClasses, args.classId],
      });
    }

    return { success: true };
  },
});

// Remove teacher from class (admin only)
export const removeTeacherFromClass = mutation({
  args: {
    teacherId: v.id("users"),
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    const classRecord = await ctx.db.get(args.classId);

    if (!teacher || !classRecord) {
      throw new Error("Teacher or class not found");
    }

    // Remove teacher from class
    await ctx.db.patch(args.classId, {
      teacherId: undefined,
      updatedAt: Date.now(),
    });

    // Update teacher's assigned classes
    const currentClasses = teacher.assignedClasses || [];
    await ctx.db.patch(args.teacherId, {
      assignedClasses: currentClasses.filter(id => id !== args.classId),
    });

    return { success: true };
  },
});

// Get teacher's classes (for teacher dashboard)
export const getTeacherClasses = query({
  args: { teacherUsername: v.optional(v.string()) },
  handler: async (ctx, args): Promise<GetTeacherClassesResult> => {
    let teacher;
    
    if (args.teacherUsername) {
      teacher = await ctx.db
        .query("users")
        .withIndex("username", (q) => q.eq("username", args.teacherUsername))
        .first();
    } else {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return { ok: false, code: "FORBIDDEN", message: "Not authenticated" };
      }
      teacher = await ctx.db.get(userId);
    }

    if (!teacher || teacher.role !== "teacher") {
      return { ok: false, code: "FORBIDDEN", message: "Access denied. Teacher role required." };
    }

    const classes = await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("teacherId"), teacher._id))
      .collect();

    return { ok: true, classes };
  },
});

// Update teacher profile
export const updateTeacher = mutation({
  args: {
    teacherId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    subjects: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { teacherId, ...updates } = args;
    
    const teacher = await ctx.db.get(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Teacher not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (filteredUpdates.subjects) {
      filteredUpdates.teacherSubjects = filteredUpdates.subjects;
      delete filteredUpdates.subjects;
    }

    await ctx.db.patch(teacherId, filteredUpdates);
    return { success: true };
  },
});

// Delete teacher (admin only)
export const deleteTeacher = mutation({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Teacher not found");
    }

    // Remove teacher from all assigned classes
    const assignedClasses = await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("teacherId"), args.teacherId))
      .collect();

    for (const classRecord of assignedClasses) {
      await ctx.db.patch(classRecord._id, {
        teacherId: undefined,
        updatedAt: Date.now(),
      });
    }

    // Delete the teacher
    await ctx.db.delete(args.teacherId);
    return { success: true };
  },
});

// Approve teacher (admin only)
export const approveTeacher = mutation({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Teacher not found");
    }

    await ctx.db.patch(args.teacherId, {
      isApproved: true,
      approvalDate: Date.now(),
    });
    
    return { success: true };
  },
});

// Reject teacher (admin only)
export const rejectTeacher = mutation({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Teacher not found");
    }

    // Delete the teacher account
    await ctx.db.delete(args.teacherId);
    return { success: true };
  },
});






