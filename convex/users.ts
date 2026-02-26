import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Helper function to create or get class for a grade
const createOrGetClass = async (ctx: any, grade: string) => {
  // Check if class already exists for this grade
  let existingClass = await ctx.db
    .query("classes")
    .filter((q: any) => q.eq(q.field("grade"), grade))
    .first();

  if (!existingClass) {
    // Create new class
    const classId = await ctx.db.insert("classes", {
      name: grade,
      grade: grade,
      students: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    existingClass = await ctx.db.get(classId);
  }

  return existingClass;
};

// Helper function to add student to class
const addStudentToClass = async (ctx: any, studentId: any, grade: string) => {
  const classRecord = await createOrGetClass(ctx, grade);
  if (classRecord && !classRecord.students.includes(studentId)) {
    await ctx.db.patch(classRecord._id, {
      students: [...classRecord.students, studentId],
      updatedAt: Date.now(),
    });
  }
};

// Get current logged-in user
export const currentLoggedInUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    return user;
  },
});

// Get user by username (for custom auth system)
export const getUserByUsernameForAuth = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    return user;
  },
});

// Get all students pending approval (admin only)
export const getPendingStudents = query({
  args: {},
  handler: async (ctx) => {
    // For admin portal, we'll allow this query to run
    // In production, you'd want to add proper admin verification
    const pendingStudents = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "student"),
          q.or(
            q.eq(q.field("isApproved"), false),
            q.eq(q.field("isApproved"), undefined)
          )
        )
      )
      .collect();

    return pendingStudents;
  },
});

// Get student statistics (admin only)
export const getStudentStatistics = query({
  args: {},
  handler: async (ctx) => {
    // For admin portal, we'll allow this query to run
    const allStudents = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    const approvedStudents = allStudents.filter(s => s.isApproved === true);
    const pendingStudents = allStudents.filter(s => s.isApproved !== true);

    return {
      totalStudents: allStudents.length,
      approvedStudents: approvedStudents.length,
      pendingStudents: pendingStudents.length,
    };
  },
});

// Approve a student (admin only)
export const approveStudent = mutation({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    // For admin portal, we'll allow this mutation to run
    // In production, you'd want to add proper admin verification
    await ctx.db.patch(args.studentId, {
      isApproved: true,
      approvalDate: Date.now(),
    });

    return { success: true };
  },
});

// Reject a student (admin only)
export const rejectStudent = mutation({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    // For admin portal, we'll allow this mutation to run
    // Delete the user record
    await ctx.db.delete(args.studentId);

    return { success: true };
  },
});

// Create student by admin (updated to include automatic class creation)
export const createStudentByAdmin = mutation({
  args: {
    name: v.string(),
    grade: v.string(),
    school: v.string(),
    username: v.string(),
    password: v.string(),
    class: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUsername = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username))
      .first();

    if (existingUsername) {
      throw new Error("A user with this username already exists");
    }

    // If class is specified, validate it exists
    if (args.class) {
      const classExists = await ctx.db
        .query("classes")
        .filter((q: any) => q.eq(q.field("name"), args.class))
        .first();
      
      if (!classExists) {
        throw new Error(`Class "${args.class}" does not exist. Please create the class first.`);
      }
    }

    const studentId = await ctx.db.insert("users", {
      name: args.name,
      grade: args.grade,
      school: args.school,
      username: args.username,
      password: args.password,
      class: args.class || args.grade, // Use provided class or default to grade
      role: "student",
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    // If specific class was provided, add student to that class
    if (args.class) {
      const classRecord = await ctx.db
        .query("classes")
        .filter((q: any) => q.eq(q.field("name"), args.class))
        .first();
      
      if (classRecord && !classRecord.students.includes(studentId)) {
        await ctx.db.patch(classRecord._id, {
          students: [...classRecord.students, studentId],
          updatedAt: Date.now(),
        });
      }
    }

    return studentId;
  },
});

// Bulk create students (updated to include automatic class creation)
export const bulkCreateStudents = mutation({
  args: {
    students: v.array(v.object({
      name: v.string(),
      grade: v.string(),
      school: v.string(),
      username: v.string(),
      password: v.string(),
      class: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const studentIds: any[] = [];
    
    // First, create all necessary classes
    const uniqueGrades = Array.from(new Set(args.students.map(s => s.grade)));
    for (const grade of uniqueGrades) {
      await createOrGetClass(ctx, grade);
    }
    
    for (const student of args.students) {
      // Check if username already exists
      const existingUsername = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("username"), student.username))
        .first();

      if (existingUsername) {
        throw new Error(`User with username ${student.username} already exists`);
      }

      const studentId = await ctx.db.insert("users", {
        name: student.name,
        grade: student.grade,
        school: student.school,
        username: student.username,
        password: student.password,
        class: student.class || student.grade,
        role: "student",
        isApproved: true,
        registrationDate: Date.now(),
        approvalDate: Date.now(),
      });

      // Add student to class
      await addStudentToClass(ctx, studentId, student.grade);
      
      studentIds.push(studentId);
    }

    return { message: `Successfully created ${studentIds.length} students`, studentIds };
  },
});

// Get all classes
export const getAllClasses = query({
  args: {},
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();
    
    // Get student and teacher details for each class
    const classesWithDetails = await Promise.all(
      classes.map(async (classRecord) => {
        const students = await Promise.all(
          classRecord.students.map(async (studentId) => {
            const student = await ctx.db.get(studentId);
            return student;
          })
        );
        
        // Get teacher information if assigned
        let teacherName = "Not assigned";
        if (classRecord.teacherId) {
          const teacher = await ctx.db.get(classRecord.teacherId);
          teacherName = teacher?.name || "Not assigned";
        }
        
        return {
          ...classRecord,
          studentDetails: students.filter(Boolean), // Remove null students
          teacherName, // Add teacher name
        };
      })
    );

    return classesWithDetails;
  },
});

