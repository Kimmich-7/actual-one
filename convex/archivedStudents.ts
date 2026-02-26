import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Archive a student
export const archiveStudent = mutation({
  args: {
    studentId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    const archivedById = adminUser?._id || ("system" as any);

    // Get student data
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    // Calculate statistics before archiving
    const quizSessions = await ctx.db
      .query("quizSessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const progress = await ctx.db
      .query("studentProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const averageScore =
      quizSessions.length > 0
        ? Math.round(
            quizSessions.reduce((sum, s) => sum + s.score, 0) /
              quizSessions.length
          )
        : 0;

    // Create archived record
    const archivedId = await ctx.db.insert("archivedStudents", {
      originalUserId: args.studentId,
      name: student.name,
      username: student.username,
      email: student.email,
      grade: student.grade,
      class: student.class,
      school: student.school,
      registrationDate: student.registrationDate,
      archivedAt: Date.now(),
      archivedBy: archivedById,
      reason: args.reason,
      totalQuizzes: quizSessions.length,
      averageScore,
      totalProjects: projects.length,
      completedCourses: progress.length,
    });

    // Delete the student user account
    await ctx.db.delete(args.studentId);

    return { success: true, archivedId };
  },
});

// Get all archived students
export const getAllArchivedStudents = query({
  args: {},
  handler: async (ctx) => {
    const archived = await ctx.db
      .query("archivedStudents")
      .order("desc")
      .collect();

    return archived;
  },
});

// Restore archived student
export const restoreStudent = mutation({
  args: {
    archivedId: v.id("archivedStudents"),
  },
  handler: async (ctx, args) => {
    const archived = await ctx.db.get(args.archivedId);
    if (!archived) throw new Error("Archived student not found");

    // Recreate user account
    const newUserId = await ctx.db.insert("users", {
      name: archived.name,
      username: archived.username,
      email: archived.email,
      grade: archived.grade,
      class: archived.class,
      school: archived.school,
      role: "student",
      isApproved: true,
      registrationDate: archived.registrationDate,
      password: "restored123", // Default password for restored accounts
    });

    // Delete archived record
    await ctx.db.delete(args.archivedId);

    return { success: true, newUserId };
  },
});

// Delete archived student permanently
export const deleteArchivedStudent = mutation({
  args: {
    archivedId: v.id("archivedStudents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.archivedId);
    return { success: true };
  },
});