// Update student details
export const updateStudent = mutation({
  args: {
    studentId: v.id("users"),
    name: v.optional(v.string()),
    grade: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    class: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { studentId, ...updates } = args;
    
    // Get current student data
    const currentStudent = await ctx.db.get(studentId);
    if (!currentStudent) {
      throw new Error("Student not found");
    }

    // If grade is being updated, handle class changes
    if (updates.grade && updates.grade !== currentStudent.grade) {
      // Remove from old class
      const oldClass = await ctx.db
        .query("classes")
        .filter((q: any) => q.eq(q.field("grade"), currentStudent.grade))
        .first();
      
      if (oldClass) {
        await ctx.db.patch(oldClass._id, {
          students: oldClass.students.filter(id => id !== studentId),
        });
      }

      // Add to new class
      await addStudentToClass(ctx, studentId, updates.grade);
    }

    // Update student record
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(studentId, {
      ...filteredUpdates,
    });

    return { success: true };
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    return await ctx.db.query("users").collect();
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    targetUserId: v.id("users"),
    newRole: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    await ctx.db.patch(args.targetUserId, {
      role: args.newRole,
    });

    return { success: true };
  },
});

// Create dedicated admin account
export const createAdminAccount = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(), // In a real app, this would be hashed
  },
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    if (existingAdmin) {
      throw new Error("Admin account already exists");
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const adminId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      grade: "Admin", // Special grade for admin
      role: "admin",
      isApproved: true, // Admin is auto-approved
      registrationDate: Date.now(),
      // Store password temporarily - in production this should be hashed
      tempPassword: args.password,
    });

    return { success: true, adminId };
  },
});

// Update user profile (for onboarding)
export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    grade: v.string(),
    school: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      name: args.name,
      grade: args.grade,
      school: args.school,
    });

    return { success: true };
  },
});

// Admin login function
export const adminLogin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Invalid admin credentials");
    }

    // Check password (in production, compare with hashed password)
    if (admin.tempPassword !== args.password) {
      throw new Error("Invalid admin credentials");
    }

    return { success: true, admin };
  },
});

// Get all approved students (for school dashboard)
export const getAllApprovedStudents = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "student"),
          q.eq(q.field("isApproved"), true)
        )
      )
      .collect();

    return students;
  },
});

// Delete a student (admin only)
export const deleteStudent = mutation({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Remove student from class
    if (student.grade) {
      const classRecord = await ctx.db
        .query("classes")
        .filter((q: any) => q.eq(q.field("grade"), student.grade))
        .first();
      
      if (classRecord) {
        await ctx.db.patch(classRecord._id, {
          students: classRecord.students.filter((id: any) => id !== args.studentId),
          updatedAt: Date.now(),
        });
      }
    }

    // Delete the student
    await ctx.db.delete(args.studentId);
    return { success: true };
  },
});

// Create a new class (admin only)
export const createClass = mutation({
  args: {
    name: v.string(),
    grade: v.string(),
    teacherId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if class with same name already exists
    const existingClass = await ctx.db
      .query("classes")
      .filter((q: any) => q.eq(q.field("name"), args.name))
      .first();

    if (existingClass) {
      throw new Error("A class with this name already exists");
    }

    // Validate teacher if provided
    if (args.teacherId) {
      const teacher = await ctx.db.get(args.teacherId);
      if (!teacher || teacher.role !== "teacher") {
        throw new Error("Invalid teacher selected");
      }
    }

    const classId = await ctx.db.insert("classes", {
      name: args.name,
      grade: args.grade,
      students: [],
      teacherId: args.teacherId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // If teacher is assigned, update their assigned classes
    if (args.teacherId) {
      const teacher = await ctx.db.get(args.teacherId);
      if (teacher) {
        const currentClasses = teacher.assignedClasses || [];
        await ctx.db.patch(args.teacherId, {
          assignedClasses: [...currentClasses, classId],
        });
      }
    }

    return classId;
  },
});

// Edit a class (admin only)
export const editClass = mutation({
  args: {
    classId: v.id("classes"),
    name: v.optional(v.string()),
    grade: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const classRecord = await ctx.db.get(args.classId);
    if (!classRecord) {
      throw new Error("Class not found");
    }

    // If name is being changed, check for duplicates
    if (args.name && args.name !== classRecord.name) {
      const existingClass = await ctx.db
        .query("classes")
        .filter((q: any) => q.eq(q.field("name"), args.name))
        .first();

      if (existingClass) {
        throw new Error("A class with this name already exists");
      }
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.grade !== undefined) updates.grade = args.grade;

    await ctx.db.patch(args.classId, updates);
    return { success: true };
  },
});

// Delete a class (admin only)
export const deleteClass = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const classRecord = await ctx.db.get(args.classId);
    if (!classRecord) {
      throw new Error("Class not found");
    }

    // Remove class reference from all students in this class
    for (const studentId of classRecord.students) {
      const student = await ctx.db.get(studentId);
      if (student && student.class === classRecord.name) {
        await ctx.db.patch(studentId, {
          class: student.grade, // Reset to grade as default class
        });
      }
    }

    // Delete the class
    await ctx.db.delete(args.classId);
    return { success: true };
  },
});

// Assign student to specific class
export const assignStudentToClass = mutation({
  args: {
    studentId: v.id("users"),
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    const classRecord = await ctx.db.get(args.classId);

    if (!student || !classRecord) {
      throw new Error("Student or class not found");
    }

    // Remove student from all other classes first
    const allClasses = await ctx.db.query("classes").collect();
    for (const otherClass of allClasses) {
      if (otherClass._id !== args.classId && otherClass.students.includes(args.studentId)) {
        await ctx.db.patch(otherClass._id, {
          students: otherClass.students.filter(id => id !== args.studentId),
          updatedAt: Date.now(),
        });
      }
    }

    // Add student to the new class if not already there
    if (!classRecord.students.includes(args.studentId)) {
      await ctx.db.patch(args.classId, {
        students: [...classRecord.students, args.studentId],
        updatedAt: Date.now(),
      });
    }

    // Update student's class field
    await ctx.db.patch(args.studentId, {
      class: classRecord.name,
    });

    return { success: true };
  },
});

// Remove student from class
export const removeStudentFromClass = mutation({
  args: {
    studentId: v.id("users"),
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    const classRecord = await ctx.db.get(args.classId);

    if (!student || !classRecord) {
      throw new Error("Student or class not found");
    }

    // Remove student from class
    await ctx.db.patch(args.classId, {
      students: classRecord.students.filter(id => id !== args.studentId),
      updatedAt: Date.now(),
    });

    // Reset student's class to their grade
    await ctx.db.patch(args.studentId, {
      class: student.grade,
    });

    return { success: true };
  },
});

// Get available students for class assignment (not assigned to any specific class)
export const getAvailableStudentsForClass = query({
  args: { classId: v.optional(v.id("classes")) },
  handler: async (ctx, args) => {
    const allStudents = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("role"), "student"),
          q.eq(q.field("isApproved"), true)
        )
      )
      .collect();

    const allClasses = await ctx.db.query("classes").collect();
    
    // Get students that are not assigned to any specific class (except the current one being edited)
    const assignedStudentIds = new Set();
    for (const classRecord of allClasses) {
      if (!args.classId || classRecord._id !== args.classId) {
        classRecord.students.forEach(studentId => assignedStudentIds.add(studentId));
      }
    }

    return allStudents.filter(student => !assignedStudentIds.has(student._id));
  },
});

// Get classes that exist for validation during registration
export const getExistingClassNames = query({
  args: {},
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();
    return classes.map(c => c.name).filter(name => name && !name.includes('�'));
  },
});

// Get all approved students with quiz scores for leaderboard
export const getAllStudentsWithQuizScores = query({
  args: {},
  handler: async (ctx) => {
    // Get all approved students
    const allStudents = await ctx.db
      .query("users")
      .filter((q) => q.and(
        q.eq(q.field("role"), "student"),
        q.eq(q.field("isApproved"), true)
      ))
      .collect();

    // Get quiz scores for each student
    const studentsWithScores = await Promise.all(
      allStudents.map(async (student) => {
        const quizSessions = await ctx.db
          .query("quizSessions")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .collect();

        // Calculate average score and cap at 100% to prevent data anomalies
        const rawAverage = quizSessions.length > 0
          ? quizSessions.reduce((sum, session) => sum + Math.min(session.score, 100), 0) / quizSessions.length
          : 0;
        const averageScore = Math.min(Math.round(rawAverage), 100);

        const totalQuizzes = quizSessions.length;

        return {
          _id: student._id,
          name: student.name,
          username: student.username,
          grade: student.grade,
          class: student.class || "N/A",
          averageScore,
          totalQuizzes,
        };
      })
    );

    // Sort by average score (descending), then by total quizzes
    return studentsWithScores.sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.totalQuizzes - a.totalQuizzes;
    });
  },
});

// TEMP: One-time export for migration (remove after use)
export const exportAllUsersWithSecret = query({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    // One-time key (change this to something random)
    const EXPORT_KEY = "jsps-export-2026-02-08";

    if (args.secret !== EXPORT_KEY) {
      return [];
    }

    return await ctx.db.query("users").collect();
  },
});







